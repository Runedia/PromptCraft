<!-- /autoplan restore point: /c/Users/runed/.gstack/projects/promptcraft/master-autoplan-restore-20260425-012224.md -->
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
| REST API (10개 라우트)             | browse, scan, trees, cards, prompt/build, history, template, config, mention (prompt/run, runs/:id/log 제외) | Express Router               | P0       |
| 보안 미들웨어                      | CSP 헤더, localhost CORS, 경로 순회 방지, 확장자 차단                                                   | Express middleware                | P0       |
| ~~Run as... 직접 실행~~            | ~~CLI spawn~~ **[2.4 스코프 제외 — Decision 42]**                                                       | —                                 | 제외     |
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

#### 3.2.8 Run as... 직접 실행 [PRD 2.4 스코프 제외 — Decision 42]

> **이 섹션은 PRD 2.4에서 제외됩니다.** 추후 별도 버전에서 진행합니다.
> 아래 내용은 참고용으로 보존합니다.

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
| ~~`/api/prompt/run`~~  | ~~POST~~          | ~~대상 Provider CLI 실행~~ **[2.4 제외]**             |
| `/api/history`         | GET, DELETE       | 히스토리 목록/상세 조회 및 삭제                       |
| ~~`/api/runs/:runId/log`~~ | ~~GET~~       | ~~Run as... 실행 로그 조회~~ **[2.4 제외]**           |
| `/api/templates`       | GET, POST, DELETE | 프리셋 템플릿 저장/로드/삭제                          |
| `/api/config`          | GET, PUT          | 설정 조회/변경                                        |
| `/api/mention/suggest` | GET               | @멘션 경로 자동완성 후보 반환                         |
| `/api/mention/read`    | POST              | @멘션 파일 내용 읽기 (라인 범위 · 따옴표 경로 지원)   |

#### 3.2.11 키보드 단축키

| 단축키                     | 동작                            | 컨텍스트  |
| -------------------------- | ------------------------------- | --------- |
| `Ctrl/Cmd + Enter`         | 프롬프트 클립보드 복사          | 전역      |
| ~~`Ctrl/Cmd + Shift + Enter`~~ | ~~기본 Run as Provider로 실행~~ **[2.4 제외]** | — |
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
| ~~Run as 보안~~    | ~~Provider 화이트리스트~~ **[2.4 제외 — Decision 42]**                                                  |
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
| ~~Run as 보안~~                | ~~Provider 화이트리스트 검증~~ **[2.4 제외]**          |
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

---

<!-- AUTONOMOUS DECISION LOG -->
## /autoplan Decision Audit Trail
Generated: 2026-04-25T01:22Z (Re-run) | Commit: e2ebb0e | Status: APPROVED (44 decisions)
Previous Run: 2026-04-24 | Status: APPROVED (11 decisions carried forward)

### 2026-04-24 Decisions (Carried Forward)

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|----------------|-----------|-----------|---------|
| 1 | CEO | Mode = SELECTIVE EXPANSION | Mechanical | P3 | 기존 구현 다수 완성, 신규 기능이 기존 패턴 따름 | EXPANSION |
| 2 | Design | Card Pool 위치 = 좌측 하단 collapsible | TASTE | P5 | 명시적 > 복잡한 별도 패널 | 별도 패널, drawer |
| 3 | Design | Run as... 실행 중 = spinner + disable | Mechanical | P1 | 완전한 상태 명세 필수 | 상태 없음 |
| 4 | Design | 스캔 로딩 = 인라인 프로그레스 바 | Mechanical | P1 | 완전한 상태 명세 필수 | 무한 스피너 |
| 5 | Design | 경로 입력 = 최상단 고정 필드 | Mechanical | P5 | 진입 즉시 포커스, 명시적 | 모달 |
| 6 | Design | 디자인 시스템 = shadcn/ui neutral | Mechanical | P3 | 이미 @radix-ui/* 설치됨 | 커스텀 디자인 시스템 |
| 7 | Design | 768px 이하 = 탭 전환 모드 | TASTE | P5 | 단순, 명시적 | 스택, side drawer |
| 8 | Eng | run 라우트 테스트 필수 추가 | Mechanical | P1 | 신규 라우트 = 신규 테스트 | 테스트 없이 출시 |
| 9 | Eng | run 라우트에 pathGuard 적용 필수 | Mechanical | P1 | High 보안 이슈 해소 | pathGuard 없이 출시 |
| 10 | DX | Node.js 호환 빌드 → TODOS.md | Mechanical | P3 | P2 스코프 외, 실용적 이관 | 지금 구현 |
| 11 | DX | 에러 메시지 3요소 (문제+원인+해결) 필수 | Mechanical | P1 | 완전한 DX 필수 요건 | 현재 불완전 메시지 |

### 2026-04-25 Re-Run Decisions

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|----------------|-----------|-----------|---------|
| 12 | CEO | 전제 1~6 모두 유효 확인 | Mechanical | — | 사용자 직접 확인 | — |
| 13 | CEO | ollama_shim.py = 무관 파일, 스코프 제외 | Mechanical | P3 | 사용자 명시적 제외 확인 | P2 스코프 포함 |
| 14 | CEO | One-Shot 성공률 전제 = 위험 신호 (미검증) | TASTE | — | 두 모델 모두 §6 벤치마크 전무 지적 | — |
| 15 | CEO | VS Code 확장 = TODOS.md 이관 | Mechanical | P3 | 현 PRD 스코프 외, P1 이미 명시됨 | 지금 설계 |
| 16 | CEO | 행동 교정 포지셔닝 유지 | Mechanical | P6 | 사용자 확인, 기술적 가치와 쌍축 | 컨텍스트 주입 도구 재정의 |
| 17 | Design | 스캔 에러 상태 = 빨간 인라인 배너 + 재시도 버튼 | Mechanical | P1 | Critical 누락 상태 명세 | 토스트만 |
| 18 | Design | Run as 무음 실패 = 2초 내 프로세스 종료 시 경고 토스트 | Mechanical | P1 | fire-and-forget 구조의 UX 보완 | 완전 무음 유지 |
| 19 | Design | Tab 동작 = multiline: 탭 문자 삽입 / multiline-mention: @멘션 확정 후 다음 카드 | Mechanical | P5 | 충돌 버그 방지, 명시적 명세 | 단일 동작 |
| 20 | Design | 드롭 인디케이터 = 2px 파란 선 (--primary 토큰) | Mechanical | P5 | 드래그앤드롭 피드백 명시적 | 그림자/gap |
| 21 | Design | 토스트 위치 = top-right, 4초 자동 해제 | Mechanical | P5 | shadcn/ui 기본값, 명시적 | bottom-center |
| 22 | Design | 필수 카드 = 인덱스 0-1 고정, 드래그 핸들 숨김 | Mechanical | P5 | role/goal 항상 최상단, 명시적 | 드래그 허용 |
| 23 | Design | error-evidence 카드 hint = "@경로[:시작줄-끝줄] 예: @src/components/Header.tsx:40-55" | Mechanical | P1 | @멘션 문법 발견 가능성 보장 | hint 없음 |
| 24 | Design | 스캔 감지 성공 = 카드 자동 채움 + "✓ 스캔 완료 (Next.js 14 감지)" 인라인 확인 메시지 | TASTE | P1 | 매직 모멘트 명시적 설계 | 조용히 채움 |
| 25 | Design | project path 입력 필드 = 양 패널 위 전체 너비 헤더 존 | Mechanical | P5 | 와이어프레임 §3.2.4 보완 | 카드 내 위치 |

---

## Phase 1: CEO Review (2026-04-25)

### 전제 도전 (Step 0A)

PRD 핵심 전제 6개 사용자 확인 완료.

**위험 신호 (양 모델 일치):** 전제 3 — "구조화된 SectionCard 프롬프트가 One-Shot 성공률을 높인다" — 2026년 모델 수준(Claude Sonnet 4.6, GPT-5급)에서 인과 관계가 약화됐을 가능성. §6 벤치마크가 전무한 상태에서 25개 카드 시스템 전체를 이 전제에 의존하는 것은 구조적 리스크.

**대응:** A/B 벤치마크를 구현과 병행 실행. §6 데이터가 나오기 전까지 마케팅 주장을 실험적 가설로 표현.

### 기존 코드 활용 지도 (Step 0B)

| 서브 문제 | 기존 코드 위치 |
|---------|-------------|
| 프로젝트 스캔 | `src/core/scanner/domain-classifier.ts` |
| 카드 정의 | `data/cards/card-definitions.json` |
| 트리 설정 | `data/trees/<tree>.json` |
| @file 멘션 | `src/server/routes/mention.ts` (추정) |
| 경로 보안 | `pathGuard.ts` (이미 참조됨) |
| DB 마이그레이션 | `src/core/db/migrations/` |

### 드림 스테이트 델타 (Step 0C)

```
CURRENT (지금): PRD 확정, 부분 구현 (scanner, DB, Express 골격)
THIS PLAN (2.4): 25카드 × 5트리, Run as..., Dual-Pane UI, 90% 커버리지, E2E
12-MONTH IDEAL: Cross-tool 프롬프트 스캐폴딩 SDK, VS Code 확장, A/B 데이터 기반 검증된 가치 제안
GAP: 12개월 이상 경로에서 Claude Code가 "구조화 태스크 입력"을 내재화할 경우 본 도구의 포지셔닝 재검토 필요
```

### CEO 이중 목소리 컨센서스 (Step 0.5)

[codex-unavailable] — subagent-only 모드

```
CEO DUAL VOICES — CONSENSUS TABLE:
═══════════════════════════════════════════════════════════════
  Dimension                              Subagent  Primary   Consensus
  ───────────────────────────────────── ──────── ──────── ─────────
  1. Premises valid?                     ⚠️       ⚠️       DISAGREE (One-Shot 전제 미검증)
  2. Right problem to solve?             ⚠️       ✓        TASTE (포지셔닝 프레이밍)
  3. Scope calibration correct?          ⚠️       ✓        TASTE (90% 커버리지 P0 여부)
  4. Alternatives sufficiently explored? ⚠️       ⚠️       CONFIRMED: VS Code 대안 분석 부재
  5. Competitive/market risks covered?   ❌       ⚠️       CONFIRMED: Claude Code 흡수 위험 高
  6. 6-month trajectory sound?           ❌       ⚠️       DISAGREE (조건부 유효)
═══════════════════════════════════════════════════════════════
CONFIRMED = 두 모델 일치. DISAGREE = 견해 차이 → 최종 게이트 상정.
```

**크로스 신호:** 양 모델이 독립적으로 §6 벤치마크 부재 + Claude Code 경쟁 리스크를 지적. High-confidence 신호.

### 섹션 1~10 발견

**섹션 1 (기회):** 문제는 실재. 구모의 다소 과장 가능성. 수용.

**섹션 2 (에러 & 구조):** Error & Rescue Registry

| 실패 모드 | 심각도 | 완화 상태 |
|---------|-----|---------|
| CLI 바이너리 미설치 | 중간 | `which <binary>` + 버튼 비활성 ✓ |
| DB 마이그레이션 실패 | 높음 | 백업 + stderr 출력 ✓ |
| 대형 레포 스캔 타임아웃 | 중간 | 5초 제한 ✓ |
| @file 경로 순회 | 높음 | pathGuard ✓ |
| Run as... 프로세스 무한 실행 | 낮음 | detach = fire-and-forget (리스크 수용) |
| cwd 보안 누락 | 높음 | 스캔된 루트로 제한 ✓ |

**섹션 3 (스코프):** P0 항목 20개 — 1인 개발자에게 매우 공격적. 수용 (P6: 행동 편향).

**섹션 4 (대안):** VS Code 확장 대안 분석 부재 → TODOS.md 이관.

**섹션 5 (경쟁):** SWA 평가서 기반 분석 이미 반영됨. Claude Code 흡수 위험은 구조적.

**섹션 6 (성공 지표):** §7 항목들 검증 가능. §6 벤치마크는 실제 측정 선행 필요.

**섹션 7 (리스크):**
- 시장 타이밍 리스크: HIGH
- One-Shot 전제 미검증: CRITICAL
- 90% 커버리지 P0 = 출시 지연 위험: MEDIUM

**섹션 8 (의존성):** Bun 1.3.10+ 필수 (Node.js 비호환). 좁은 런타임 지원.

**섹션 9 (타임라인):** PRD에 타임라인 없음. 리스크 (발견 → 기록).

**섹션 10 (팀/자원):** 단독 개발자 추정. P0 전체 스코프 매우 공격적.

### CEO 완성 요약

**스코프 외 (TODOS.md 이관):**
- VS Code 확장 대안 비교 분석
- A/B 벤치마크 프로토타입 (구현과 병행)
- Claude Code 로드맵 모니터링 (구조화 태스크 입력 기능)

**이미 존재하는 것:**
- Scanner + domain classifier (핵심 재사용 가능 자산)
- Card definitions JSON (25개)
- Tree configurations (5개)
- pathGuard (보안)
- DB migration infrastructure

---

## Phase 2: Design Review (2026-04-25)

[codex-unavailable] — subagent-only 모드

### Design Litmus Scorecard

| 차원 | 초기 점수 | 목표 | 주요 갭 |
|-----|---------|-----|--------|
| 1. 정보 계층 | 5/10 | 8/10 | 프로젝트 경로 입력 + 스캔 상태가 와이어프레임에 없음 |
| 2. 누락 상태 | 4/10 | 9/10 | 스캔 에러, Run as 무음 실패, @멘션 빈 결과 미명세 |
| 3. 사용자 여정 | 6/10 | 8/10 | @file 문법 발견 마찰, 스캔 매직 모멘트 미설계 |
| 4. UI 명세 구체성 | 4/10 | 7/10 | 색상/타이포/간격 토큰, 애니메이션 기간 없음 |
| 5. DnD + 키보드 | 5/10 | 9/10 | Tab 충돌 버그, 드롭 인디케이터, 키보드 드래그 없음 |
| 6. 접근성 | 3/10 | 7/10 | ARIA 드래그 패턴, 키보드 드래그, 포커스 복귀 미명세 |
| 7. 반응형 | 7/10 | 8/10 | 768px 탭 전환 명세 완료, 480px 이하 P2 수용 |

### Design 컨센서스 테이블 [subagent-only]

```
DESIGN DUAL VOICES — CONSENSUS TABLE:
════════════════════════════════════════════════════════
  Dimension                Subagent  Primary  Consensus
  ────────────────────── ──────── ──────── ─────────
  Tab-in-textarea 충돌?    Critical  Critical  CONFIRMED 버그
  스캔 에러 상태?           Critical  High      CONFIRMED 누락
  Run as 무음 실패?         Critical  High      CONFIRMED 누락
  @멘션 문법 발견성?        High      High      CONFIRMED 갭
  드롭 인디케이터?          High      High      CONFIRMED 미명세
  매직 모멘트 설계?         High      Medium    TASTE (애니메이션 여부)
  UI 토큰 명세?             Medium    Medium    CONFIRMED 이상적으로 추가
════════════════════════════════════════════════════════
```

### 자동 결정된 설계 수정 (적용됨)

1. **스캔 에러** → 빨간 인라인 배너 + 재시도 버튼 (§3.2.7에 추가 필요)
2. **Run as 무음 실패** → 2초 내 프로세스 종료 시 경고 토스트 (§3.2.8에 추가 필요)
3. **Tab 동작** → multiline: 탭 문자 삽입 / multiline-mention: @멘션 확정 후 다음 카드 (§3.2.11에 추가 필요)
4. **드롭 인디케이터** → 2px `--primary` 색 선 (§3.1 @dnd-kit 명세에 추가 필요)
5. **토스트** → top-right, 4초 자동 해제 (§3.2.8에 추가 필요)
6. **필수 카드** → 인덱스 0-1 고정, 드래그 핸들 숨김 (§3.2.4에 추가 필요)
7. **error-evidence hint** → "@경로[:시작줄-끝줄] 예: @src/components/Header.tsx:40-55"
8. **프로젝트 경로 입력** → 양 패널 위 전체 너비 헤더 존 (§3.2.4 와이어프레임 업데이트 필요)

### 취향 결정 (최종 게이트 상정)
- TASTE: 스캔 감지 성공 시 조용히 채우기 vs "✓ 스캔 완료 (Next.js 14 감지)" 확인 메시지 추가

---

## Phase 3: Eng Review (2026-04-25)

[codex-unavailable] — subagent-only 모드

### 아키텍처 ASCII 다이어그램 (섹션 1)

```
promptcraft serve
       │
       ├── Vite 6 (Dev/Prod) ─────────────── React 19 (src/web/)
       │        │                              │
       │    HMR ws://localhost:*          Zustand 5 + Zundo 2
       │    (CSP: connect-src 추가 필요)       │
       │                                 @dnd-kit/sortable
       │                                 react-markdown
       │
       └── Express 5 (src/server/) ─────── 12개 REST 라우트
                  │
                  ├── /api/scan ──────── src/core/scanner/
                  │                      domain-classifier.ts (11 도메인)
                  │                      → stack-environment 자동 채움
                  │
                  ├── /api/trees/:id ── data/trees/<tree>.json
                  │     [단일 소스]      + domain-overlay.ts  ← (결정 26)
                  │                      클라이언트는 독립 병합 금지
                  │
                  ├── /api/mention ──── pathGuard.ts
                  │                      fs.realpath() 호출 후 루트 검증  ← Critical fix
                  │                      30개 후보 + 잘림 표시자          ← fix
                  │
                  ├── /api/prompt/run ── Bun.spawn({ detached: true })
                  │                      child.unref()                   ← Critical fix (Windows)
                  │                      per-cwd 동시 실행 lock (409)    ← fix
                  │                      .promptcraft/runs/ LRU 500항목  ← fix
                  │
                  └── bun:sqlite ─────── PRAGMA user_version
                                          마이그레이션 전 exclusive lock  ← fix
                                          history / template / config

플로우: 사용자 입력 → 스캔(core) → 카드 조립(client) → 빌드(서버) → Run as(spawn) → 로그
```

### 엔지니어링 결정 추가

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|----------------|-----------|-----------|---------|
| 26 | Eng | domain-overlay = /api/trees/:id 단일 소스 | Mechanical | P5 | 클라이언트/서버 분기 시 묵음 불일치 방지 | 클라이언트 독립 병합 |
| 27 | Eng | pathGuard: fs.realpath() 후 루트 검증 | Mechanical | P1 | 심링크 통해 프로젝트 외부 접근 차단 | realpath 없는 문자열 검사 |
| 28 | Eng | Bun.spawn 윈도우 detach: child.unref() 추가 | Mechanical | P1 | Windows POSIX setsid() 미지원, SIGINT 전파 방지 | 미검증 출시 |
| 29 | Eng | SQLite 마이그레이션: 독점 lock 또는 .lock 파일 | Mechanical | P1 | 두 인스턴스 동시 기동 시 DDL 충돌 방지 | 락 없이 출시 |
| 30 | Eng | 테스트 커버리지: core/server 90% / web/ 70% 분리 | TASTE | P3 | Playwright 없이 web/ 90% 달성 불가 → 출시 블로킹 | 전체 90% P0 유지 |
| 31 | Eng | .promptcraft/runs/ 최대 500항목 LRU 기동 시 정리 | Mechanical | P1 | 디스크 무한 누적 방지 (장기 사용 시 릭) | 보존 정책 없음 |
| 32 | Eng | promptcraft build 커맨드 + --dev 플래그 명세 | Mechanical | P5 | 프로덕션 워크플로우 미명세 → CSP/에셋 혼용 | 항상 dev 모드 |
| 33 | Eng | @mention suggest: 잘림 시 "+" 표시자 반환 | Mechanical | P1 | 30개 제한 초과 시 파일 누락 시 인지 불가 | 30개 상한 묵음 |
| 34 | Eng | Undo/Redo order: sparse gap 1000, 재사용 금지 | Mechanical | P1 | 카드 삭제 후 undo 시 order 충돌 방지 | 순차 재인덱스 |

### 테스트 다이어그램 (섹션 3)

| 코드패스 | 테스트 타입 | 현황 | 갭 |
|---------|-----------|-----|---|
| domain-classifier 11 도메인 | 유닛 (core/) | - | 누락 |
| @mention pathGuard (realpath) | 유닛 (server/) | - | 누락 |
| @mention Windows 드라이브 문자 | 유닛 (server/) | - | 누락 |
| SQLite migration rollback | 유닛 (core/db/) | - | 누락 |
| /api/prompt/run spawn + unref | 유닛 + mock | - | 누락 |
| @mention 30개 초과 잘림 | 유닛 (server/) | - | 누락 |
| Undo/Redo order 복원 정확성 | 유닛 (web/) | - | 누락 |
| 스캔 에러 배너 + 재시도 | E2E Playwright | - | 누락 |
| @mention 공백 경로 | E2E Playwright | - | 누락 |
| Run as 비활성 (바이너리 없음) | E2E Playwright | - | 누락 |
| 카드 삭제 후 undo, 순서 검증 | E2E Playwright | - | 누락 |

### Eng 컨센서스 테이블 [subagent-only]

```
ENG DUAL VOICES — CONSENSUS TABLE:
════════════════════════════════════════════════════════
  Dimension                  Subagent  Primary  Consensus
  ─────────────────────────── ──────── ──────── ─────────
  Architecture sound?         High     ✓        TASTE (overlay 단일 소스)
  Test coverage achievable?   Medium   Medium   CONFIRMED: 분리 필요
  Performance risks?          Medium   Low      N/A (로컬 도구)
  Security gaps?              Critical Critical  CONFIRMED: symlink + Windows detach
  Error paths handled?        High     High      CONFIRMED: spawn 에러, migration lock
  Deployment complexity?      High     High      CONFIRMED: dev/prod 미명세
════════════════════════════════════════════════════════
```

### 크리티컬 갭 플래그

1. **pathGuard symlink bypass** — `fs.realpath()` 누락 시 `/etc/passwd` 읽기 가능 (Critical)
2. **Windows Bun.spawn detach** — SIGINT가 child에 전파됨, `child.unref()` 필수 (Critical)
3. **테스트 커버리지 분리** — TASTE DECISION → 최종 게이트 상정

### TODOS.md 추가 항목

- [ ] VS Code 확장 대안 비교 분석 (CEO Phase)
- [ ] A/B 벤치마크 프로토타입 구현과 병행 (CEO Phase)
- [ ] promptcraft build 커맨드 설계 및 문서화 (Eng Phase)
- [ ] Windows Bun.spawn detach 동작 검증 테스트 (Eng Phase)
- [ ] 데몬 모드 (`--daemon` + `stop`/`status`) 설계 (DX Phase)
- [ ] GET /api/scan/last로 라우트 분리 (DX Phase)

---

## Phase 3.5: DX Review (2026-04-25)

[codex-unavailable] — subagent-only 모드

### 개발자 여정 맵 (9단계)

| 단계 | 액션 | 현재 마찰 | 목표 |
|-----|-----|---------|-----|
| 0 | Bun 설치 | PATH 문제 (Windows) | 1-liner install |
| 1 | promptcraft 설치 | **PRD에 설치 명령 없음** ← Critical | `bun install -g promptcraft` |
| 2 | `promptcraft serve` 실행 | 포트 충돌 시 어느 포트? | `ready on :3001` 명시 |
| 3 | 브라우저 열림 | `--no-open` 없어 CI/SSH에서 문제 | `--no-open` 플래그 |
| 4 | 프로젝트 경로 입력 | 매번 수동 입력 | `--project /path` 플래그 |
| 5 | 스캔 + 카드 작성 | @멘션 문법 발견 마찰 (Phase 2에서 처리) | hint 추가 |
| 6 | Run as / 복사 | ✓ (핵심 가치) | — |
| 7 | 터미널 닫기 → 서버 종료 | 다음 세션에서 재시작 필요 | `--daemon` (TODOS) |
| 8 | API 직접 통합 | 스키마/엔벨로프 없음 | OpenAPI 스펙 |

**TTHW 현재:** 설치 단계 미명세 → 측정 불가
**TTHW 목표:** 5분 이내 (Bun 설치 기준)

### DX 결정 추가

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|----------------|-----------|-----------|---------|
| 35 | DX | Quick Start 섹션 추가 (설치 명령 명세) | Mechanical | P1 | TTHW 정의 불가 = Critical | 설치 문서 없이 출시 |
| 36 | DX | `--no-open`, `--port`, `--project` CLI 플래그 추가 | Mechanical | P5 | CI/SSH/스크립팅 지원 필수 | 하드코딩 유지 |
| 37 | DX | 서버 시작 확인 stdout: `promptcraft ready on http://127.0.0.1:3001` | Mechanical | P5 | 실제 바인딩 포트 명시적 출력 | "Server started" 추상적 메시지 |
| 38 | DX | 실패 경로별 에러 문자열 명세 (바이너리 없음, 포트 소진, 마이그레이션, 경로 차단) | Mechanical | P1 | Decision 11 구현 위임 해소 | 구현 단계에서 결정 |
| 39 | DX | GET /api/scan/last로 분리 (GET/POST 동일 라우트 해소) | Mechanical | P5 | RESTful 의미론 명확화 | POST, GET 동일 라우트 유지 |
| 40 | DX | OpenAPI 3.1 최소 스펙 또는 라우트별 요청/응답 스키마 표 | Mechanical | P1 | API 통합 개발자 DX 기본 요건 | 마크다운 한 줄 설명으로 대체 |
| 41 | DX | 데몬 모드 → TODOS.md (Medium, P2) | Mechanical | P3 | 핵심 가치 제공 후 편의 기능 | 지금 구현 |
| 42 | Gate | Run as... 기능 → PRD 2.4 스코프 제외 (추후 별도 진행) | Mechanical | — | 사용자 명시적 방향 변경 | P0 유지 |
| 43 | Gate | VS Code 확장 → 계획 없음 (TODOS.md 항목도 제거) | Mechanical | — | 사용자 명시적 방향 변경 | P1 검토 |
| 44 | Gate | Node.js 호환 빌드 → 제외 (Bun exe 빌드로 대체, 호환 불필요) | Mechanical | — | 사용자 명시적 방향 변경 | Decision 10 무효화 |

### DX 스코어카드

| 차원 | 초기 | 목표 | 갭 |
|-----|-----|-----|---|
| 1. TTHW < 5분 | 1/10 | 8/10 | 설치 명령 없음 (Critical) |
| 2. CLI 네이밍 일관성 | 7/10 | 9/10 | `--no-open`, `--port`, `--project` 누락 |
| 3. 에러 메시지 완성도 | 3/10 | 9/10 | 실제 문자열 미명세 |
| 4. 문서 발견 가능성 | 4/10 | 8/10 | OpenAPI 스펙 없음 |
| 5. 업그레이드 경로 | 5/10 | 7/10 | DB 마이그레이션 자동 (OK), 버전 공지 미명세 |
| 6. 개발 환경 마찰 | 4/10 | 7/10 | 데몬 없음, 매 세션 재시작 필요 |
| 7. 에러 메시지 예시 (구체) | —/10 | 추가 필요 | 아래 참조 |
| 8. API 통합 DX | 2/10 | 8/10 | 스키마/엔벨로프 계약 없음 |

### 필수 에러 메시지 예시 명세

```
# 바이너리 미설치
Error: Cannot run as Claude Code
Cause: 'claude' not found in PATH
Fix: Run `npm install -g @anthropic-ai/claude-code` then restart promptcraft

# 포트 소진
Error: Could not start server
Cause: Ports 3000–3009 all in use
Fix: Free a port or run `promptcraft serve --port 4000`

# DB 마이그레이션 실패
Error: Database migration failed (v0 → v1)
Cause: DDL error: column 'token_estimate' already exists
Fix: Backup saved to ~/.promptcraft/db.sqlite.bak.1745000000
     Delete backup and restart, or report at github.com/.../issues

# 경로 순회 차단
Error: Access denied
Cause: Requested path resolves outside project root
Fix: Use a path within /Users/.../myproject
```

### DX 컨센서스 테이블 [subagent-only]

```
DX DUAL VOICES — CONSENSUS TABLE:
════════════════════════════════════════════════════════
  Dimension              Subagent  Primary   Consensus
  ─────────────────── ──────── ──────── ─────────
  TTHW < 5분?           Critical  Critical   CONFIRMED: 설치 단계 없음
  CLI 플래그 완성도?     High      High       CONFIRMED: --no-open 누락
  에러 메시지 품질?      High      High       CONFIRMED: 문자열 미명세
  API 스키마 계약?       High      High       CONFIRMED: OpenAPI 없음
  일상 마찰?            Medium    Medium     CONFIRMED: 데몬 없음 (TODOS)
  업그레이드 경로?       Low       Low        N/A (OK)
════════════════════════════════════════════════════════
```

**Phase 3.5 완료.** DX 전체: 4.2/10 → 목표 8/10. TTHW: 미측정 → 5분 목표. Codex: N/A. Subagent: 5개 발견. Consensus: 5/6 확인.
