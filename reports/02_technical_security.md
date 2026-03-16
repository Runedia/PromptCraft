# 기술 및 보안 아키텍처 분석 보고서
**프로젝트**: PromptCraft
**작성자**: 기술 및 보안 아키텍트
**작성일**: 2026-03-09

---

## 목차

1. [기술 스택의 적절성 및 확장성 평가](#1-기술-스택의-적절성-및-확장성-평가)
2. [데이터 흐름 기반의 보안 취약점 진단](#2-데이터-흐름-기반의-보안-취약점-진단)
3. [예상되는 기술적 병목 구간 및 리소스 소요 예측](#3-예상되는-기술적-병목-구간-및-리소스-소요-예측)

---

## 1. 기술 스택의 적절성 및 확장성 평가

### 1.1 전체 기술 스택 요약 및 적합도

| 영역 | 선택 기술 | 적합도 | 판정 근거 |
|------|-----------|--------|-----------|
| CLI | Commander.js + Inquirer.js | **적합** | Node.js CLI 생태계의 사실상 표준. 분기 질의응답에 Inquirer.js의 대화형 프롬프트가 정확히 부합 |
| 클립보드 | clipboardy | **적합** | 크로스 플랫폼 클립보드 접근의 유일한 안정적 선택지. Windows 환경 우선이므로 적합 |
| 터미널 출력 | chalk | **적합** | 색상 출력 표준 라이브러리. ESM 전용(v5+)이므로 프로젝트 모듈 시스템과 정합성 확인 필요 |
| API 서버 | Express 4.x | **적합** | 로컬 전용 REST API 래핑 용도로 과하지도 부족하지도 않음. 생태계 성숙도 최상위 |
| Core Logic | Node.js 라이브러리 계층 | **적합** | CLI/API 양쪽에서 직접 호출 가능한 순수 라이브러리 설계는 헥사고날 아키텍처의 올바른 적용 |
| Web UI | React + Vite | **적합** | SPA로 로컬 폼 기반 질의응답 UI 구현에 적합. Vite의 빠른 빌드는 개발 생산성에 기여 |
| DB | SQLite (better-sqlite3) | **적합** | 로컬 설치형 도구에 별도 DB 서버 불필요. 동기 API로 CLI 환경에서 간결한 코드 가능 |
| 템플릿 | Handlebars | **적합** | 로직 분리형 템플릿 엔진으로 프롬프트/컨텍스트 파일 생성에 적절. 커스텀 헬퍼 확장 용이 |

### 1.2 기술 스택별 강점 분석

#### Node.js 단일 스택의 강점

- **배포 단순화**: `npm install -g` 한 줄로 설치 완료. Python 혼용 시 발생하는 런타임 의존성 문제를 원천 차단
- **코드 공유**: Core Logic을 CLI와 API 서버가 동일한 `require()`/`import`로 참조. IPC(Inter-Process Communication) 오버헤드 없음
- **팀 역량 집중**: 4인 팀이 단일 언어에 집중하여 코드 리뷰, 디버깅, 지식 공유 효율 극대화
- **better-sqlite3 동기 API**: CLI 환경에서 async/await 없이 직관적인 DB 접근 가능. 콜백 지옥이나 프로미스 체이닝 불필요

#### React + Vite의 강점

- **HMR(Hot Module Replacement)**: 개발 중 UI 변경사항 즉시 반영으로 프론트엔드 개발 속도 향상
- **빌드 결과물 정적 서빙**: Express가 `web/build/` 디렉토리를 정적 파일로 서빙하여 별도 프론트엔드 서버 불필요
- **컴포넌트 기반 설계**: 분기 질의응답 UI의 각 질문 유형(text, textarea, select, multiselect, confirm)을 독립 컴포넌트로 구현 가능

### 1.3 기술 스택별 약점 및 위험 요소

| 기술 | 약점/위험 | 위험도 | 영향 범위 |
|------|-----------|--------|-----------|
| chalk v5+ | ESM 전용 패키지. 프로젝트가 CommonJS(require)라면 호환 불가 | **높음** | CLI 전체 |
| clipboardy v4+ | ESM 전용. chalk와 동일 문제 발생 가능 | **높음** | CLI 클립보드 기능 |
| better-sqlite3 | 네이티브 C++ 바인딩. Windows에서 node-gyp 빌드 환경(Visual Studio Build Tools, Python) 필요 | **중간** | 설치 단계 |
| Inquirer v9+ | ESM 전용. CommonJS 프로젝트에서 동적 import 필요 | **높음** | CLI 대화형 UI |
| Handlebars | 로직 제한적(Logicless). 복잡한 조건부 프롬프트 생성 시 커스텀 헬퍼 과다 필요 | **낮음** | 프롬프트 빌더 |
| SQLite | 다중 프로세스 동시 쓰기 시 SQLITE_BUSY 에러 가능 (CLI + Web 동시 사용) | **중간** | DB 접근 전체 |

**ESM/CommonJS 호환성 문제 상세 분석**:

PRD와 아키텍처 문서에서 Commander.js(v12+), chalk(v5+), clipboardy(v4+), Inquirer(v9+) 모두 ESM 전용 패키지로 전환된 버전을 명시하고 있다. 프로젝트의 모듈 시스템이 `package.json`의 `"type": "module"`로 선언되지 않으면, 이 패키지들을 `require()`로 로드할 수 없다. 반면 `better-sqlite3`는 CommonJS를 사용한다. 이 충돌을 해결하려면 다음 중 하나를 선택해야 한다:

| 전략 | 장점 | 단점 |
|------|------|------|
| ESM으로 통일 (`"type": "module"`) | 최신 패키지 모두 호환 | better-sqlite3 등 CJS 패키지에 `createRequire()` 필요 |
| CommonJS로 유지 + ESM 패키지 구버전 사용 | 기존 Node.js 생태계 호환 | chalk v4, inquirer v8 등 구버전 고정. 보안 패치 미적용 위험 |
| CommonJS + 동적 import (`await import()`) | CJS 베이스 유지하면서 ESM 패키지 사용 | 모든 ESM 패키지 호출부에 async 래퍼 필요. 코드 복잡도 증가 |

**권장**: ESM으로 통일하되, `better-sqlite3`는 `createRequire()`로 로드하는 방식이 장기적으로 가장 안정적이다.

### 1.4 확장성 평가

#### 수평 확장 시나리오별 평가

| 확장 시나리오 | 현재 설계의 대응력 | 필요 조치 | 난이도 |
|--------------|-------------------|-----------|--------|
| 새로운 분기 트리 추가 | **우수** | `data/trees/`에 JSON 파일 추가만으로 가능 | 낮음 |
| 새로운 컨텍스트 파일 포맷 추가 (.cursorrules 등) | **우수** | `data/templates/`에 HBS 파일 + `src/core/context/formats/`에 포맷 정의 추가 | 낮음 |
| 선택적 AI 연결 (P2) | **양호** | `src/core/` 하위에 AI 어댑터 모듈 추가. Core Logic의 순수성 유지하면서 선택적 주입 가능 | 중간 |
| 다국어 UI 지원 | **미흡** | 현재 한국어 하드코딩 예상. i18n 프레임워크(react-i18next) 도입 + 분기 트리 JSON의 question 필드 다국어화 필요 | 높음 |
| 팀/클라우드 공유 기능 | **미흡** | SQLite → PostgreSQL/Supabase 마이그레이션, 인증 시스템 도입, API 서버 외부 공개 시 전면 보안 재설계 필요 | 매우 높음 |
| 플러그인 시스템 | **미흡** | 현재 모듈 구조는 내부 확장에 최적화. 외부 플러그인 로딩/격리/API 계약 정의 등 아키텍처 변경 필요 | 높음 |

#### 수직 확장(성능) 평가

- **Scanner 성능**: Node.js의 `fs` 모듈은 단일 프로젝트 스캔에 충분. 그러나 10만 파일 이상 대규모 모노레포 스캔 시 동기 I/O 병목 가능. `glob` v10의 스트림 API 활용 권장
- **DB 성능**: SQLite는 단일 사용자 로컬 도구에 충분. 히스토리 1만 건 이하에서 LIKE 검색도 100ms 이내 응답 가능. 그 이상은 FTS5(Full-Text Search) 확장 고려
- **메모리**: QnA 세션이 메모리 Map으로 관리되므로 동시 세션 수에 비례하여 메모리 증가. 로컬 단일 사용자 환경에서는 문제없으나, 세션 GC(Garbage Collection) 미구현 시 장시간 서버 운영 시 누수 위험

---

## 2. 데이터 흐름 기반의 보안 취약점 진단

### 2.1 위협 모델 개요

PromptCraft는 로컬 전용 도구이므로, 전통적인 웹 애플리케이션 위협 모델(OWASP Top 10)의 일부만 적용된다. 그러나 "로컬 전용"이라는 전제가 깨질 수 있는 시나리오를 포함하여 분석한다.

```
[위협 범위]
├── 네트워크 위협: 로컬 서버가 외부에 노출되는 경우
├── 입력 위협: 악의적 입력을 통한 시스템 접근
├── 데이터 위협: 민감 정보(API Key, 프로젝트 소스) 유출
└── 의존성 위협: 서드파티 패키지의 취약점
```

### 2.2 취약점 상세 진단

#### [VULN-01] Express 서버 네트워크 바인딩 - 위험도: **Critical**

| 항목 | 내용 |
|------|------|
| 위치 | `src/api/index.js` (Express 앱 설정) |
| 위협 | Express 기본 설정은 `0.0.0.0`(모든 인터페이스)에 바인딩. 동일 네트워크 내 공격자가 `http://{피해자IP}:3000/api/scan`으로 파일 시스템 구조 탈취 가능 |
| 공격 시나리오 | 1. 공용 Wi-Fi 환경에서 PromptCraft 웹 서버 실행 → 2. 공격자가 네트워크 스캔으로 3000 포트 발견 → 3. `/api/scan` 호출로 프로젝트 구조 확인 → 4. `/api/config`로 암호화된 API Key 접근 시도 |
| 대응 방안 | `app.listen(3000, '127.0.0.1')` 명시적 루프백 바인딩 **필수** |
| 우선순위 | **P0 - 구현 즉시 적용** |

#### [VULN-02] POST /api/scan의 경로 조작(Path Traversal) - 위험도: **Critical**

| 항목 | 내용 |
|------|------|
| 위치 | `src/api/routes/scan.js` → `src/core/scanner/index.js` |
| 위협 | 요청 본문의 `path` 파라미터에 `"C:\\Windows\\System32"` 또는 `"../../etc"` 등 임의 경로 입력 시, 시스템 디렉토리 구조가 응답으로 노출 |
| 공격 시나리오 | 악의적 사용자가 아닌 경우에도, VULN-01과 결합 시 원격 공격자가 서버의 파일 시스템 전체를 탐색 가능 |
| 대응 방안 | (1) 스캔 대상 경로를 사용자 홈 디렉토리 이하로 제한하는 화이트리스트 검증, (2) `path.resolve()` 후 상위 디렉토리 이탈 여부 검사, (3) 시스템 디렉토리(`C:\Windows`, `/etc`, `/usr`) 블랙리스트 적용 |
| 우선순위 | **P0 - VULN-01과 함께 필수 적용** |

#### [VULN-03] POST /api/context/generate의 파일 쓰기 경로 조작 - 위험도: **High**

| 항목 | 내용 |
|------|------|
| 위치 | `src/api/routes/context.js` → `src/core/context/generator.js` |
| 위협 | `outputPath` 파라미터에 임의 경로를 지정하여 시스템 파일 덮어쓰기 가능. 예: `"outputPath": "C:\\Windows\\System32"` |
| 공격 시나리오 | VULN-01과 결합 시, 원격 공격자가 피해자 시스템의 임의 위치에 파일 생성/덮어쓰기 가능 |
| 대응 방안 | (1) outputPath가 실제 프로젝트 디렉토리(scanResult.path) 하위인지 검증, (2) 기존 파일 덮어쓰기 전 확인 로직(이미 설계에 diff 비교 포함), (3) 쓰기 대상 파일명을 CLAUDE.md/GEMINI.md/.cursorrules로 고정 |
| 우선순위 | **P0** |

#### [VULN-04] API Key 암호화 구현 미정 - 위험도: **High**

| 항목 | 내용 |
|------|------|
| 위치 | `src/core/db/repositories/config.js`, config 테이블의 `ai.apiKey` |
| 위협 | DB 스키마에서 `"encrypted:..."` 형식으로 저장한다고 명시했으나 구현 방식이 미정. 대칭 암호화의 키 관리가 로컬 환경에서 본질적으로 어려움 |
| 분석 | 로컬 SQLite 파일에 저장된 암호화 키는 결국 같은 로컬 머신에 키가 존재해야 하므로, 공격자가 DB 파일에 접근 가능하면 키도 접근 가능. 완전한 보안은 불가능 |
| 대응 방안 | (1) Windows Credential Manager(node-keytar) 또는 OS 수준 키 저장소 활용, (2) 불가능할 경우 AES-256-GCM + 머신별 고유 키(hostname + username 해시) 조합으로 난독화 수준 보호, (3) API Key는 환경 변수 입력을 권장하고 DB 저장은 선택적으로 제공 |
| 우선순위 | **P1 - 선택적 AI 연결(P2) 구현 시점에 결정** |

#### [VULN-05] Handlebars 템플릿 인젝션 - 위험도: **Medium**

| 항목 | 내용 |
|------|------|
| 위치 | `src/core/prompt/builder.js`, `data/templates/*.hbs` |
| 위협 | 사용자가 QnA 응답에 Handlebars 구문(`{{`, `}}`)을 포함할 경우, 템플릿 렌더링 시 의도치 않은 헬퍼 실행 또는 렌더링 오류 발생 가능 |
| 공격 시나리오 | 에러 메시지 입력에 `{{#each process.env}}{{@key}}={{this}}{{/each}}`와 같은 Handlebars 구문 삽입 시, 서버 환경 변수 노출 가능(Handlebars의 프로토타입 접근 설정에 따라 다름) |
| 대응 방안 | (1) Handlebars 컴파일 시 `noPrototypeProperties: true`, `noPrototypeMethodProperties: true` 옵션 적용, (2) 사용자 입력값은 `Handlebars.Utils.escapeExpression()`으로 이스케이프 후 삽입, (3) 사용자 입력은 `{{{raw}}}` triple-stash 대신 `{{escaped}}` double-stash로 처리 |
| 우선순위 | **P0 - 프롬프트 빌더 구현 시 즉시 적용** |

#### [VULN-06] CORS 설정 부재/과잉 - 위험도: **Medium**

| 항목 | 내용 |
|------|------|
| 위치 | `src/api/index.js` (cors 미들웨어) |
| 위협 | CORS를 `*`로 열어두면, 사용자가 악성 웹사이트 방문 시 JavaScript로 `localhost:3000` API 호출 가능(CSRF와 유사) |
| 공격 시나리오 | 1. 사용자가 악성 사이트 방문 → 2. 사이트의 JS가 `fetch('http://localhost:3000/api/config')` 호출 → 3. API Key 등 설정 정보 탈취 |
| 대응 방안 | (1) CORS origin을 `http://localhost:3000`으로 한정, (2) Vite 개발 서버 사용 시 `http://localhost:5173`도 추가, (3) 프로덕션에서는 Express가 정적 파일을 직접 서빙하므로 동일 출처로 CORS 불필요 |
| 우선순위 | **P0** |

#### [VULN-07] QnA 세션 ID 예측 가능성 - 위험도: **Low**

| 항목 | 내용 |
|------|------|
| 위치 | `src/core/qna/index.js` (UUID v4 생성) |
| 위협 | UUID v4는 암호학적으로 안전한 난수 기반이므로 예측 불가. 다만 세션 ID가 URL이나 응답에 노출 시 재사용 가능 |
| 대응 방안 | 로컬 단일 사용자 환경에서 실질적 위험은 낮음. VULN-01 해결 시 외부 접근이 차단되므로 추가 조치 불필요 |
| 우선순위 | **P2 - 현재 위험 수준에서는 조치 불필요** |

#### [VULN-08] 의존성 공급망 공격 - 위험도: **Medium**

| 항목 | 내용 |
|------|------|
| 위치 | `package.json` 전체 의존성 트리 |
| 위협 | npm 패키지의 악성 코드 삽입(typosquatting, 계정 탈취 등). 특히 `better-sqlite3`의 네이티브 바인딩은 빌드 시 임의 코드 실행 가능 |
| 대응 방안 | (1) `npm audit` 정기 실행 CI 파이프라인 구성, (2) `package-lock.json` 커밋으로 의존성 고정, (3) 주요 패키지 버전을 정확 버전(`12.1.0`)으로 고정하되 보안 패치는 주기적 업데이트 |
| 우선순위 | **P1** |

### 2.3 보안 취약점 우선순위 매트릭스

| 위험도 | 취약점 ID | 설명 | VULN-01 의존 여부 | 조치 시점 |
|--------|-----------|------|-------------------|-----------|
| Critical | VULN-01 | Express 네트워크 바인딩 | 독립 | MVP 개발 시작 즉시 |
| Critical | VULN-02 | Path Traversal (스캔) | 단독으로도 위험, VULN-01 결합 시 Critical | MVP 스캐너 구현 시 |
| High | VULN-03 | Path Traversal (파일 쓰기) | VULN-01 결합 시 High | 컨텍스트 생성기 구현 시 |
| High | VULN-04 | API Key 암호화 미정 | 독립 | P2 기능 구현 시 |
| Medium | VULN-05 | 템플릿 인젝션 | 독립 | 프롬프트 빌더 구현 시 |
| Medium | VULN-06 | CORS 과잉 허용 | VULN-01과 결합 | API 서버 초기 설정 시 |
| Low | VULN-07 | 세션 ID 예측 | VULN-01 해결 시 무력화 | 조치 불필요 |
| Medium | VULN-08 | 의존성 공급망 | 독립 | CI/CD 구성 시 |

### 2.4 데이터 흐름별 보안 체크리스트

```
[사용자 입력] ──► [API/CLI] ──► [Core Logic] ──► [DB/파일시스템] ──► [응답]
     │                │               │                 │               │
     ▼                ▼               ▼                 ▼               ▼
  입력 검증        인증/인가      비즈니스 로직     데이터 보호      출력 이스케이프
```

| 데이터 흐름 구간 | 검증 항목 | 현재 설계 상태 | 보완 필요 |
|-----------------|-----------|---------------|-----------|
| 사용자 → POST /api/scan | path 파라미터 검증 | `src/api/middleware/validation.js` 존재하나 구현 미정 | Path Traversal 방지 필수 |
| 사용자 → POST /api/qna/answer | answer 값 검증 | QnA Engine의 `validator.js`에서 type별 검증 예정 | 최대 길이 제한 추가 권장 |
| POST /api/prompt/build → DB | scanResult/answers JSON 저장 | JSON.stringify 후 TEXT 컬럼 저장 | SQL Injection 위험 없음(better-sqlite3 prepared statement 사용 시) |
| POST /api/context/generate → 파일시스템 | outputPath로 파일 생성 | 검증 로직 미정 | 경로 제한 필수 |
| GET /api/config → 응답 | API Key 포함 설정 반환 | 전체 config 반환 | API Key는 마스킹 처리하여 반환(`sk-...****`) |
| PUT /api/config → DB | API Key 저장 | `"encrypted:..."` 형식 명시 | 암호화 구현 필요 |

---

## 3. 예상되는 기술적 병목 구간 및 리소스 소요 예측

### 3.1 프로젝트 스캔 성능 병목

#### 병목 구간 분석

| 단계 | 작업 | 예상 소요 시간 | 병목 요인 |
|------|------|---------------|-----------|
| 1. 디렉토리 순회 | `glob` 패턴 매칭으로 파일 목록 수집 | 0.5 ~ 3초 | 파일 수, 디렉토리 깊이 |
| 2. 확장자 집계 | 파일 목록에서 언어별 카운트 | < 0.1초 | 무시 가능 |
| 3. 설정 파일 파싱 | package.json, pom.xml 등 읽기 + 파싱 | 0.1 ~ 0.5초 | 파일 크기 |
| 4. 디렉토리 트리 생성 | depth 2 수준 트리 구조화 | < 0.1초 | 무시 가능 |
| 5. 캐시 해시 계산 | 파일 목록 + mtime 기반 해시 | 0.5 ~ 2초 | **주요 병목** |
| **합계** | | **1.2 ~ 5.7초** | 5초 요구사항 초과 위험 |

#### 시나리오별 성능 예측

| 프로젝트 규모 | 예상 파일 수 (제외 후) | 예상 스캔 시간 | 5초 충족 여부 |
|--------------|----------------------|--------------|--------------|
| 소규모 (개인 프로젝트) | 50 ~ 200 | < 1초 | 충족 |
| 중규모 (팀 프로젝트) | 200 ~ 2,000 | 1 ~ 3초 | 충족 |
| 대규모 (모노레포) | 2,000 ~ 50,000 | 3 ~ 15초 | **미충족 위험** |

#### 최적화 전략

| 전략 | 효과 | 구현 난이도 | 우선순위 |
|------|------|------------|----------|
| `scan.ignorePatterns` 조기 적용 (glob 패턴에 ignore 포함) | 파일 수 70~90% 감소 | 낮음 | **P0** |
| 캐시 해시를 주요 설정 파일(package.json 등)의 mtime만으로 계산 | 해시 시간 90% 감소 | 낮음 | **P0** |
| 디렉토리 순회를 스트림 방식으로 전환 (glob v10 `stream()`) | 메모리 사용량 감소, 대규모 프로젝트 안정성 | 중간 | P1 |
| 스캔 진행률 표시 (CLI: ora 스피너, Web: progress bar) | 체감 대기 시간 감소 (실제 시간 불변) | 낮음 | P1 |

### 3.2 QnA 메모리 세션 관리 병목

#### 세션 메모리 사용량 추정

```
단일 QnA 세션 크기:
  sessionId (UUID)       : ~36 bytes
  treeId                 : ~20 bytes
  currentNodeId          : ~30 bytes
  answers 객체           : ~500 bytes ~ 5 KB (사용자 입력 길이에 따라)
  scanResult 참조        : ~2 KB ~ 10 KB
  메타데이터(timestamp 등): ~100 bytes
  ─────────────────────────
  합계                   : ~3 KB ~ 16 KB / 세션
```

| 시나리오 | 동시 세션 수 | 메모리 사용량 | 위험 수준 |
|---------|------------|-------------|-----------|
| 로컬 단일 사용자 | 1 ~ 3 | < 50 KB | 없음 |
| 장시간 서버 방치 (세션 GC 미구현) | 누적 100+ | ~1.6 MB | **낮음 (그러나 원칙적 누수)** |
| 브라우저 탭 반복 열기/닫기 | 누적 1,000+ | ~16 MB | **중간** |

#### 세션 GC 구현 권장사항

```
권장 구현:
- setInterval(cleanExpiredSessions, 5 * 60 * 1000)  // 5분마다 실행
- 세션별 lastAccessedAt 필드 관리
- TTL(30분) 초과 세션 Map에서 delete
- 서버 종료 시 clearInterval 호출
```

| 전략 | 장점 | 단점 |
|------|------|------|
| 주기적 GC (setInterval) | 간단 구현, 메모리 상한 예측 가능 | 타이머 오버헤드(미미) |
| 접근 시 Lazy 삭제 | GC 로직 불필요 | 접근되지 않는 세션은 영원히 잔류 |
| LRU 캐시 (lru-cache 패키지) | 최대 세션 수 하드 제한 | 추가 의존성 |

**권장**: 주기적 GC + 최대 세션 수 하드 제한(예: 50개) 병행. 로컬 도구에서 50개 이상 동시 세션은 비정상 상태이므로 초과 시 가장 오래된 세션 제거.

### 3.3 SQLite DB 부하 분석

#### 작업별 DB 부하 예측

| 작업 | 빈도 | 쿼리 유형 | 예상 소요 시간 | 부하 수준 |
|------|------|-----------|--------------|-----------|
| 프롬프트 저장 (INSERT) | 프롬프트 생성 시 1회 | INSERT 1건 (JSON 포함) | < 5ms | 낮음 |
| 히스토리 목록 조회 | 페이지 접근 시 | SELECT + ORDER BY + LIMIT | < 10ms | 낮음 |
| 히스토리 검색 (LIKE) | 검색 시 | LIKE 패턴 매칭 (전체 스캔) | 10 ~ 100ms (데이터량 의존) | **중간** |
| 스캔 캐시 조회 | 스캔 시 1회 | PK 기반 SELECT | < 1ms | 없음 |
| 스캔 캐시 저장 | 스캔 완료 시 | UPSERT 1건 | < 5ms | 낮음 |
| 설정 읽기/쓰기 | 설정 변경 시 | PK 기반 SELECT/UPSERT | < 1ms | 없음 |
| 템플릿 CRUD | 템플릿 관리 시 | 기본 CRUD | < 5ms | 낮음 |

#### 동시 접근 시나리오 (CLI + Web 동시 사용)

| 시나리오 | 위험 | 대응 방안 |
|---------|------|-----------|
| CLI에서 프롬프트 저장 + Web에서 히스토리 조회 | 읽기/쓰기 동시 → SQLITE_BUSY 가능 | WAL 모드 활성화 |
| CLI에서 스캔 캐시 저장 + Web에서 스캔 캐시 조회 | 동일 row 경쟁 | WAL 모드 + busy_timeout 설정 |
| 양쪽에서 설정 동시 변경 | 마지막 쓰기 우선(Last Write Wins) | 로컬 단일 사용자이므로 허용 가능 |

**WAL 모드 적용 방법**:
```
DB 연결 초기화 시:
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;  // 5초 대기 후 SQLITE_BUSY 반환
```

WAL 모드 적용 시 읽기/쓰기 동시성이 크게 향상되며, 로컬 도구 수준에서 사실상 모든 동시 접근 문제가 해결된다.

#### 히스토리 데이터 증가 시 성능 예측

| 히스토리 건수 | LIKE 검색 시간 | 디스크 사용량 (추정) | 조치 필요 여부 |
|-------------|--------------|-------------------|--------------|
| 100건 이하 | < 10ms | < 1 MB | 불필요 |
| 1,000건 | 10 ~ 50ms | ~10 MB | 불필요 |
| 10,000건 | 50 ~ 200ms | ~100 MB | FTS5 인덱스 고려 |
| 100,000건 | 1 ~ 5초 | ~1 GB | FTS5 필수 또는 오래된 데이터 아카이브 |

로컬 도구 특성상 일일 프롬프트 생성 횟수가 10~30회로 예상되므로, 10,000건 도달에 약 1~3년 소요. MVP 단계에서는 LIKE 검색으로 충분하며, 향후 FTS5 마이그레이션을 고려한 인터페이스 설계를 권장한다.

### 3.4 리소스 소요 예측 (개발 공수)

#### 모듈별 개발 공수 추정

| 모듈 | 담당 | 예상 공수 (인일) | 위험 요소 | 버퍼 권장 |
|------|------|-----------------|-----------|-----------|
| Scanner (`src/core/scanner/`) | 스캔 담당 | 8 ~ 12일 | glob 패턴 최적화, 다양한 프로젝트 구조 대응 | +3일 |
| QnA Engine (`src/core/qna/`) | QnA 담당 | 10 ~ 15일 | 분기 로직 복잡도, 커스텀 트리 밸리데이션 | +3일 |
| Prompt Builder (`src/core/prompt/`) | QnA 담당 | 5 ~ 8일 | Handlebars 템플릿 설계, 보안 이스케이프 | +2일 |
| Context Generator (`src/core/context/`) | 스캔 담당 | 5 ~ 8일 | 포맷별 템플릿, diff 비교 로직 | +2일 |
| DB 계층 (`src/core/db/`) | API/DB 담당 | 8 ~ 12일 | 마이그레이션 시스템, WAL 설정, CRUD | +2일 |
| CLI (`src/cli/`) | API/DB 담당 | 8 ~ 12일 | ESM 호환성, Inquirer 대화형 흐름 | +3일 |
| API 서버 (`src/api/`) | API/DB 담당 | 6 ~ 10일 | 보안 미들웨어, 에러 핸들링, CORS | +2일 |
| Web UI (`web/`) | 프론트엔드 | 15 ~ 25일 | 질의응답 UI, 히스토리 뷰, 반응형 | +5일 |
| 통합 테스트 | 전원 | 5 ~ 10일 | 모듈 간 인터페이스 불일치 | +3일 |
| **합계** | | **70 ~ 112일** | | **+25일** |

#### 4인 팀 기준 타임라인 대비 리스크

| 기간 | 가용 인일 (4인) | 필요 인일 | 여유도 |
|------|---------------|-----------|--------|
| 3개월 (65 영업일) | 260일 | 70 ~ 112일 | **충분** (P2 제외 시) |
| 4개월 (87 영업일) | 348일 | 95 ~ 137일 (P2 포함) | **충분** |

핵심 리스크는 공수 부족이 아니라 **모듈 간 인터페이스 확정 지연**이다. Core Logic의 입출력 인터페이스(ScanResult, answers 객체 스키마)가 확정되지 않으면 API/CLI/Web UI 개발이 블로킹된다. 1개월차에 인터페이스 계약(TypeScript 타입 정의 또는 JSON Schema)을 확정하는 것이 전체 일정의 핵심 마일스톤이다.

### 3.5 주요 기술적 위험 요약

| 순위 | 위험 | 영향 | 발생 확률 | 완화 전략 |
|------|------|------|-----------|-----------|
| 1 | ESM/CJS 호환성 문제로 빌드 실패 | 전체 프로젝트 지연 | **높음** | 프로젝트 초기에 모듈 시스템 확정 및 모든 패키지 import 테스트 |
| 2 | better-sqlite3 네이티브 빌드 실패 (Windows) | 설치 불가 | **중간** | node-gyp 사전 요구사항 문서화, prebuild 바이너리 확인 |
| 3 | 대규모 프로젝트 스캔 5초 초과 | 비기능 요구사항 미충족 | **중간** | ignorePatterns 조기 적용, 캐시 해시 경량화 |
| 4 | 모듈 간 인터페이스 불일치 | 통합 단계 대규모 재작업 | **중간** | 1개월차 인터페이스 계약 확정, mock 기반 병렬 개발 |
| 5 | Express 보안 설정 누락으로 정보 유출 | 보안 사고 | **낮음** (인지 시) | 개발 초기 보안 미들웨어 템플릿 적용 |

---

## 부록 A: 보안 구현 체크리스트

개발 과정에서 각 모듈 구현 시 아래 체크리스트를 확인한다.

| 체크 항목 | 적용 대상 | 담당 | 완료 |
|-----------|-----------|------|------|
| Express listen을 `127.0.0.1`로 바인딩 | API 서버 | API/DB 담당 | [ ] |
| CORS origin을 localhost로 한정 | API 서버 | API/DB 담당 | [ ] |
| POST /api/scan의 path 파라미터 경로 검증 | Scanner API | API/DB 담당 | [ ] |
| POST /api/context/generate의 outputPath 경로 검증 | Context API | API/DB 담당 | [ ] |
| Handlebars 프로토타입 접근 차단 옵션 적용 | Prompt Builder | QnA 담당 | [ ] |
| 사용자 입력 Handlebars 이스케이프 처리 | Prompt Builder | QnA 담당 | [ ] |
| better-sqlite3 prepared statement 사용 (SQL Injection 방지) | DB 계층 | API/DB 담당 | [ ] |
| SQLite WAL 모드 + busy_timeout 설정 | DB 초기화 | API/DB 담당 | [ ] |
| GET /api/config에서 API Key 마스킹 반환 | Config API | API/DB 담당 | [ ] |
| QnA 세션 GC(가비지 컬렉션) 구현 | QnA Engine | QnA 담당 | [ ] |
| QnA 응답 최대 길이 제한 | QnA Engine | QnA 담당 | [ ] |
| package-lock.json 커밋 | 프로젝트 설정 | 전원 | [ ] |
| npm audit CI 파이프라인 구성 | CI/CD | API/DB 담당 | [ ] |

---

## 부록 B: 권장 PRAGMA 설정

```sql
-- DB 연결 초기화 시 실행
PRAGMA journal_mode = WAL;          -- 읽기/쓰기 동시성 향상
PRAGMA busy_timeout = 5000;         -- 잠금 대기 최대 5초
PRAGMA synchronous = NORMAL;        -- WAL 모드에서 안전하면서 성능 향상
PRAGMA foreign_keys = OFF;          -- FK 미사용 (설계 의도)
PRAGMA cache_size = -2000;          -- 캐시 2MB (기본 2000 페이지 ≒ 8MB보다 절약)
```

---

*본 보고서는 PromptCraft 프로젝트의 설계 문서(PRD.md, architecture.md, api-spec.md, db-schema.md, branch-tree-schema.md)를 기반으로 작성되었으며, 실제 구현 코드가 존재하지 않는 설계 단계의 분석입니다. 구현 진행에 따라 추가적인 보안 감사 및 성능 프로파일링이 필요합니다.*
