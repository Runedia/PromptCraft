# PRD — PromptCraft 2.4

**AI 바이브 코딩을 위한 로컬 웹 기반 구조화 프롬프트 생성 · 실행 도구**

---

## 1. 개요

### 1.1 배경

AI 코딩 도구(Claude Code, Gemini, GitHub Copilot, OpenAI Codex 등)를 활용한 '바이브 코딩(Vibe Coding)'의 성공 여부는 사용자가 제공하는 프롬프트의 품질에 직결됩니다. 대부분의 개발자는 모호하고 불완전한 질문을 입력하여 다음 세 가지 문제를 반복합니다.

- **잦은 재질문**: 의도 파악에 실패한 AI와의 불필요한 핑퐁
- **토큰 낭비**: 재질문 왕복마다 발생하는 컨텍스트 누적 비용
- **엉뚱한 결과물**: 구체성이 부족한 입력으로 인한 저품질 코드 생성

**기존 AI 프롬프트 보조 도구들의 구조적 문제:**

시장에 출시된 대부분의 프롬프트 보조 도구들은 프롬프트 생성 및 보정 자체에 LLM API를 사용합니다. 이중 비용 구조입니다.

```
기존 도구 구조:
  사용자 요청
    → [LLM API 호출 1] 프롬프트 생성/보정  ← 비용 발생
    → 생성된 프롬프트를 AI에 투입
    → [LLM API 호출 2] 실제 작업 수행      ← 비용 발생
    → (One-Shot 실패 시 추가 왕복)           ← 추가 비용 발생
```

PromptCraft는 이 구조를 근본적으로 해결합니다. 프롬프트 생성 단계에서 LLM을 일절 사용하지 않고, 단일 AI 호출에서 One-Shot 성공을 이끌어내는 구조화된 프롬프트를 로컬에서 완성한 뒤, 대상 AI CLI를 직접 호출하여 복사-붙여넣기 단계까지 제거합니다.

```
PromptCraft 구조:
  사용자 요청
    → [로컬 처리] 스캔 + SectionCard 동적 조립 + 질문 행동 교정   ← 비용 제로
    → [로컬 실행] Run as Claude Code / Gemini / Copilot / Codex
    → [LLM API 호출 1회] 실제 작업 수행                            ← 비용 발생 지점 단 1회
```

**AI 도구의 자체 컨텍스트 관리가 해결하지 못하는 것:**

`CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md` 등의 규칙 파일은 AI 도구 측의 **프로젝트 자동 컨텍스트**를 해결하지만, 사용자 측 **질문 행동**은 자동화하지 못합니다. 파일이 존재해도 "에러 나는데 고쳐줘" 수준의 모호한 질문 습관은 유지됩니다. PromptCraft의 SectionCard 모델은 빈 값의 active 카드를 프리뷰에서 회색으로 표시하여 시각적 압박을 가하고, 이를 통해 사용자가 파일·함수·경로·에러 증거 등 구체 정보를 채우도록 강제합니다. 이것이 규칙 파일이 제공할 수 없는 **질문 행동 교정 장치**입니다.

### 1.2 제품 정의

PromptCraft는 로컬 코드베이스를 스캔·분석하고, SectionCard 모델 기반 웹 UI를 통해 사용자의 의도를 구조화하여 AI 코딩 도구에 최적화된 완성형 프롬프트를 생성하고 대상 AI CLI를 직접 호출까지 수행하는 **로컬 설치형 Bun 기반 웹 도구**입니다.

**핵심 설계 철학 — 이중 가치 제안:**

1. **비용 제로 (기술적 가치)** — 프롬프트 생성·조립 단계에서 LLM을 일절 사용하지 않음. 실제 AI 호출 1회로 완결되는 구조.
2. **질문 행동 교정 (행동적 가치)** — 카드 시스템이 "에러 증거 / 시도한 방법 / 기대 동작" 등을 시각적으로 강제하여, 규칙 파일이 자동화할 수 없는 사용자 측 구조적 질문 습관을 형성.

| 구분            | 방식                     | 설명                                                            |
| --------------- | ------------------------ | --------------------------------------------------------------- |
| 프로젝트 스캔   | 규칙 기반 (로컬)         | 파일 시스템 분석, 언어/프레임워크/도메인 자동 감지              |
| 프롬프트 조립   | SectionCard 모델 (로컬)  | 25개 카드 × 5개 트리 × 11개 도메인 오버레이 기반 동적 섹션 조립 |
| 실시간 프리뷰   | 클라이언트 사이드 (로컬) | 마크다운 렌더링 + 토큰 추정 동시 표시                           |
| AI 실행         | 로컬 프로세스 spawn      | Claude Code / Gemini / Copilot / Codex CLI 직접 호출            |
| 프롬프트 다듬기 | 선택적 AI (옵션)         | 필요 시 로컬 LLM을 통한 후처리                                  |

### 1.3 One-Shot 성공률과 토큰 효율의 인과 관계

PromptCraft의 토큰 최적화는 단순한 입력 압축이 아닙니다. 실제 효과는 다음 인과 구조에서 발생합니다.

```
구조화된 프롬프트 (역할·목표·컨텍스트·제약이 섹션으로 명시 분리)
    ↓
모델이 의도 파악 단계를 생략
    ↓
사고 토큰(Thinking Tokens)이 전량 문제 해결에 집중
    ↓
One-Shot 응답 성공률 상승
    ↓
재질문 왕복 제거
    ↓
총 API 호출 비용 최소화
```

**절감되는 토큰의 실질 비중:**

| 절감 유형                   | 상대적 비중 | 설명                                         |
| --------------------------- | ----------- | -------------------------------------------- |
| 입력 압축 (스캔 요약)       | 낮음        | 파일 트리 전체 → 핵심 경로 요약              |
| 재질문 왕복 제거            | 높음        | 대화 1회 = 누적 컨텍스트 전체 재전송         |
| 프롬프트 생성 단계 API 제거 | 높음        | 경쟁 도구 대비 1회 API 호출 완전 제거        |
| 워크플로우 마찰 제거        | 중간        | Run as 직접 실행으로 복사-붙여넣기 단계 삭제 |

### 1.4 구조화 템플릿의 설계 근거

Anthropic의 Claude Prompting Best Practices, OpenAI의 Prompt Engineering Guide, Google의 Gemini Prompting Guide에서 수렴하는 원칙을 카드 정의(`hint`, `examples`, `template` 필드)에 내재화합니다. 이 포맷은 Claude Code, Codex, Gemini, Copilot 등 주요 AI 코딩 도구 전반에서 크로스모델 표준으로 검증되었습니다.

**핵심 원칙:**

- 역할·목표·컨텍스트·제약을 명시적으로 섹션 분리
- 불변 정보(스택/환경)를 상단 배치, 가변 정보(현재 문제)를 하단 배치
- 자연어 산문 대신 구조적 헤더로 정보 레이블링
  → 동일 정보를 산문 대비 적은 토큰으로, 더 높은 해석 정확도로 전달

**트리 · 도메인 특화 원칙:**

- 각 트리(상황 유형)별 특화 가이드라인 내재화 — `output-format` 카드의 상황별 옵션, `goal` 카드의 트리별 기본값·예시가 이를 반영
- 도메인 적응형 오버레이 — 스캔 결과 도메인에 따라 role 후보와 카드 hint가 동적으로 재정의
- 다양한 역할 예시 제공으로 도메인별 최적 페르소나 설정 유도

**바이브 코딩 역량 모델(L1~L5) 기반 행동 교정 논거:**

PromptCraft는 단순 템플릿 엔진이 아니라, 사용자의 AI 활용 레벨을 **L2(Tinkerer) → L3(Collaborator)**로 전환시키는 행동 교정 장치입니다. 상세 정의는 `docs/vibe_level.md` 참조.

| 레벨               | 특징                                              | PromptCraft가 강제하는 것                                                       |
| ------------------ | ------------------------------------------------- | ------------------------------------------------------------------------------- |
| L1 (Observer)      | "이거 만들어줘"식 통째 요청                       | 대상 외 — 스스로 도구를 찾지 않음                                               |
| **L2 → L3 전환점** | **"왜?"는 묻지만 파일·함수·경로를 제공하지 않음** | **@file 멘션 + 에러 증거 카드로 구체성 강제**                                   |
| L3 (Collaborator)  | 파일명·경로·3단계 분해 포함                       | `target-code`, `tried-methods`, `expected-behavior` 카드가 이미 내재화          |
| L4 (Pilot)         | 제약·검증 기준 사전 명시                          | `constraints`, `acceptance-criteria`, `review-focus` 카드가 사전 명시 구조 제공 |
| L5 (Architect)     | AI 한계를 예측해 태스크 설계                      | `output-format` × `review-focus` × 도메인 오버레이 조합으로 사전 설계 지원      |

핵심 논거: 규칙 파일은 "AI가 프로젝트를 이해하는 것"만 자동화하며, "사용자가 L2→L3로 전환하는 것"은 자동화하지 못합니다. 빈 값의 active 카드가 프리뷰에서 회색으로 표시되는 시각적 압박이 바로 이 전환을 강제하는 장치입니다.

### 1.5 목표

- **프롬프트 생성 단계의 LLM 비용 완전 제거** (로컬 규칙 기반 100% 동작)
- **질문 행동 교정** — 사용자의 L2→L3 전환을 구조적으로 강제
- **One-Shot 응답 성공률 극대화** (구조화 SectionCard 템플릿을 통한 모델 사고 효율 향상)
- **워크플로우 마찰 완전 제거** — `Run as...` 기능으로 복사-붙여넣기 단계 삭제
- **재질문 왕복 및 불필요한 토큰 소비 최소화**
- **동시적 정보 입력과 실시간 프리뷰를 통한 프롬프트 작성 효율 극대화**
- **섹션 단위 카드 모델을 통한 프롬프트 구조에 대한 사용자 완전 제어**
- 프로젝트 컨텍스트를 매번 수동으로 설명해야 하는 반복 작업 제거
- 단일 런타임(Bun) 기반 일관된 TypeScript 실행/테스트/번들 환경 보장

### 1.6 프로젝트 정보

| 항목         | 내용                                 |
| ------------ | ------------------------------------ |
| 개발 환경    | Bun 1.3.10+ (Node.js 단일 의존 폐지) |
| 주요 언어    | TypeScript (Bun 런타임 + React)      |
| 데이터베이스 | `bun:sqlite` 내장 모듈               |

---

## 2. 사용자 정의

### 2.1 타겟 사용자

**Primary** — AI 코딩 도구를 자주 사용하며 바이브 코딩을 실천하려는 L2~L4 개발자

- AI에게 상황 설명을 매번 타이핑하는 것이 귀찮은 사람
- 질문을 구체화하지 못해 AI와 불필요한 스무고개를 자주 하는 사람
- LLM API 비용 또는 토큰 소모량에 민감한 사람
- 프롬프트 보조 도구가 또 다른 API 비용을 발생시키는 구조에 불만을 가진 사람
- `CLAUDE.md` 등 규칙 파일을 작성해 뒀지만 막상 질문 시 의식하지 못해 여전히 모호하게 묻게 되는 사람

### 2.2 핵심 사용자 시나리오

> 김개발은 진행 중인 Next.js 프로젝트에서 알 수 없는 렌더링 에러를 만났다. 터미널에서 `promptcraft serve`를 실행하면 브라우저가 자동으로 열린다. 5개 상황 유형(에러 해결/기능 구현/코드 리뷰/개념 학습/리팩토링) 중 '에러 해결'을 선택하면, 프로젝트 경로 입력란에 현재 디렉토리를 입력하는 순간 자동으로 스캔이 시작된다. 스캔 결과로 도메인이 `web-frontend`로 분류되고, 이에 따라 '스택 & 환경' 카드에 Next.js 14, Bun 등이 자동으로 채워지며, '역할' 카드에는 "프론트엔드 디버깅 전문가", "브라우저 호환성 엔지니어", "React 컴포넌트 아키텍트" 등 도메인·트리 기반 역할 후보 칩이 표시된다. 제안 칩을 클릭하여 역할을 선택하고, '에러 증거' 카드에 `@src/components/Header.tsx:40-55`를 입력하면 서버 사이드 자동완성이 파일 후보와 라인 범위를 제안한다. 각 카드를 채울 때마다 오른쪽 프리뷰 패널이 즉시 갱신된다. '시도한 방법' 카드가 불필요하면 제거하고, 카드 풀에서 '빌드 로그' 카드를 추가하여 드래그로 원하는 위치에 배치한다. 모든 카드를 채운 뒤 `Ctrl+Enter` 대신 **[Run as Claude Code]** 버튼을 누른다. 서버는 프로젝트 경로를 cwd로 설정하고, 프롬프트를 `.promptcraft/runs/<runId>.prompt.md`에 저장한 뒤 `claude` CLI를 detach 모드로 spawn한다. 실행 로그는 `.promptcraft/runs/<runId>.log`에 기록되며 히스토리에서 추후 확인할 수 있다. 김개발은 이미 터미널로 돌아가 결과를 받는다 — 브라우저 전환, 복사, 붙여넣기 단계가 완전히 사라졌다.

---

## 3. 기능 요구사항

### 3.1 기능 목록 및 우선순위

| 기능                               | 설명                                                                                                    | 구현 방식                         | 우선순위 |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------- | -------- |
| 로컬 웹 서버 (`promptcraft serve`) | Express + React 기반 웹 UI 실행, 브라우저 자동 오픈, 포트 자동 탐색                                     | Express 5 + open                  | P0       |
| Dual-Pane 레이아웃                 | 좌: 카드 편집기 / 우: 실시간 마크다운 프리뷰 (60/40 분할)                                               | React + Tailwind CSS v4           | P0       |
| SectionCard 모델                   | 25개 카드 정의, 활성화/비활성화/순서 변경/값 입력                                                       | Zustand + core/builder            | P0       |
| 멀티 파서 스캔                     | 프로젝트 로컬 디렉토리 분석 (언어/프레임워크/도메인 자동 감지)                                          | Bun (fs) — 로컬 전용              | P0       |
| 5개 트리 선택 화면                 | 상황 유형 카드 그리드 선택 (에러 해결/기능 구현/코드 리뷰/개념 학습/리팩토링)                           | TreeSelect 컴포넌트               | P0       |
| 카드 풀                            | 비활성 섹션 목록, 트리 타입 기반 제안 카드 추가/제거                                                    | CardPool 컴포넌트                 | P0       |
| 실시간 프롬프트 빌드 & 프리뷰      | active 카드 조립 + 마크다운 렌더링 + 토큰 추정 실시간 반영                                              | react-markdown + tokenEstimator   | P0       |
| @file 멘션 시스템                  | 서버 사이드 경로 자동완성, 파일 내용 인라인 삽입, 라인 범위 멘션, 공백 경로 따옴표 지원, 경로 순회 방지 | /api/mention + MentionInput       | P0       |
| 폴더 브라우저 모달                 | 서버 사이드 파일시스템 탐색 모달, Windows 드라이브 문자 지원                                            | FolderBrowser + /api/browse       | P0       |
| 드래그 앤 드롭 카드 순서 변경      | @dnd-kit 기반 카드 재배치, order 필드 반영                                                              | @dnd-kit/sortable                 | P0       |
| 클립보드 복사 + 키보드 단축키      | Ctrl+Enter 복사, Ctrl+S 저장, Ctrl+Z/Shift+Z Undo/Redo                                                  | useKeyboard hook                  | P0       |
| Undo/Redo                          | 카드 조작 10단계 실행 취소/재실행                                                                       | Zundo temporal middleware         | P0       |
| REST API (12개 라우트)             | browse, scan, trees, cards, prompt/build, prompt/run, history, runs/:id/log, template, config, mention  | Express Router                    | P0       |
| 보안 미들웨어                      | CSP 헤더, localhost CORS, 경로 순회 방지, 확장자 차단                                                   | Express middleware                | P0       |
| Run as... 직접 실행                | Claude Code / Gemini / Copilot / Codex CLI를 detach 모드로 spawn, 프로젝트 경로 cwd 지정, 발사 후 망각  | `Bun.spawn` + child_process       | P0       |
| 도메인 적응형 역할 제안            | 스캔 결과 도메인 분류 → role-mappings.json 기반 역할 후보 동적 생성                                     | domain-classifier + role-resolver | P0       |
| 도메인 오버레이 3계층 병합         | 카드 정의 base → tree overrides → domain overrides                                                      | domain-overlay.ts                 | P0       |
| 테스트 커버리지 90%                | 라인 커버리지 전역 90% 이상 유지                                                                        | `bun test --coverage`             | P0       |
| Playwright E2E 테스트              | 핵심 사용자 시나리오 자동화                                                                             | Playwright                        | P0       |
| supertest API 통합 테스트          | 12개 라우트 전체 커버                                                                                   | supertest + `bun test`            | P0       |
| Pre-scan (자동 스캔)               | 프로젝트 경로 입력 800ms 후 자동 스캔 트리거                                                            | useScan hook (debounce)           | P1       |
| defaultValue 필드                  | CardDefinition 기본값 프리필 (예: code-review · refactoring goal 자동 입력)                             | tree JSON cardOverrides           | P1       |
| 상황별 output-format 옵션          | 트리별 다른 출력 형식 옵션 제공 (5개 트리 전부 적용)                                                    | tree JSON cardOverrides           | P1       |
| 프롬프트 히스토리                  | SQLite 기반 히스토리 CRUD (조회/상세/삭제)                                                              | /api/history + bun:sqlite         | P1       |
| 템플릿 프리셋 저장/로드            | 카드 구성 + 값 일괄 저장 재사용                                                                         | /api/templates + bun:sqlite       | P1       |
| 환경 설정 관리 (Config)            | 전역/프로젝트 스코프 설정 관리                                                                          | /api/config                       | P1       |
| 세션 복구                          | localStorage 자동 저장, 재진입 시 이전 작업 복원                                                        | localStorage + cardStore          | P1       |
| DB 스키마 마이그레이션             | `PRAGMA user_version` 기반 마이그레이션 체인, 기동 시 자동 적용                                         | core/db/migrations                | P1       |
| 선택적 AI 다듬기                   | 생성된 프롬프트 자연어 후처리                                                                           | 외부/로컬 LLM (옵션)              | P2       |
| i18n (ko/en)                       | 카드 레이블·hint·examples 다국어 지원                                                                   | locale JSON + React-i18n          | P2       |
| 스캔 결과 캐싱                     | 프로젝트 프로파일을 `.promptcraft/scan-cache.json`에 저장, 변경 파일만 재스캔                           | mtime 기반 diff                   | P2       |

### 3.2 핵심 기능 상세

#### 3.2.1 SectionCard 모델

프롬프트의 각 섹션은 독립적인 카드 단위로 존재합니다. 카드는 **활성(active)** 또는 **비활성(inactive, 카드 풀에 위치)** 상태를 가집니다.

**SectionCard 속성:**

| 속성            | 타입            | 설명                                                           |
| --------------- | --------------- | -------------------------------------------------------------- |
| `id`            | string          | 고유 식별자                                                    |
| `label`         | string          | UI 표시명                                                      |
| `required`      | boolean         | 필수 카드 (제거 불가)                                          |
| `active`        | boolean         | 현재 프롬프트에 포함 여부                                      |
| `order`         | number          | 섹션 출력 순서                                                 |
| `inputType`     | enum            | text / multiline / select / select-or-text / multiline-mention |
| `value`         | string          | 입력값                                                         |
| `template`      | string          | 프롬프트 조립용 마크다운 템플릿 (`{{value}}` 치환)             |
| `hint`          | string?         | 입력 힌트                                                      |
| `examples`      | string[]?       | 예시값 목록                                                    |
| `options`       | SelectOption[]? | select 타입 선택지                                             |
| `scanSuggested` | boolean?        | 스캔 결과 자동 채움 대상 여부                                  |
| `defaultValue`  | string?         | 카드 초기화 시 자동 설정되는 기본값                            |

**25개 카드 정의 목록:**

| 카드 ID               | 레이블            | 필수 | 입력 타입         | 비고                             |
| --------------------- | ----------------- | ---- | ----------------- | -------------------------------- |
| `role`                | 역할              | ✓    | select-or-text    | 도메인/트리 기반 동적 옵션       |
| `goal`                | 목표              | ✓    | text              | 트리별 defaultValue              |
| `stack-environment`   | 스택 & 환경       | —    | multiline         | scanSuggested: true              |
| `error-evidence`      | 에러 증거         | —    | multiline-mention | @파일:라인 범위 참조 지원        |
| `tried-methods`       | 시도한 방법       | —    | multiline         | —                                |
| `current-situation`   | 현재 상황         | —    | multiline-mention | —                                |
| `constraints`         | 제약 조건         | —    | multiline         | —                                |
| `build-log`           | 빌드 로그         | —    | multiline-mention | —                                |
| `request-log`         | 요청/응답 로그    | —    | multiline-mention | —                                |
| `profiling-data`      | 프로파일링 데이터 | —    | multiline         | —                                |
| `baseline-metric`     | 기준 성능 지표    | —    | text              | —                                |
| `impl-scope`          | 구현 범위         | —    | select-or-text    | 신규/수정 선택                   |
| `target-code`         | 대상 코드         | —    | multiline-mention | —                                |
| `tech-preference`     | 기술 선호         | —    | text              | —                                |
| `modification-scope`  | 수정 범위         | —    | text              | —                                |
| `review-code`         | 리뷰 대상 코드    | —    | multiline-mention | —                                |
| `review-focus`        | 리뷰 중점         | —    | select-or-text    | 8가지 중점 옵션                  |
| `security-context`    | 보안 맥락         | —    | text              | —                                |
| `concern-area`        | 우려 영역         | —    | text              | 리팩토링 동기 기술 시에도 사용   |
| `concept`             | 학습 개념         | —    | text              | —                                |
| `skill-level`         | 현재 수준         | —    | select-or-text    | 입문/중급/심화                   |
| `output-pref`         | 설명 방식         | —    | select-or-text    | 개념/코드/비교                   |
| `expected-behavior`   | 기대 동작         | —    | multiline         | —                                |
| `acceptance-criteria` | 수락 기준         | —    | multiline         | —                                |
| `output-format`       | 응답 형식         | —    | select-or-text    | 트리별 특화 옵션 (5개 트리 전부) |
| `example-io`          | 입출력 예시       | —    | multiline         | —                                |
| `related-code`        | 관련 코드         | —    | multiline-mention | —                                |

**프롬프트 빌드 규칙:**
`active === true && value.trim() !== ''` 조건을 만족하는 카드만 `order` 오름차순으로 조립합니다. 빈 값의 active 카드는 프리뷰에서 회색으로 표시하되 최종 출력에는 포함하지 않습니다. `{{value}}` 치환은 injection 방지를 위해 단일 패스(single-pass) 방식으로 처리합니다.

#### 3.2.2 트리 기반 카드 풀 및 자동 제안

5개 워크플로우 트리가 카드 초기 구성을 선언적으로 정의합니다.

| 트리 ID         | 레이블    | 아이콘 | 기본 활성 카드                                               | 카드 풀                                                                                                                                        |
| --------------- | --------- | ------ | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `error-solving` | 에러 해결 | 🔴     | role, goal, stack-environment, error-evidence, tried-methods | expected-behavior, current-situation, constraints, build-log, request-log, profiling-data, baseline-metric, example-io, output-format          |
| `feature-impl`  | 기능 구현 | 🟢     | role, goal, stack-environment, impl-scope                    | acceptance-criteria, current-situation, target-code, related-code, tech-preference, modification-scope, constraints, example-io, output-format |
| `code-review`   | 코드 리뷰 | 🔵     | role, goal, review-code, review-focus                        | related-code, security-context, concern-area, constraints, output-format                                                                       |
| `concept-learn` | 개념 학습 | 🟡     | role, goal, concept, skill-level, output-pref                | constraints, example-io, related-code, output-format                                                                                           |
| `refactoring`   | 리팩토링  | 🛠     | role, goal, target-code, modification-scope, concern-area    | related-code, constraints, output-format                                                                                                       |

**`cardOverrides` 메커니즘:** 트리 JSON의 `cardOverrides` 필드로 특정 카드의 hint, examples, defaultValue, options를 트리별로 재정의합니다.

주요 트리 오버레이 예시:

- **`code-review`**: `goal`의 defaultValue = "코드 리뷰". `output-format` 옵션 4종 — "심각도 분류표(Critical/Major/Minor)", "라인별 인라인 코멘트", "요약 + 상세", "diff + 설명".
- **`refactoring`**: `goal`의 defaultValue = "리팩토링", "외부 동작 유지하며 달성할 구조적 개선" 방향 hint. `modification-scope`는 공개 인터페이스/기존 테스트 유지 조건 hint. `concern-area`는 리팩토링 동기(중복 로직·함수 길이·순환 의존성 등) hint. `output-format` 옵션 4종 — "diff + 근거", "단계별 안전 변환", "Before/After 비교", "Fowler 카탈로그 매핑".
- **`concept-learn`**: `output-format` 옵션 4종 — "개념→코드→실전", "비유 + 요약", "Q&A 형식", "치트시트".

**`roleSuffix` 메커니즘:** 트리별로 역할 후보 끝에 고정 접미사를 덧붙여 "프론트엔드 개발자 (코드 리뷰 전문가)"와 같은 문맥 특화 역할을 생성합니다. 현재 `code-review`(접미사: "코드 리뷰 전문가")와 `refactoring`(접미사: "리팩토링 전문가") 트리가 사용합니다.

#### 3.2.3 도메인 적응형 역할 제안 및 3계층 오버레이

스캔 결과에 따라 역할 후보와 카드 정의가 동적으로 재정의되는 파이프라인입니다.

**도메인 분류 (11개):** `web-frontend`, `web-backend`, `data-ml`, `mobile`, `systems`, `devops`, `game`, `desktop`, `cli`, `embedded`, `general`.

`src/core/scanner/domain-classifier.ts`가 감지된 언어/프레임워크 조합을 기반으로 도메인을 분류합니다.

**3계층 카드 정의 병합** (`src/core/builder/domain-overlay.ts`):

```
cardDefs (base: data/cards/card-definitions.json)
    ↓  (우선순위 낮음 → 높음)
treeOverrides (data/trees/<tree>.json의 cardOverrides)
    ↓
domainOverrides (도메인별 오버레이 — 최우선)
```

도메인 오버레이는 `cardOverrides` 외에 `cardRelevance: { cardId: 'high'|'medium'|'low' }`를 선언할 수 있으며, 카드풀이 관련성 순(high → medium → low)으로 재정렬됩니다. 기본값은 medium.

**역할 후보 생성 파이프라인:**

```
스캔 결과 (언어/프레임워크)
    ↓
도메인 분류 (11개 중 1)
    ↓
domainRoles[domain][treeId] (최대 3개)
  + frameworkRoles[detected]       ← 프레임워크 특화 1~2개
  + languageRoles[detected]        ← 언어 특화 1개
  + tree.roleSuffix 접미사          ← (해당 트리에만)
    ↓
중복 제거 후 상위 5개 칩으로 표시
```

예시 (`web-frontend` × `error-solving`): 후보 = `["프론트엔드 디버깅 전문가", "브라우저 호환성 엔지니어", "프론트엔드 개발자", "React 컴포넌트 아키텍트", "TypeScript 개발자"]`.

**매핑 테이블 (`data/role-mappings.json`):**

- `domainRoles`: 11개 도메인 × 5개 트리(default 포함 6개 키) 매트릭스
- `languageRoles`: 13개 주요 언어 (Java, Python, TypeScript, JavaScript, C++, C, C#, Go, Rust, Ruby, PHP, Swift, Kotlin)
- `frameworkRoles`: 약 50종 (React, Next.js, Vue, Angular, Svelte, NestJS, Express, Hono, React Native, Electron, Prisma, Remix, Astro, Django, FastAPI, Flask, PyTorch, TensorFlow, Hugging Face Transformers, LangChain, Gin, Echo, Fiber, gRPC-Go, Actix Web, Axum, Tokio, Bevy, Tauri, Spring Boot, Quarkus, Ktor, Jetpack Compose, Flutter, Vapor, Ruby on Rails, Laravel, Symfony, Apache Spark, ASP.NET Core, .NET MAUI 등)

#### 3.2.4 Dual-Pane 레이아웃

```
┌─────────────────────────────────┬──────────────────────────┐
│  LEFT PANE (60%)                │  RIGHT PANE (40%)        │
│                                 │                          │
│  [트리 선택 breadcrumb]          │  실시간 마크다운 프리뷰   │
│                                 │                          │
│  ACTIVE CARDS (드래그 순서 변경) │  ## Role                 │
│  ┌──────────────────────────┐   │  프론트엔드 디버깅 전문가  │
│  │ ● Role       [필수] [─]  │   │                          │
│  │ [입력 컴포넌트]            │   │  ## Goal                 │
│  └──────────────────────────┘   │  렌더링 에러 해결          │
│  ┌──────────────────────────┐   │                          │
│  │ ● Error Evidence    [×]  │   │  ## Stack & Environment  │
│  │ [multiline-mention]       │   │  Next.js 14, Bun         │
│  └──────────────────────────┘   │                          │
│                                 │  ─────────────────────── │
│  CARD POOL (추가 가능)           │  토큰 추정: ~380 tokens  │
│  [+ 현재 상황] [+ 제약] [+ ...]  │  [↩] [↪] [복사] [저장]   │
│                                 │  [Run as Claude Code ▾]  │
└─────────────────────────────────┴──────────────────────────┘
```

- 좌측 패널: 활성 카드 목록 (드래그 앤 드롭 순서 변경 가능)
- 우측 패널: 실시간 마크다운 프리뷰 + 토큰 추정 + Undo/Redo + 액션 버튼
- 우측 하단에 **Run as 드롭다운 버튼** 배치 — Claude Code / Gemini / Copilot / Codex 중 선택
- 필수 카드(`required: true`): 제거 불가 (잠금 아이콘 표시)
- 비필수 카드: [×] 버튼으로 카드 풀로 복귀

#### 3.2.5 @file 멘션 시스템

`multiline-mention` 입력 타입은 `@` 입력 시 서버 사이드 파일 경로 자동완성을 활성화합니다.

- **자동완성**: `GET /api/mention/suggest?root=&path=` — 경로 후보 최대 30개 반환, 키보드(↑↓ Enter Tab) 탐색 지원
- **파일 읽기 + 라인 범위**: `POST /api/mention/read` — 선택한 파일 내용을 카드 값에 인라인 삽입. `@path/to/file.ts:40-55` 형식으로 라인 범위 지정 가능
- **공백 포함 경로**: 따옴표로 감싸 지원 — `@"path with spaces/file.ts"`
- **보안**: `pathGuard.ts` 미들웨어로 경로 순회(`../`) 시도 차단, `.env`·바이너리 확장자 차단

#### 3.2.6 폴더 브라우저 모달

서버 사이드 파일시스템을 탐색하는 모달 다이얼로그입니다.

- `GET /api/browse?path=` — 지정 경로의 하위 디렉토리 목록 반환
- Windows 드라이브 문자(`C:\`, `D:\` 등) 자동 감지 및 목록 표시
- 상위 디렉토리 이동, 경로 직접 입력 지원

#### 3.2.7 프로젝트 스캔 통합 및 Pre-scan

**Pre-scan:** `TreeSelect` 화면의 프로젝트 경로 입력 시 800ms debounce 후 자동으로 `POST /api/scan`을 트리거합니다. 사용자가 명시적으로 스캔 버튼을 누를 필요가 없습니다.

**스캔 결과 활용:**

- `stack-environment` 카드에 감지된 언어/프레임워크/패키지 매니저 자동 채움
- 도메인 분류 결과를 `role` 카드의 후보 생성 파이프라인에 투입
- `multiline-mention` 카드의 @멘션 자동완성 루트 경로로 사용

**스캔 분석 항목:** 언어별 파일 수, 프레임워크 및 라이브러리(`package.json` 의존성 기반, 약 40\~50여 종 감지 — React Native, Electron, Tauri, Bevy, FastAPI, LangChain, Spring Boot 등 포함), 디렉토리 구조(최대 깊이 2~5, 언어별 조정), 패키지 매니저(bun/pnpm/yarn/npm), `.env` 파일 존재 여부, 설정 파일 목록, gitignore 규칙 적용, 도메인 분류 결과.

#### 3.2.8 Run as... 직접 실행

클립보드 복사 → 에디터 전환 → 붙여넣기의 3단계 마찰을 제거하고, **"발사 후 망각(fire-and-forget)"** 모드로 대상 AI CLI를 직접 호출합니다.

**비용 제로 원칙 보존:** PromptCraft는 프롬프트 생성까지만 담당하고 LLM 호출은 사용자가 이미 설치한 외부 CLI가 수행합니다. 역할 분리가 명확하며 PromptCraft 서버에서 LLM API 토큰을 소비하지 않습니다.

**지원 Provider:**

| Provider      | CLI 바이너리                        | 프롬프트 전달 방식                            | cwd 지정 |
| ------------- | ----------------------------------- | --------------------------------------------- | -------- |
| `claude-code` | `claude`                            | `--file` 또는 stdin 파이프 (구현 단계 재검증) | 지원     |
| `gemini`      | `gemini`                            | stdin 파이프 또는 `-p` 인자                   | 지원     |
| `copilot`     | `gh copilot suggest` 또는 `copilot` | 인자 전달                                     | 지원     |
| `codex`       | `codex`                             | CLI 사양에 따라 결정                          | 지원     |

**프롬프트 전달:** 셸 인자 길이 제한(OS별 약 8K~256K)을 회피하기 위해 임시 파일 경로 전달을 우선으로 합니다. 각 Provider가 `--file` 또는 유사 플래그를 지원하지 않는 경우 stdin 파이프를 폴백으로 사용합니다.

**API:**

```
POST /api/prompt/run
  body: {
    provider: "claude-code" | "gemini" | "copilot" | "codex",
    prompt: string,
    cwd: string
  }
  response: { runId: string, pid: number, startedAt: string }
```

**실행 파이프라인:**

```
[Run as...] 버튼 클릭
  → POST /api/prompt/run
  → 서버:
     1. runId 생성 (UUID)
     2. 프롬프트를 .promptcraft/runs/<runId>.prompt.md에 기록
     3. provider 화이트리스트 검증 + `which <binary>` 사전 확인
     4. Bun.spawn(binary, [...args, "--file", promptPath],
                  { cwd, stdio: ["ignore", logFile, logFile], detached: true })
     5. .promptcraft/runs/<runId>.log에 stdout/stderr 파이프
     6. 즉시 { runId, pid } 반환 — 결과 수신 없음
  → 클라이언트:
     토스트 "Run started (runId: ...)" 표시 후 종료
  → 사용자는 이미 터미널/에디터에서 결과를 받음
```

**리스크 완화:**

| 리스크                    | 완화                                                                                                            |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 장시간 실행 프로세스 관리 | detach 후 PID만 기록. PromptCraft는 생명주기 관리 안 함                                                         |
| 프롬프트 길이 제한        | 임시 파일 + `--file` 플래그 우선, 폴백으로 stdin 파이프                                                         |
| 보안 (임의 명령 실행)     | provider 화이트리스트 고정 (4종). 사용자 정의 명령어는 config에서만 등록. 셸 경유 금지 (배열 인자로 직접 spawn) |
| AI 도구 미설치            | `which <binary>` 사전 확인, 미설치 시 버튼 비활성화 + 안내                                                      |
| cwd 보안                  | 스캔된 프로젝트 루트로 제한, 경로 순회 차단                                                                     |

**히스토리 조회:** `GET /api/runs/:runId/log`로 실행 로그(stdout/stderr 스냅샷)를 UI에서 확인할 수 있습니다.

#### 3.2.9 DB 스키마 마이그레이션

`bun:sqlite` 내장 모듈의 `PRAGMA user_version` 기반 단순 마이그레이션 체인을 도입합니다.

**규칙:**

- 현재 스키마를 **v1**으로 고정
- `src/core/db/migrations/<version>.ts` 파일별 `up(db)` 함수 정의
- `promptcraft serve` 기동 시 자동 실행
- 실패 시: 1) DB 파일을 `~/.promptcraft/db.sqlite.bak.<timestamp>`로 백업, 2) 서버 기동 중단, 3) stderr에 명확한 오류 메시지 출력
- 각 마이그레이션은 단일 트랜잭션으로 감싸고, DDL 실패 시 전체 롤백

**현재 테이블:** `history`, `template`, `config`.

#### 3.2.10 REST API 라우트 목록

| 라우트                 | 메서드            | 설명                                                  |
| ---------------------- | ----------------- | ----------------------------------------------------- |
| `/api/browse`          | GET               | 폴더 탐색 (디렉토리 목록, Windows 드라이브 지원)      |
| `/api/scan`            | POST, GET         | 프로젝트 스캔 실행 / 마지막 스캔 결과 조회            |
| `/api/trees`           | GET               | 트리 설정 목록 (5개) / 개별 트리 + 카드 정의          |
| `/api/cards`           | GET               | 전체 카드 정의 로드 (25개)                            |
| `/api/prompt/build`    | POST              | 카드 배열로 프롬프트 조립 + 토큰 추정 + 히스토리 저장 |
| `/api/prompt/run`      | POST              | 대상 Provider CLI 실행 (detach, fire-and-forget)      |
| `/api/history`         | GET, DELETE       | 히스토리 목록/상세 조회 및 삭제                       |
| `/api/runs/:runId/log` | GET               | Run as... 실행 로그 조회 (stdout/stderr 스냅샷)       |
| `/api/templates`       | GET, POST, DELETE | 프리셋 템플릿 저장/로드/삭제                          |
| `/api/config`          | GET, PUT          | 설정 조회/변경                                        |
| `/api/mention/suggest` | GET               | @멘션 경로 자동완성 후보 반환                         |
| `/api/mention/read`    | POST              | @멘션 파일 내용 읽기 (라인 범위 · 따옴표 경로 지원)   |

#### 3.2.11 키보드 단축키

| 단축키                     | 동작                            | 컨텍스트  |
| -------------------------- | ------------------------------- | --------- |
| `Ctrl/Cmd + Enter`         | 프롬프트 클립보드 복사          | 전역      |
| `Ctrl/Cmd + Shift + Enter` | 기본 Run as Provider로 실행     | Workspace |
| `Ctrl/Cmd + S`             | 템플릿 저장 모달 열기           | Workspace |
| `Ctrl/Cmd + Z`             | 실행 취소 (Undo)                | Workspace |
| `Ctrl/Cmd + Shift + Z`     | 다시 실행 (Redo)                | Workspace |
| `Tab`                      | 다음 카드 입력으로 포커스 이동  | Workspace |
| `Shift + Tab`              | 이전 카드 입력으로 포커스 이동  | Workspace |
| `Escape`                   | 모달 닫기 / @멘션 드롭다운 닫기 | 전역      |

---

## 4. 비기능 요구사항

| 항목              | 요구사항                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| 실행 환경         | Windows, macOS, Linux (Bun 1.3.10+ 필수, Node.js 비지원)                                               |
| 네트워크 격리     | `127.0.0.1` 바인딩 전용, 외부 네트워크 접근 차단                                                       |
| 포트 충돌         | 기본 포트 3000, 사용 중 시 자동 다음 포트 탐색 (최대 10회)                                             |
| 설정 보존         | `~/.promptcraft/` 글로벌 또는 프로젝트 범위 안전 저장                                                  |
| LLM 의존성        | 코어 생성 로직(스캔/카드 조립/빌드)은 LLM API 없이 100% 로컬 동작 보장                                 |
| 타입 안정성       | TypeScript strict 모드, 컴파일 에러 Zero                                                               |
| 테스트 커버리지   | 라인 커버리지 전역 90% 이상 (`bun test --coverage` 기준)                                               |
| E2E 테스트        | Playwright 기반 핵심 시나리오 자동화                                                                   |
| API 테스트        | supertest 기반 12개 라우트 전체 통합 테스트                                                            |
| 보안 헤더         | CSP, X-Content-Type-Options, X-Frame-Options 적용                                                      |
| CORS              | `localhost` origin만 허용                                                                              |
| 경로 보안         | 경로 순회(`../`) 시도 403 차단, `.env`·바이너리 파일 접근 차단                                         |
| Run as 보안       | Provider 화이트리스트(4종 고정), 셸 경유 금지, cwd는 스캔된 프로젝트 루트로 제한                       |
| 반응속도          | 카드 입력 → 프리뷰 갱신 < 100ms (측정 조건: §6 벤치마크 대상 프로젝트)                                 |
| 세션 복구         | `localStorage` 자동 저장 (debounce 1초), 재진입 시 이전 작업 복원                                      |
| Undo/Redo         | 카드 조작 10단계 temporal state (Zundo)                                                                |
| Graceful Shutdown | SIGINT/SIGTERM 시 DB 커넥션 정리, 10초 강제 종료 타임아웃. Run as detach 프로세스는 분리되어 영향 없음 |
| 스캔 성능         | 스캔 완료 5초 이내 (측정 조건: §6 TBD)                                                                 |
| 빌드 성능         | 프롬프트 조립 5초 이내 (측정 조건: §6 TBD)                                                             |
| DB 마이그레이션   | 기동 시 자동 적용, 실패 시 백업 후 서버 기동 중단                                                      |

### 4.1 반응형 레이아웃 요구사항

| 브레이크포인트 | 레이아웃                              | 비고               |
| -------------- | ------------------------------------- | ------------------ |
| >= 1280px      | Dual-Pane 60/40                       | 기본 데스크탑 경험 |
| 1024 ~ 1279px  | Dual-Pane 55/45                       | 축소된 프리뷰      |
| 768 ~ 1023px   | 단일 패널 + 프리뷰 토글 버튼          | 탭 전환 UX         |
| < 768px        | 단일 패널 전용 + floating 프리뷰 시트 | 모바일 대응 (P2)   |

---

## 5. 기술 스택

### 5.1 공통

| 영역                                 | 기술/도구                                               |
| ------------------------------------ | ------------------------------------------------------- |
| 언어                                 | TypeScript 5.9+ (ESM, NodeNext 모듈)                    |
| 런타임 · 패키지 매니저 · 테스트 러너 | Bun 1.3.10+ (단일 도구로 통합)                          |
| CLI 프레임워크                       | Commander.js 14+                                        |
| 파일 스캔 엔진                       | TypeScript (bun fs, fdir, tinyglobby, glob) — 로컬 전용 |
| 데이터베이스                         | `bun:sqlite` 내장 모듈                                  |
| 린트/포맷                            | Biome 2.4+                                              |
| 커밋 검증                            | Husky + commitlint (Conventional Commits)               |

### 5.2 Web 전용

| 영역            | 기술/도구                                                     |
| --------------- | ------------------------------------------------------------- |
| HTTP 서버       | Express 5+                                                    |
| 번들러          | Vite 6+ (`@vitejs/plugin-react`, `@tailwindcss/vite`)         |
| UI 프레임워크   | React 19 + ReactDOM 19                                        |
| 스타일링        | Tailwind CSS v4                                               |
| UI 컴포넌트     | shadcn/ui (Radix UI primitives)                               |
| 상태 관리       | Zustand 5 + zundo 2 (temporal middleware, 10-state undo/redo) |
| 드래그 앤 드롭  | @dnd-kit/core + @dnd-kit/sortable                             |
| 마크다운 렌더링 | react-markdown 9                                              |
| 아이콘          | lucide-react                                                  |
| 유틸리티        | clsx, tailwind-merge (cn() 유틸), uuid                        |

### 5.3 테스트

| 영역            | 기술/도구                                  |
| --------------- | ------------------------------------------ |
| 유닛 테스트     | `bun test`                                 |
| API 통합 테스트 | supertest + `bun test`                     |
| E2E 테스트      | Playwright                                 |
| 커버리지        | `bun test --coverage` — 전역 라인 90% 목표 |

---

## 6. 벤치마크 및 검증

> 본 섹션은 A/B 벤치마크 수행 전까지 플레이스홀더로 유지됩니다. 실제 측정 이후 정량 기준으로 갱신합니다.

### 6.1 벤치마크 대상 프로젝트

측정의 재현성을 위해 고정된 오픈소스 프로젝트를 대상으로 합니다.

> **TBD** — 후보(예: `microsoft/vscode`, `facebook/react`, `vercel/next.js` 등 중 1~3개) 확정 후 git commit hash 단위로 고정.

### 6.2 A/B 벤치마크 설계

| 항목              | 기준                                                         |
| ----------------- | ------------------------------------------------------------ |
| 동일 태스크       | TBD (에러 해결 / 기능 구현 / 리팩토링 각 N개)                |
| A군 (비구조화)    | 자연어 단일 문장 프롬프트                                    |
| B군 (PromptCraft) | 동일 의도를 SectionCard로 구조화한 프롬프트                  |
| 측정 지표         | One-Shot 성공률, 총 토큰 소비량, 재질문 횟수, 작업 완료 시간 |
| 대상 모델         | Claude Opus/Sonnet, GPT-5, Gemini (TBD)                      |

### 6.3 학습 곡선 측정

| 항목 | 기준                                                                        |
| ---- | --------------------------------------------------------------------------- |
| 가설 | PromptCraft 반복 사용 시 카드 없이도 구조적 질문을 하게 됨 (L2→L3 전환)     |
| 측정 | 사용 세션 수에 따른 카드 사용률 감소 곡선 (로컬 이벤트 로깅, 오프라인 한정) |

### 6.4 성능 기준 측정 조건

§4의 "스캔 5초 / 빌드 5초 / 프리뷰 100ms" 기준은 §6.1에서 확정되는 벤치마크 프로젝트를 기준으로 측정합니다.

---

## 7. 성공 지표

> §6의 벤치마크 수행 결과에 따라 정량 기준으로 갱신합니다. 현재는 검증 항목 목록만 유지합니다.

| 지표                           | 측정 방법                                               |
| ------------------------------ | ------------------------------------------------------- |
| 프롬프트 생성 소요 시간 단축률 | §6.2 A/B 벤치마크에서 측정 (TBD)                        |
| One-Shot 응답 성공률           | §6.2 A/B 벤치마크에서 측정 (TBD)                        |
| 총 토큰 소비량 감소율          | §6.2 A/B 벤치마크에서 측정 (TBD)                        |
| 학습 곡선 — 카드 사용률 감소   | §6.3에서 측정 (TBD)                                     |
| 섹션 제어 정확성               | active 카드만 프롬프트에 포함되는지 단위 테스트         |
| 빈 헤더 출력 zero              | value가 비어있는 active 카드 미출력 자동 검증           |
| 프리뷰 반응속도                | 카드 입력 → DOM 갱신 100ms 이내 (§6.1 프로젝트 기준)    |
| LLM 호출 zero                  | 코어 플로우 내 외부 API 호출 부재 검증                  |
| Run as 보안                    | Provider 화이트리스트 우회 시도 차단, 셸 경유 실행 부재 |
| 구동 안정성                    | TypeScript 컴파일 에러 Zero, 빌드 단계 에러 Zero        |
| 테스트 커버리지                | `bun test --coverage` 라인 커버리지 전역 90% 이상       |
| 보안 검증                      | 경로 순회 시도 시 403 응답, CSP 위반 zero               |
| @멘션 보안                     | pathGuard를 통한 프로젝트 루트 외 파일 접근 차단 100%   |
| DB 마이그레이션                | 기동 시 자동 적용 성공, 실패 시 백업 후 중단 동작 검증  |

---

## 8. 향후 과제

다음 항목은 PRD 2.4 스코프에서 명시적으로 제외되며, 후속 버전에서 검토합니다.

| 과제                             | 설명                                                                              | 예상 효과                                |
| -------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------- |
| 근거 문서화(Rationale) 자동 삽입 | 프롬프트에 "이 요청을 하는 이유"를 구조화 섹션으로 자동 추가                      | 모델이 의도를 더 정확히 파악             |
| 검증/가드레일 단계 자동 삽입     | 모든 빌드 완료 시 "Defensive Thinking" 요구 지시어 선택 삽입                      | AI 결과물 신뢰도 향상                    |
| 자동 제약 조건 매핑              | `tsconfig`, `.eslintrc` 등에서 제약 조건 자동 추출 → `constraints` 카드 자동 채움 | 컨텍스트 누락 방지                       |
| i18n 지원 (ko/en)                | 카드 레이블·hint·examples 다국어화                                                | 글로벌 확장 (P2)                         |
| 스캔 결과 캐싱                   | `.promptcraft/scan-cache.json`, mtime 기반 diff 스캔                              | 대규모 프로젝트 반복 스캔 비용 제거 (P2) |
| AI 다듬기 (로컬 LLM)             | Ollama 등 연동 후처리                                                             | 비용 제로 원칙 유지하며 품질 향상 (P2)   |
