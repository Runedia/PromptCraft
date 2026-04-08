# PRD — PromptCraft UI/UX 개편 (Web 전환 + SectionCard 모델)

**버전:** 1.0  
**작성 기준:** PRD 2.2 / UI_UX.md (현행 구현) + 설계 논의  
**범위:** CLI Ink 위자드 → 로컬 웹 서버 기반 Dual-Pane 인터페이스 전환

---

## 1. 개요

### 1.1 개편 배경

현행 CLI 위자드(Ink 기반)의 구조적 제약은 **정보 순차성**이다.  
`TREE_SELECT → PRESET_SELECT → SCAN → QNA → RESULT` 상태 머신은 사용자가 전체 맥락을 확인하지 못한 상태에서 단방향으로 결정을 내리게 강제한다. 결과적으로 다음 문제가 발생한다.

- 이전 단계로 돌아가기 위한 Undo 복잡도
- 섹션 필요 여부를 미리 판단할 수 없음 (빈 헤더 출력 문제)
- 생성 결과를 입력과 동시에 확인 불가
- 터미널 환경의 렌더링 제약 (레이아웃, 마우스 조작 등)

핵심 목표는 **섹션 존재 자체를 사용자가 제어**할 수 있도록 모델을 재설계하고, 입력과 프롬프트 프리뷰를 동시에 제공하는 것이다.

### 1.2 플랫폼 결정

**Electron을 채택하지 않는다.** 근거:

| 항목 | Electron | 로컬 웹 서버 |
|---|---|---|
| 번들 크기 | 200MB+ | 없음 (브라우저 활용) |
| 빌드 파이프라인 | 복잡 | Vite 단일 빌드 |
| 개발 기간 내 완성 가능성 | 낮음 | 높음 |
| 네이티브 OS API 필요 여부 | 불필요 | — |
| 로컬 전용 데이터 보장 | 가능 | 동일하게 가능 |

**채택: `promptcraft serve` — localhost 웹 서버 방식**

```
promptcraft serve
→ Express 서버 실행 (기본 포트 3000)
→ 브라우저 자동 오픈
→ 데이터: 기존 ~/.promptcraft/ 그대로 유지
→ API: localhost REST
```

`promptcraft build`(CLI)는 레거시 호환용으로 유지하되, 메인 UX는 웹으로 전환한다.

### 1.3 핵심 설계 변경 요약

| 항목 | 현행 | 변경 후 |
|---|---|---|
| 플랫폼 | Ink CLI 위자드 | 로컬 웹 (React + Express) |
| 섹션 구조 | Handlebars 고정 템플릿 | SectionCard 동적 조립 |
| 섹션 제어 | 불가 (고정 출력) | 카드 단위 추가/제거/순서 변경 |
| 입력 방식 | 순차 Q&A | 동시 가시 폼 + 카드 풀 선택 |
| 프롬프트 확인 | RESULT 화면(마지막) | 우측 패널 실시간 프리뷰 |
| 분기 로직 | 위자드 상태 전환 | 카드 조건부 활성화 |

---

## 2. 사용자 정의

현행 PRD 2.2의 타겟 사용자는 동일하게 유지한다.  
추가 시나리오:

> 김개발이 `promptcraft serve`를 실행한다. 브라우저가 열리면 상황 유형을 선택하고, 스캔 결과를 기반으로 자동 제안된 섹션 카드들이 활성화된 상태로 시작한다. 불필요한 카드를 제거하고, 풀에서 '빌드 로그' 카드를 추가한다. 각 카드를 채울 때마다 오른쪽 프리뷰가 즉시 갱신된다. 완성 후 복사 버튼을 누른다.

---

## 3. 기능 요구사항

### 3.1 기능 목록 및 우선순위

| 기능 | 설명 | 우선순위 |
|---|---|---|
| 로컬 웹 서버 (`promptcraft serve`) | Express + React 기반 웹 UI 실행 | P0 |
| Dual-Pane 레이아웃 | 좌: 섹션 편집 / 우: 실시간 프롬프트 프리뷰 | P0 |
| SectionCard 모델 | 섹션 단위 추가·제거·순서 변경·값 입력 | P0 |
| 카드 풀 (비활성 섹션 목록) | 트리 타입 + 스캔 결과 기반 제안 카드 | P0 |
| 실시간 프롬프트 빌드 | active 카드 조립 → 마크다운 렌더링 | P0 |
| 트리 선택 화면 | 4개 상황 유형 선택 (카드 그리드 형태) | P0 |
| 프리셋 선택 (카드 그리드) | 트리별 프리셋 카드 선택 → 카드 초기값 prefill | P1 |
| 스캔 통합 | 웹 UI 내 스캔 실행 → stack-environment 카드 자동 채움 | P0 |
| 클립보드 복사 | 완성 프롬프트 복사 | P0 |
| 파일 저장 (`--output` 동등 기능) | 경로 지정 후 저장 | P1 |
| 히스토리 조회 | 기존 SQLite history 테이블 연동 | P1 |
| 템플릿 저장/로드 | 카드 구성 + 값 일괄 저장 재사용 | P1 |
| 다크/라이트 모드 | 시스템 설정 자동 적용 | P2 |
| CLI 레거시 (`promptcraft build`) | 기존 Ink 위자드 유지 (선택적 사용) | P2 |

### 3.2 핵심 기능 상세

#### 3.2.1 SectionCard 모델

프롬프트의 각 섹션은 독립적인 카드 단위로 존재한다.  
카드는 **활성(active)** 또는 **비활성(inactive, 카드 풀에 위치)** 상태를 가진다.

카드 속성:

| 속성 | 타입 | 설명 |
|---|---|---|
| `id` | string | 고유 식별자 |
| `label` | string | UI 표시명 |
| `required` | boolean | 필수 카드 (제거 불가) |
| `active` | boolean | 현재 프롬프트에 포함 여부 |
| `order` | number | 섹션 출력 순서 |
| `inputType` | enum | text / multiline / select / multiline-mention |
| `value` | string | 입력값 |
| `template` | string | 프롬프트 조립용 마크다운 템플릿 |
| `hint` | string? | 입력 힌트 |
| `examples` | string[]? | 예시값 |

프롬프트 빌드 규칙:  
`active === true && value.trim() !== ''` 인 카드만 `order` 오름차순으로 조립.  
빈 값의 active 카드는 프리뷰에서 회색으로 표시하되, 출력에는 포함하지 않는다.

#### 3.2.2 카드 풀 및 자동 제안

카드 풀은 두 신호로 초기 구성된다.

**신호 1 — 트리 타입 정적 매핑:**

| 트리 | 기본 활성 카드 | 풀 카드 |
|---|---|---|
| error-solving | role, goal, stack-environment, error-evidence, tried-methods | current-situation, constraints, build-log, request-log, profiling-data, baseline-metric |
| feature-impl | role, goal, stack-environment, impl-scope | current-situation, target-code, tech-preference, modification-scope, constraints |
| code-review | role, goal, review-code, review-focus | security-context, concern-area, constraints |
| concept-learn | role, goal, concept, skill-level, output-pref | constraints |

**신호 2 — 스캔 결과:**
- 스캔 완료 시 `stack-environment` 카드에 언어/프레임워크 값 자동 채움
- 스캔된 디렉토리 경로 기반 `multiline-mention` 카드의 자동완성 후보 구성

제안 로직은 이 두 신호의 정적 매핑으로 완결한다. 별도 추천 엔진을 구현하지 않는다.

#### 3.2.3 Dual-Pane 레이아웃

```
┌─────────────────────────────────┬──────────────────────────┐
│  LEFT PANE (60%)                │  RIGHT PANE (40%)        │
│                                 │                          │
│  [트리 선택 breadcrumb]          │  실시간 마크다운 프리뷰   │
│                                 │                          │
│  ACTIVE CARDS (드래그 순서 변경) │  ## Role                 │
│  ┌──────────────────────────┐   │  TypeScript 개발자        │
│  │ ● Role       [필수] [─]  │   │                          │
│  │ [입력 컴포넌트]            │   │  ## Goal                 │
│  └──────────────────────────┘   │  렌더링 에러 해결          │
│  ┌──────────────────────────┐   │                          │
│  │ ● Error Evidence    [×]  │   │  ## Stack & Environment  │
│  │ [multiline-mention]       │   │  Next.js 14, pnpm        │
│  └──────────────────────────┘   │                          │
│                                 │  ## Error Evidence       │
│  CARD POOL (추가 가능)           │  (입력 대기 중...)        │
│  [+ 현재 상황] [+ 제약] [+ ...]  │                          │
│                                 │  ─────────────────────── │
│                                 │  토큰 추정: ~380 tokens  │
│                                 │  [클립보드 복사] [저장]   │
└─────────────────────────────────┴──────────────────────────┘
```

- 좌측 패널: 활성 카드 목록 (드래그 앤 드롭 순서 변경)
- 우측 패널: 실시간 마크다운 프리뷰 + 토큰 추정 + 액션 버튼
- 필수 카드(`required: true`): [×] 버튼 미표시, 제거 불가
- 비필수 카드: [×] 버튼으로 카드 풀로 복귀

#### 3.2.4 트리 선택 화면 (진입점)

기존 목록 UI → 카드 그리드 전환.

```
┌────────────────────────────────────────────┐
│  상황을 선택하세요                            │
│                                            │
│  ┌──────────────┐  ┌──────────────┐        │
│  │  🔴 에러 해결  │  │  🟢 기능 구현  │        │
│  │              │  │              │        │
│  │ 런타임/빌드/   │  │ 신규 기능 추가 │        │
│  │ 네트워크 에러  │  │ 또는 수정     │        │
│  └──────────────┘  └──────────────┘        │
│  ┌──────────────┐  ┌──────────────┐        │
│  │  🔵 코드 리뷰  │  │  🟡 개념 학습  │        │
│  │              │  │              │        │
│  │ 보안/성능/    │  │ 기술 개념 이해 │        │
│  │ 스타일 점검   │  │ 및 적용       │        │
│  └──────────────┘  └──────────────┘        │
└────────────────────────────────────────────┘
```

#### 3.2.5 입력 타입별 컴포넌트

현행 CLI 입력 타입을 웹 컴포넌트로 대응한다.

| CLI 타입 | 웹 컴포넌트 | 비고 |
|---|---|---|
| text | `<input type="text">` | |
| multiline | `<textarea>` | 자동 높이 조절 |
| select | `<select>` 또는 커스텀 드롭다운 | |
| select-or-text | 드롭다운 + 직접 입력 토글 | |
| multiline-mention | `<textarea>` + @경로 드롭다운 오버레이 | 기존 보안 로직 동일 적용 |

---

## 4. 비기능 요구사항

| 항목 | 요구사항 |
|---|---|
| 실행 환경 | Windows, macOS, Linux (Node.js 24+) |
| 포트 충돌 | 3000 사용 중 시 자동 다음 포트 탐색 |
| 네트워크 격리 | `localhost` 바인딩 전용, 외부 접근 차단 |
| 데이터 저장 | 기존 `~/.promptcraft/` 동일 사용 |
| LLM 의존성 | 코어 생성 로직 LLM 없이 100% 로컬 동작 (불변) |
| 반응속도 | 카드 입력 → 프리뷰 갱신 < 100ms (debounce 150ms) |
| CLI 병행 | `promptcraft build` CLI는 P2 수준으로 유지 |
| 반응형 | 1024px 이상: Dual-Pane / 미만: 단일 패널 + 프리뷰 토글 |
| 키보드 접근성 | 마우스 없이 전체 워크플로우 완결 가능 |
| 세션 복구 | 브라우저 새로고침 / 실수 종료 시 작업 손실 방지 |
| 실행 취소 | 카드 조작(제거/순서변경/값 수정) 10단계 undo/redo |
| 보안 헤더 | CSP, CORS origin 제한, 경로 순회 방지 미들웨어 |
| Graceful Shutdown | 서버 종료 시 DB 커넥션 정리 및 진행 중 저장 완료 보장 |

### 4.1 반응형 레이아웃 요구사항

| 브레이크포인트 | 레이아웃 | 비고 |
|---|---|---|
| >= 1280px | Dual-Pane 60/40 | 기본 데스크탑 경험 |
| 1024 ~ 1279px | Dual-Pane 55/45 | 축소된 프리뷰 |
| 768 ~ 1023px | 단일 패널 + 하단 프리뷰 토글 버튼 | 탭 전환 UX |
| < 768px | 단일 패널 전용 + floating 프리뷰 시트 | 모바일 대응 (P2) |

### 4.2 키보드 단축키 요구사항

| 단축키 | 동작 | 컨텍스트 |
|---|---|---|
| `Ctrl/Cmd + Enter` | 프롬프트 클립보드 복사 | 전역 |
| `Ctrl/Cmd + S` | 템플릿 저장 모달 열기 | Workspace |
| `Ctrl/Cmd + Z` | 실행 취소 (Undo) | Workspace |
| `Ctrl/Cmd + Shift + Z` | 다시 실행 (Redo) | Workspace |
| `Tab` | 다음 카드 입력으로 포커스 이동 | Workspace |
| `Shift + Tab` | 이전 카드 입력으로 포커스 이동 | Workspace |
| `Escape` | 모달 닫기 / 카드 풀 패널 닫기 | 전역 |
| `Ctrl/Cmd + Shift + P` | 프리뷰 패널 토글 (반응형 전용) | 768~1023px |

### 4.3 세션 복구 요구사항

- 카드 값 변경 시 `localStorage`에 자동 저장 (debounce 1초)
- 페이지 재진입 시 미완성 세션 감지 → "이전 작업을 이어서 할까요?" 프롬프트
- 명시적 "새로 시작" 선택 시 저장 세션 삭제
- `localStorage` 키: `promptcraft:session:{treeId}`

---

## 5. 변경 범위 및 마이그레이션

### 유지되는 것

- 스캔 엔진 (`src/scanner/`)
- Handlebars 템플릿 조립 로직 (SectionCard 빌드 함수로 래핑)
- SQLite 스키마 (`history`, `template`, `config` 테이블)
- 트리 JSON 데이터 (`data/trees/`)의 카드 메타데이터 재활용
- `promptcraft scan`, `promptcraft history`, `promptcraft config` CLI

### 변경되는 것

- `promptcraft build` → 메인 경로 `promptcraft serve`로 이관
- Handlebars 고정 템플릿 → SectionCard 동적 조립
- 트리 JSON 스키마: 질문 흐름 정의 → 카드 구성 선언으로 재정의
- Ink 위자드 컴포넌트 전체 (레거시 유지 여부 팀 결정 사항)

---

## 6. 성공 지표

| 지표 | 측정 방법 |
|---|---|
| 프롬프트 생성 소요 시간 | 수동 작성 대비 70% 이상 단축 (현행 지표 유지) |
| 섹션 제어 정확성 | active 카드만 프롬프트에 포함되는지 단위 테스트 |
| 빈 헤더 출력 zero | value가 비어있는 active 카드 미출력 자동 검증 |
| 프리뷰 반응속도 | 입력 이벤트 → DOM 갱신 100ms 이내 |
| LLM 호출 zero | 코어 플로우 내 외부 API 호출 부재 검증 |
