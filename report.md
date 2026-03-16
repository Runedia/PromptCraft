# PromptCraft 기획 및 설계 문서 정밀 분석 보고서

## 1. 개요
본 보고서는 PromptCraft 프로젝트의 `PRD.md` 및 `docs` 디렉토리 내 설계 문서(`architecture.md`, `api-spec.md`, `branch-tree-schema.md`, `db-schema.md`)를 분석하여, 내용의 정당성, 유효성, 구현 실현 가능성 및 보완점을 다방면에서 평가한 결과입니다.

---

## 2. 문서 간 정합성 및 유효성 (Consistency & Validity)

### 2.1 기술 스택 불일치 (Critical)
- **문제점**: `PRD.md`에서는 프로젝트 스캔 및 품질 스코어링을 담당하는 언어로 **Python**을 지정하고 역할 분담에도 명시하고 있습니다. 그러나 `architecture.md`의 아키텍처 다이어그램 및 설계 원칙에서는 "MVP 단계에서 **Node.js 단일 스택**으로 구현한다"고 선언하며, 모든 Scanner 폴더 구조(`src/core/scanner`)가 Node.js 기반임을 보여줍니다.
- **판단 및 보완**: 분석기와 서버의 언어가 다르면 프로세스 통신(IPC) 오버헤드나 배포 패키징 크기(Python 런타임 내장 문제 등)가 발생합니다. MVP 달성을 위해 `architecture.md`의 Node.js 단일 스택 방향이 실질적으로 타당하므로, `PRD.md`의 기술 스택 및 역할 분담(Python 부분)을 Node.js로 문서 갱신이 필요합니다.

### 2.2 컴포넌트 간 책임 분리의 타당성
- **긍정적 측면**: `architecture.md`에서 CLI는 API 서버를 경유하지 않고 Core Logic을 직접 호출하고, Web UI는 HTTP API를 통해 Core Logic을 호출하도록 설계된 점은 로컬 애플리케이션으로서 매우 올바른 "헥사고날/클린 아키텍처" 접근입니다. 사용자 응답 지연을 최소화할 수 있습니다.

---

## 3. 구현 관점의 문제점 및 어려움 (Feasibility & Risks)

### 3.1 동시성 차단 및 SQLite 락(Lock) 이슈
- **문제점**: CLI와 Web UI가 동일한 로컬 SQLite DB 파일(`~/.promptcraft/promptcraft.db`)에 접근합니다. 사용자가 웹 UI를 켜둔 상태에서 CLI로 프롬프트를 빌드(DB Write)하면, 동시에 두 프로세스(Express 서버 프로세스 vs CLI 터미널 프로세스)가 SQLite에 접근합니다.
- **해결 방안**: `better-sqlite3` 사용 시 데이터베이스 연결 파일에서 `PRAGMA journal_mode = WAL;` (Write-Ahead Logging) 옵션을 활성화하여 다중 프로세스의 읽기/쓰기 동시성 문제를 방지해야 합니다.

### 3.2 로컬 API 서버의 보안 위협
- **문제점**: `api-spec.md`에서 로컬 전용 서버이므로 인증이 없다고 명시하였습니다. 그러나 Node.js Express를 `0.0.0.0`으로 바인딩할 경우, 동일 네트워크 내 다른 사용자가 `http://{개발자IP}:3000/api/scan`을 호출하여 로컬 파일 시스템 구조와 소스코드의 컨텍스트를 탈취할 수 있습니다.
- **해결 방안**: API 서버 시작 시 반드시 `app.listen(3000, '127.0.0.1')`로 명시적 바인딩하여 외부 네트워크의 접근을 원천 차단해야 합니다.

### 3.3 대용량 디렉토리 해시 연산 오버헤드
- **문제점**: `db-schema.md`의 `scan_cache` 테이블은 `file_hash`를 저장하여 변경을 감지합니다. `node_modules`나 `dist`, `.git`처럼 파일이 수만 개인 폴더의 해시를 재계산하는 것은 치명적인 성능 저하를 야기합니다(스캔 5초 이내 조건 달성 실패 위험).
- **해결 방안**: `scan.ignorePatterns` 처리가 해시 연산 전에 완벽하게 적용되어야 합니다. 또한, 전체 파일 해시를 구하는 대신, `package.json` 등 주요 설정 파일의 `mtime`(수정시간)만 감지하여 캐시를 무효화하는 전략(얕은 스캔)이 구현 난이도 대비 효과가 매우 큽니다.

### 3.4 QnA 메모리 세션 관리 누수 위험
- **문제점**: `api-spec.md` 내용 상 세션을 메모리(Map)로 관리하며 30분 TTL을 적용한다고 하였으나, Web 상태에서 오랫동안 프로세스가 켜져있으면 만료된 세션이 Map에 계속 누적될 수 있습니다 (Memory Leak).
- **해결 방안**: API 설계에 `setInterval`을 이용한 주기적인 만료 세션 가비지 컬렉션(GC) 로직 구현이 반드시 포함되어야 합니다.

---

## 4. 확장성 및 사용자 경험 보완 (UX & Scalability)

### 4.1 커스텀 분기 트리(JSON) 유효성 검사 누락
- **내용**: `branch-tree-schema.md`에서 사용자가 커스텀 JSON 트리를 만들어 확장할 수 있음을 명시했습니다. 하지만 사용자가 오타가 있는 JSON이나 `entryNodeId`가 잘못된 포맷을 제공할 때, 앱이 크래시(Crash)될 우려가 높습니다.
- **보완점**: Core Logic의 QnA Engine 진입 시점에 `Zod`, `Ajv`와 같은 스키마 밸리데이션 라이브러리를 통해 트리 JSON 구조를 엄격하게 검증하고, 오류 시 명확한 에러 메시지(예: "language 노드에서 다음 노드 지정이 잘못되었습니다")를 안내하는 로직이 필요합니다.

### 4.2 AutoFill의 동기화 문제
- **내용**: `ScanResult` 결과를 `autoFill`로 가져오는 기능은 매우 유용하지만, `QnA Answer` 단계에서 사용자가 스캔된 내용을 수정할 수도 있습니다.
- **보완점**: Prompt Builder 단계에서는 단순히 QnA 응답 결과만 병합하지 않고, 사용자가 덮어쓴 `autoFill` 응답 값을 원본 `ScanResult`보다 우선 적용(Override)하는 명시적 우선순위 로직이 설계에 추가되어야 합니다.

---

## 5. 종합 평가

- **기획 완성도**: **매우 높음**. Claude Code의 Skill 기능을 벤치마킹하여 GUI와 CLI를 통해 개발 생태계를 구축하려는 의도가 훌륭하며, 제품의 Use-case가 명확합니다.
- **설계 타당성**: MVP에 맞게 No-auth, 로컬 SQLite, Node.js 단일 스택을 채택한 점과 DB/CLI/API 계층 분리 모듈화는 유지보수성과 확장성이 우수한 실용적 아키텍처입니다.
- **핵심 개선 권고사항**:
  1. `PRD.md`에 남아있는 Python 의존성 내용을 제거하고 Node.js로 일원화 (문서 동기화).
  2. Express 보안 포트 바인딩(`127.0.0.1`) 및 SQLite `WAL` 모드 적용 (보안 및 동시성 문제 해결).
  3. 커스텀 트리 JSON에 대한 런타임 밸리데이션(`Zod` 등) 설계 추가.
  4. 성능 보장을 위해 `scan_cache`에서 무거운 파일 해시 대신, 주요 파일(`package.json`, `.env` 유무 등)의 `mtime` 기반 경량 캐시로 전략 수정.
