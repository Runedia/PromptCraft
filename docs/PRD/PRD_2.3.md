# PRD — PromptCraft 2.3

**AI 바이브 코딩을 위한 로컬 웹 기반 구조화 프롬프트 생성 도구**

---

## 1. 개요

### 1.1 배경

AI 코딩 도구(Claude, Gemini, ChatGPT 등)를 활용한 '바이브 코딩(Vibe Coding)'의 성공 여부는 사용자가 제공하는 프롬프트의 품질에 직결됩니다. 대부분의 개발자는 모호하고 불완전한 질문을 입력하여 다음 세 가지 문제를 반복합니다.

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

PromptCraft는 이 구조를 근본적으로 해결합니다. 프롬프트 생성 단계에서 LLM을 일절 사용하지 않고, 단일 AI 호출에서 One-Shot 성공을 이끌어내는 구조화된 프롬프트를 로컬에서 완성합니다.

```
PromptCraft 구조:
  사용자 요청
    → [로컬 처리] 스캔 + SectionCard 동적 조립  ← 비용 제로
    → 구조화된 완성 프롬프트를 AI에 투입
    → [LLM API 호출 1회] 실제 작업 수행          ← 비용 발생 지점 단 1회
```

**PRD 2.2 → 2.3 전환 배경 — CLI 위자드의 구조적 제약:**

PRD 2.2의 CLI Ink 위자드 방식은 **정보 순차성**이라는 근본적 제약을 내재했습니다. `TREE_SELECT → SCAN → QNA → RESULT` 상태 머신은 전체 맥락 없이 단방향 결정을 강제했고, 다음 문제가 발생했습니다.

- 이전 단계로 돌아가기 위한 Undo 복잡도
- 섹션 필요 여부를 미리 판단 불가 (빈 헤더 출력 문제)
- 생성 결과를 입력과 동시에 확인 불가
- 터미널 환경의 렌더링 제약 (레이아웃, 마우스 조작)

이를 해결하기 위해 플랫폼을 **로컬 웹 서버 기반 Dual-Pane 인터페이스**로 전환했습니다.

### 1.2 제품 정의

PromptCraft는 로컬 코드베이스를 스캔·분석하고, SectionCard 모델 기반 웹 UI를 통해 사용자의 의도를 구조화하여 AI 코딩 도구에 최적화된 완성형 프롬프트를 생성하는 **로컬 설치형 Node.js 웹 기반 도구**입니다.

**핵심 설계 철학: 프롬프트 생성 비용 제로 + 단 한 번의 AI 호출로 완결**

| 구분 | 방식 | 설명 |
|---|---|---|
| 프로젝트 스캔 | 규칙 기반 (로컬) | 파일 시스템 분석, 언어/프레임워크 자동 감지 |
| 프롬프트 조립 | SectionCard 모델 (로컬) | 25개 카드 정의 기반 동적 섹션 조립 |
| 실시간 프리뷰 | 클라이언트 사이드 (로컬) | 마크다운 렌더링 + 토큰 추정 동시 표시 |
| 프롬프트 다듬기 | 선택적 AI (옵션) | 필요 시 로컬 LLM을 통한 후처리 |

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

| 절감 유형 | 상대적 비중 | 설명 |
|---|---|---|
| 입력 압축 (스캔 요약) | 낮음 | 파일 트리 전체 → 핵심 경로 요약 |
| 재질문 왕복 제거 | 높음 | 대화 1회 = 누적 컨텍스트 전체 재전송 |
| 프롬프트 생성 단계 API 제거 | 높음 | 경쟁 도구 대비 1회 API 호출 완전 제거 |

### 1.4 구조화 템플릿의 설계 근거

Anthropic의 Claude Prompting Best Practices, OpenAI의 Prompt Engineering Guide, Google의 Gemini Prompting Guide에서 수렴하는 원칙을 카드 정의(`hint`, `examples` 필드)에 내재화합니다. 이 포맷은 Claude Code, GPT Codex, Gemini 등 주요 AI 코딩 도구 전반에서 크로스모델 표준으로 검증되었습니다.

**핵심 원칙:**
- 역할·목표·컨텍스트·제약을 명시적으로 섹션 분리
- 불변 정보(스택/환경)를 상단 배치, 가변 정보(현재 문제)를 하단 배치
- 자연어 산문 대신 구조적 헤더로 정보 레이블링
  → 동일 정보를 산문 대비 적은 토큰으로, 더 높은 해석 정확도로 전달

**PRD 2.3 추가 원칙:**
- 각 트리(상황 유형)별 특화 가이드라인 내재화 — `output-format` 카드의 상황별 옵션, `goal` 카드의 트리별 기본값·예시가 이를 반영
- 다양한 역할 예시 제공으로 도메인별 최적 페르소나 설정 유도

### 1.5 목표

- **프롬프트 생성 단계의 LLM 비용 완전 제거** (로컬 규칙 기반 100% 동작)
- **One-Shot 응답 성공률 극대화** (구조화 SectionCard 템플릿을 통한 모델 사고 효율 향상)
- **재질문 왕복 및 불필요한 토큰 소비 최소화**
- **동시적 정보 입력과 실시간 프리뷰를 통한 프롬프트 작성 효율 극대화**
- **섹션 단위 카드 모델을 통한 프롬프트 구조에 대한 사용자 완전 제어**
- 프로젝트 컨텍스트를 매번 수동으로 설명해야 하는 반복 작업 제거
- 빠르고 가벼운 100% TypeScript / Node.js 생태계 기반 동작 보장

### 1.6 프로젝트 정보

| 항목 | 내용 |
|---|---|
| 팀 구성 | 최대 4인 |
| 개발 환경 | Node.js 24+, pnpm 10+ |
| 개발 기간 | 3 ~ 4개월 |
| 주요 언어 | TypeScript (Node.js + React) |

---

## 2. 사용자 정의

### 2.1 타겟 사용자

**Primary** — AI 코딩 도구를 자주 사용하며 바이브 코딩을 실천하려는 개발자

- AI에게 상황 설명을 매번 타이핑하는 것이 귀찮은 사람
- 질문을 구체화하지 못해 AI와 불필요한 스무고개를 자주 하는 사람
- LLM API 비용 또는 토큰 소모량에 민감한 사람
- 프롬프트 보조 도구가 또 다른 API 비용을 발생시키는 구조에 불만을 가진 사람

### 2.2 핵심 사용자 시나리오

> 김개발은 진행 중인 Next.js 프로젝트에서 알 수 없는 렌더링 에러를 만났다. 터미널에서 `promptcraft serve`를 실행하면 브라우저가 자동으로 열린다. 4개 상황 유형 중 '에러 해결'을 선택하면, 프로젝트 경로 입력란에 현재 디렉토리를 입력하는 순간 자동으로 스캔이 시작된다. 스캔 결과를 기반으로 '스택 & 환경' 카드에 Next.js 14, pnpm 등이 자동으로 채워지고, '역할' 카드에는 React 개발자, 프론트엔드 개발자 등 프레임워크 기반 제안 칩이 표시된다. 제안 칩을 클릭하여 역할을 선택하고, '에러 증거' 카드에 `@src/components/Header.tsx`를 입력하면 서버 사이드 자동완성이 파일 후보를 제안한다. 각 카드를 채울 때마다 오른쪽 프리뷰 패널이 즉시 갱신된다. '시도한 방법' 카드가 불필요하면 제거하고, 카드 풀에서 '빌드 로그' 카드를 추가하여 드래그로 원하는 위치에 배치한다. `Ctrl+Enter`로 완성된 프롬프트를 클립보드에 복사하여 AI에 투입, 단 한 번에 정확한 해결 코드를 받는다.

---

## 3. 기능 요구사항

### 3.1 기능 목록 및 우선순위

| 기능 | 설명 | 구현 방식 | 우선순위 |
|---|---|---|---|
| 로컬 웹 서버 (`promptcraft serve`) | Express + React 기반 웹 UI 실행, 브라우저 자동 오픈, 포트 자동 탐색 | Express 5 + open | P0 |
| Dual-Pane 레이아웃 | 좌: 카드 편집기 / 우: 실시간 마크다운 프리뷰 (60/40 분할) | React + Tailwind CSS v4 | P0 |
| SectionCard 모델 | 25개 카드 정의, 활성화/비활성화/순서 변경/값 입력 | Zustand + core/builder | P0 |
| 멀티 파서 스캔 | 프로젝트 로컬 디렉토리 분석 (언어/프레임워크/구조 자동 감지) | Node.js (fs) — 로컬 전용 | P0 |
| 트리 선택 화면 | 4개 상황 유형 카드 그리드 선택 (에러 해결/기능 구현/코드 리뷰/개념 학습) | TreeSelect 컴포넌트 | P0 |
| 카드 풀 | 비활성 섹션 목록, 트리 타입 기반 제안 카드 추가/제거 | CardPool 컴포넌트 | P0 |
| 실시간 프롬프트 빌드 & 프리뷰 | active 카드 조립 + 마크다운 렌더링 + 토큰 추정 실시간 반영 | react-markdown + tokenEstimator | P0 |
| @file 멘션 시스템 | 서버 사이드 경로 자동완성, 파일 내용 인라인 삽입, 경로 순회 방지 | /api/mention + MentionInput | P0 |
| 폴더 브라우저 모달 | 서버 사이드 파일시스템 탐색 모달, Windows 드라이브 문자 지원 | FolderBrowser + /api/browse | P0 |
| 드래그 앤 드롭 카드 순서 변경 | @dnd-kit 기반 카드 재배치, order 필드 반영 | @dnd-kit/sortable | P0 |
| 클립보드 복사 + 키보드 단축키 | Ctrl+Enter 복사, Ctrl+S 저장, Ctrl+Z/Shift+Z Undo/Redo | useKeyboard hook | P0 |
| Undo/Redo | 카드 조작 10단계 실행 취소/재실행 | Zundo temporal middleware | P0 |
| REST API (9개 라우트) | browse, scan, trees, cards, prompt, history, template, config, mention | Express Router | P0 |
| 보안 미들웨어 | CSP 헤더, localhost CORS, 경로 순회 방지, 확장자 차단 | Express middleware | P0 |
| Pre-scan (자동 스캔) | 프로젝트 경로 입력 800ms 후 자동 스캔 트리거 | useScan hook (debounce) | P1 |
| 역할 자동 제안 칩 | 스캔 결과 기반 프레임워크별 역할 후보 칩 최대 5개 표시 | buildRoleOptions() | P1 |
| defaultValue 필드 | CardDefinition 기본값 프리필 (예: code-review goal 자동 입력) | tree JSON cardOverrides | P1 |
| 상황별 output-format 옵션 | 트리별 다른 출력 형식 옵션 제공 (error-solving/code-review/concept-learn) | tree JSON cardOverrides | P1 |
| 프롬프트 히스토리 | SQLite 기반 히스토리 CRUD (조회/상세/삭제) | /api/history + SQLite | P1 |
| 템플릿 프리셋 저장/로드 | 카드 구성 + 값 일괄 저장 재사용 | /api/templates + SQLite | P1 |
| 환경 설정 관리 (Config) | 전역/프로젝트 스코프 설정 관리 | /api/config + CLI config | P1 |
| 세션 복구 | localStorage 자동 저장, 재진입 시 이전 작업 복원 | localStorage + cardStore | P1 |
| 선택적 AI 다듬기 | 생성된 프롬프트 자연어 후처리 | 외부/로컬 LLM (옵션) | P2 |

### 3.2 핵심 기능 상세

#### 3.2.1 SectionCard 모델

프롬프트의 각 섹션은 독립적인 카드 단위로 존재합니다. 카드는 **활성(active)** 또는 **비활성(inactive, 카드 풀에 위치)** 상태를 가집니다.

**SectionCard 속성:**

| 속성 | 타입 | 설명 |
|---|---|---|
| `id` | string | 고유 식별자 |
| `label` | string | UI 표시명 |
| `required` | boolean | 필수 카드 (제거 불가) |
| `active` | boolean | 현재 프롬프트에 포함 여부 |
| `order` | number | 섹션 출력 순서 |
| `inputType` | enum | text / multiline / select / select-or-text / multiline-mention |
| `value` | string | 입력값 |
| `template` | string | 프롬프트 조립용 마크다운 템플릿 (`{{value}}` 치환) |
| `hint` | string? | 입력 힌트 |
| `examples` | string[]? | 예시값 목록 |
| `options` | SelectOption[]? | select 타입 선택지 |
| `scanSuggested` | boolean? | 스캔 결과 자동 채움 대상 여부 |
| `defaultValue` | string? | 카드 초기화 시 자동 설정되는 기본값 |

**25개 카드 정의 목록:**

| 카드 ID | 레이블 | 필수 | 입력 타입 | 비고 |
|---|---|---|---|---|
| `role` | 역할 | ✓ | select-or-text | 스캔 기반 동적 옵션 |
| `goal` | 목표 | ✓ | text | 트리별 defaultValue |
| `stack-environment` | 스택 & 환경 | — | multiline | scanSuggested: true |
| `error-evidence` | 에러 증거 | — | multiline-mention | @파일 참조 지원 |
| `tried-methods` | 시도한 방법 | — | multiline | — |
| `current-situation` | 현재 상황 | — | multiline-mention | — |
| `constraints` | 제약 조건 | — | multiline | — |
| `build-log` | 빌드 로그 | — | multiline-mention | — |
| `request-log` | 요청/응답 로그 | — | multiline-mention | — |
| `profiling-data` | 프로파일링 데이터 | — | multiline | — |
| `baseline-metric` | 기준 성능 지표 | — | text | — |
| `impl-scope` | 구현 범위 | — | select-or-text | 신규/수정 선택 |
| `target-code` | 대상 코드 | — | multiline-mention | — |
| `tech-preference` | 기술 선호 | — | text | — |
| `modification-scope` | 수정 범위 | — | text | — |
| `review-code` | 리뷰 대상 코드 | — | multiline-mention | — |
| `review-focus` | 리뷰 중점 | — | select-or-text | 8가지 중점 옵션 |
| `security-context` | 보안 맥락 | — | text | — |
| `concern-area` | 우려 영역 | — | text | — |
| `concept` | 학습 개념 | — | text | — |
| `skill-level` | 현재 수준 | — | select-or-text | 입문/중급/심화 |
| `output-pref` | 설명 방식 | — | select-or-text | 개념/코드/비교 |
| `expected-behavior` | 기대 동작 | — | multiline | — |
| `acceptance-criteria` | 수락 기준 | — | multiline | — |
| `output-format` | 응답 형식 | — | select-or-text | 트리별 특화 옵션 |
| `example-io` | 입출력 예시 | — | multiline | — |
| `related-code` | 관련 코드 | — | multiline-mention | — |

**프롬프트 빌드 규칙:**
`active === true && value.trim() !== ''` 조건을 만족하는 카드만 `order` 오름차순으로 조립합니다. 빈 값의 active 카드는 프리뷰에서 회색으로 표시하되, 최종 출력에는 포함하지 않습니다. `{{value}}` 치환은 injection 방지를 위해 단일 패스(single-pass) 방식으로 처리합니다.

#### 3.2.2 트리 기반 카드 풀 및 자동 제안

4개 워크플로우 트리가 카드 초기 구성을 선언적으로 정의합니다.

| 트리 ID | 레이블 | 기본 활성 카드 | 카드 풀 |
|---|---|---|---|
| `error-solving` | 에러 해결 | role, goal, stack-environment, error-evidence, tried-methods | expected-behavior, current-situation, constraints, build-log, request-log, profiling-data, baseline-metric, example-io, output-format |
| `feature-impl` | 기능 구현 | role, goal, stack-environment, impl-scope | acceptance-criteria, current-situation, target-code, related-code, tech-preference, modification-scope, constraints, example-io, output-format |
| `code-review` | 코드 리뷰 | role, goal, review-code, review-focus | related-code, security-context, concern-area, constraints, output-format |
| `concept-learn` | 개념 학습 | role, goal, concept, skill-level, output-pref | constraints, example-io, related-code, output-format |

**cardOverrides 메커니즘:** 트리 JSON의 `cardOverrides` 필드로 특정 카드의 hint, examples, defaultValue, options를 트리별로 재정의합니다. 예: `code-review` 트리의 `goal` 카드는 기본값을 "이 코드의 잠재적 문제점과 개선 방향을 리뷰해 줘."로 프리필하며, `output-format` 카드는 코드 리뷰 전용 4가지 출력 형식 옵션을 제공합니다.

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
│                                 │  ─────────────────────── │
│  CARD POOL (추가 가능)           │  토큰 추정: ~380 tokens  │
│  [+ 현재 상황] [+ 제약] [+ ...]  │  [↩] [↪] [복사] [저장]  │
└─────────────────────────────────┴──────────────────────────┘
```

- 좌측 패널: 활성 카드 목록 (드래그 앤 드롭 순서 변경 가능)
- 우측 패널: 실시간 마크다운 프리뷰 + 토큰 추정 + Undo/Redo + 액션 버튼
- 필수 카드(`required: true`): 제거 불가 (잠금 아이콘 표시)
- 비필수 카드: [×] 버튼으로 카드 풀로 복귀

#### 3.2.4 @file 멘션 시스템

`multiline-mention` 입력 타입은 `@` 입력 시 서버 사이드 파일 경로 자동완성을 활성화합니다.

- **자동완성**: `GET /api/mention/suggest?root=&path=` — 경로 후보 최대 30개 반환, 키보드(↑↓ Enter Tab) 탐색 지원
- **파일 읽기**: `POST /api/mention/read` — 선택한 파일 내용 카드 값에 인라인 삽입
- **보안**: `pathGuard.ts` 미들웨어로 경로 순회(`../`) 시도 차단, `.env`·바이너리 확장자 차단

#### 3.2.5 폴더 브라우저 모달

서버 사이드 파일시스템을 탐색하는 모달 다이얼로그입니다.

- `GET /api/browse?path=` — 지정 경로의 하위 디렉토리 목록 반환
- Windows 드라이브 문자(`C:\`, `D:\` 등) 자동 감지 및 목록 표시
- 상위 디렉토리 이동, 경로 직접 입력 지원

#### 3.2.6 프로젝트 스캔 통합 및 Pre-scan

**Pre-scan:** `TreeSelect` 화면의 프로젝트 경로 입력 시 800ms debounce 후 자동으로 `POST /api/scan`을 트리거합니다. 사용자가 명시적으로 스캔 버튼을 누를 필요가 없습니다.

**스캔 결과 활용:**
- `stack-environment` 카드에 감지된 언어/프레임워크/패키지 매니저 자동 채움
- `role` 카드에 프레임워크 기반 역할 제안 칩 최대 5개 표시 (예: React 감지 → "React 개발자", "프론트엔드 개발자")
- `multiline-mention` 카드의 @멘션 자동완성 루트 경로로 사용

**스캔 분석 항목:** 언어별 파일 수, 프레임워크 및 라이브러리 (`package.json` 의존성 기반), 디렉토리 구조 (최대 깊이 2~5, 언어별 조정), 패키지 매니저 (pnpm/yarn/npm), `.env` 파일 존재 여부, 설정 파일 목록, gitignore 규칙 적용

#### 3.2.7 REST API 라우트 목록

| 라우트 | 메서드 | 설명 |
|---|---|---|
| `/api/browse` | GET | 폴더 탐색 (디렉토리 목록, Windows 드라이브 지원) |
| `/api/scan` | POST, GET | 프로젝트 스캔 실행 / 마지막 스캔 결과 조회 |
| `/api/trees` | GET | 트리 설정 목록 / 개별 트리 + 카드 정의 |
| `/api/cards` | GET | 전체 카드 정의 로드 |
| `/api/prompt/build` | POST | 카드 배열로 프롬프트 조립 + 토큰 추정 + 히스토리 저장 |
| `/api/history` | GET, DELETE | 히스토리 목록/상세 조회 및 삭제 |
| `/api/templates` | GET, POST, DELETE | 프리셋 템플릿 저장/로드/삭제 |
| `/api/config` | GET, PUT | 설정 조회/변경 |
| `/api/mention/suggest` | GET | @멘션 경로 자동완성 후보 반환 |
| `/api/mention/read` | POST | @멘션 파일 내용 읽기 |

#### 3.2.8 키보드 단축키

| 단축키 | 동작 | 컨텍스트 |
|---|---|---|
| `Ctrl/Cmd + Enter` | 프롬프트 클립보드 복사 | 전역 |
| `Ctrl/Cmd + S` | 템플릿 저장 모달 열기 | Workspace |
| `Ctrl/Cmd + Z` | 실행 취소 (Undo) | Workspace |
| `Ctrl/Cmd + Shift + Z` | 다시 실행 (Redo) | Workspace |
| `Tab` | 다음 카드 입력으로 포커스 이동 | Workspace |
| `Shift + Tab` | 이전 카드 입력으로 포커스 이동 | Workspace |
| `Escape` | 모달 닫기 / @멘션 드롭다운 닫기 | 전역 |

---

## 4. 비기능 요구사항

| 항목 | 요구사항 |
|---|---|
| 실행 환경 | Windows, macOS, Linux (Node.js 24+ 필수) |
| 네트워크 격리 | `127.0.0.1` 바인딩 전용, 외부 네트워크 접근 차단 |
| 포트 충돌 | 기본 포트 3000, 사용 중 시 자동 다음 포트 탐색 (최대 10회) |
| 설정 보존 | `~/.promptcraft/` 글로벌 또는 프로젝트 범위 안전 저장 |
| LLM 의존성 | 코어 생성 로직(스캔/카드 조립/빌드)은 LLM API 없이 100% 로컬 동작 보장 |
| 타입 안정성 | TypeScript strict 모드, 컴파일 에러 Zero |
| 보안 헤더 | CSP, X-Content-Type-Options, X-Frame-Options 적용 |
| CORS | `localhost` origin만 허용 |
| 경로 보안 | 경로 순회(`../`) 시도 403 차단, `.env`·바이너리 파일 접근 차단 |
| 반응속도 | 카드 입력 → 프리뷰 갱신 < 100ms (상태 변경은 debounce 없이 즉시 반영) |
| 세션 복구 | `localStorage` 자동 저장 (debounce 1초), 재진입 시 이전 작업 복원 프롬프트 |
| Undo/Redo | 카드 조작 10단계 temporal state (Zundo) |
| Graceful Shutdown | SIGINT/SIGTERM 시 DB 커넥션 정리, 10초 강제 종료 타임아웃 |
| 스캔 성능 | 스캔 완료 5초 이내 |
| 빌드 성능 | 프롬프트 조립 5초 이내 |

### 4.1 반응형 레이아웃 요구사항

| 브레이크포인트 | 레이아웃 | 비고 |
|---|---|---|
| >= 1280px | Dual-Pane 60/40 | 기본 데스크탑 경험 |
| 1024 ~ 1279px | Dual-Pane 55/45 | 축소된 프리뷰 |
| 768 ~ 1023px | 단일 패널 + 프리뷰 토글 버튼 | 탭 전환 UX |
| < 768px | 단일 패널 전용 + floating 프리뷰 시트 | 모바일 대응 (P2) |

---

## 5. 기술 스택

### 공통 (CLI + Web)

| 영역 | 기술/도구 |
|---|---|
| 언어 | TypeScript 5.9+ (ESM, NodeNext 모듈) |
| 런타임 | Node.js 24+ |
| 패키지 매니저 | pnpm 10+ |
| CLI 프레임워크 | Commander.js 14+ |
| 파일 스캔 엔진 | TypeScript (fs, path) — 로컬 전용 |
| 데이터베이스 | SQLite (better-sqlite3 12+) |
| 린트/포맷 | Biome |

### Web 전용

| 영역 | 기술/도구 |
|---|---|
| HTTP 서버 | Express 5+ |
| 번들러 | Vite 6+ (`@vitejs/plugin-react`, `@tailwindcss/vite`) |
| UI 프레임워크 | React 19 + ReactDOM 19 |
| 스타일링 | Tailwind CSS v4 |
| UI 컴포넌트 | shadcn/ui (Radix UI primitives) |
| 상태 관리 | Zustand 5 + zundo 2 (temporal middleware, 10-state undo/redo) |
| 드래그 앤 드롭 | @dnd-kit/core + @dnd-kit/sortable |
| 마크다운 렌더링 | react-markdown 9 |
| 아이콘 | lucide-react |
| 유틸리티 | clsx, tailwind-merge (cn() 유틸) |

### 레거시 (유지보수 모드, P2)

| 영역 | 기술/도구 |
|---|---|
| 터미널 UI | Ink 6 (React 기반 CLI) |
| 템플릿 엔진 | Handlebars 4 |
| 인터랙티브 프롬프트 | @inquirer/prompts, inquirer |

---

## 6. 개발 타임라인

### 4개월 기준

| 기간 | 마일스톤 | 주요 작업 |
|---|---|---|
| 1개월차 | 웹 인프라 구축 | Express 서버, Vite 설정, SectionCard 모델 설계, 25개 카드 정의 JSON, REST API 스켈레톤, TypeScript 공통 타입 정의 |
| 2개월차 | 코어 웹 UI MVP | Dual-Pane 레이아웃, TreeSelect 화면, SectionCard 편집, 카드 풀, 실시간 프리뷰 패널, Zustand 스토어, 스캔 통합 |
| 3개월차 | 고급 기능 완성 | @file 멘션 자동완성, 폴더 브라우저, 드래그 앤 드롭, Undo/Redo, Pre-scan, 역할 자동 제안, 키보드 단축키, 보안 미들웨어 |
| 4개월차 | 안정화 및 폴리싱 | 반응형 레이아웃, 세션 복구, 히스토리/템플릿 웹 연동, 테스트 보강, 문서화, 릴리스 |

---

## 7. MVP 범위 및 변경점 (PRD 2.2 → 2.3)

### 7.1 아키텍처 마이그레이션

| 항목 | PRD 2.2 (이전) | PRD 2.3 (현재) |
|---|---|---|
| 플랫폼 | CLI Ink 위자드 | 로컬 웹 서버 (Express + React + Vite) |
| 프롬프트 조립 | Handlebars 고정 템플릿 | SectionCard 25개 카드 동적 조립 |
| Q&A 방식 | 순차 분기 위자드 (TREE→SCAN→QNA→RESULT) | 동시적 Dual-Pane (카드 편집 + 프리뷰 병행) |
| 섹션 제어 | 불가 (고정 출력) | 카드 단위 추가/제거/순서 변경 |
| 진입 명령어 | `promptcraft build` | `promptcraft serve` |
| 인터랙션 모델 | 단방향 질문 흐름 | 자유 편집 + 실시간 반영 |

### 7.2 신규 추가 항목

1. `promptcraft serve` 명령어 및 Express 서버 (`src/server/`)
2. Dual-Pane React 웹 애플리케이션 (`src/web/`)
3. SectionCard 모델 및 25개 카드 정의 (`data/cards/card-definitions.json`)
4. 4개 트리 JSON 재설계 (`defaultActiveCards`, `cardPool`, `cardOverrides` 선언)
5. `cardSession.ts` — CardSession 생성/관리 및 순수 불변 카드 조작 함수
6. `promptBuilder.ts` — active 카드 조립 + @멘션 링크 변환 + injection-safe 치환
7. `tokenEstimator.ts` — 한국어/영어 차등 토큰 추정
8. Zustand + Zundo 기반 글로벌 상태 관리 (`src/web/store/cardStore.ts`)
9. @dnd-kit 드래그 앤 드롭
10. react-markdown 실시간 프리뷰
11. @file 멘션 자동완성 (MentionInput + /api/mention)
12. 폴더 브라우저 모달 (FolderBrowser + /api/browse)
13. Pre-scan debounced 자동 스캔 (useScan hook)
14. 역할 자동 제안 칩 (`buildRoleOptions()`)
15. `defaultValue` 필드 및 상황별 `output-format` 옵션 (tree cardOverrides)
16. 보안 미들웨어 3종 (CSP, CORS, pathGuard)
17. Tailwind CSS v4 + shadcn/ui 기반 디자인 시스템 (`src/web/styles/design-system.css`)
18. `CardDefinition` 타입 시스템 확장 (`src/core/types/card.ts`)

### 7.3 제거 및 대체된 항목

| 항목 | 이전 구현 | 대체 |
|---|---|---|
| Handlebars 템플릿 (6개 파일) | `data/templates/*.hbs` | SectionCard의 `template` 필드 |
| Q&A 엔진 | `src/core/qna/engine.ts`, `validator.ts` | `CardSession` + `TreeConfig` |
| 역할 제안기 | `src/core/qna/role-suggester.ts` | `buildRoleOptions()` (cardSession.ts) |
| Ink UI 컴포넌트 (21개 파일) | `src/cli/ui/ink/` | React 웹 컴포넌트 (`src/web/`) |
| 레거시 CLI 타입 | `src/core/types.ts` (Q&A/Preset 관련) | `src/core/types/card.ts` |
| 관련 테스트 파일 (10개) | `tests/qna.test.ts` 등 | (웹 UI 테스트로 대체 예정) |

### 7.4 유지되는 항목

- 스캔 엔진 (`src/core/scanner/`) — 변경 없음
- SQLite 스키마 및 DB 레이어 (`src/core/db/`) — history, template, config 테이블 유지
- CLI 명령어: `promptcraft config`, `promptcraft history`, `promptcraft scan`
- 공유 유틸리티 (`src/shared/errors.ts`, `constants.ts`, `utils.ts`)
- Ink 위자드 (`src/cli/ui/ink/`) — P2 레거시 유지보수 모드

### 7.5 향후 과제

`report.txt`에서 식별된 프롬프트 완성도 개선 항목으로, 다음 버전(PRD 2.4)에서 구현을 검토합니다.

| 과제 | 설명 | 효과 |
|---|---|---|
| 근거 문서화 (Rationale) 자동 삽입 | 프롬프트에 "이 요청을 하는 이유"를 구조화 섹션으로 자동 추가 | 모델이 의도를 더 정확히 파악 |
| 검증/가드레일 단계 자동 삽입 | 모든 프롬프트 빌드 완료 시 "Defensive Thinking" 요구 지시어 선택 삽입 | AI 결과물 신뢰도 향상 |
| 자동 제약 조건 매핑 | 스캔 결과(`tsconfig`, `.eslintrc` 등)에서 제약 조건 자동 추출 → `constraints` 카드 자동 채움 | 컨텍스트 누락 방지 |

---

## 8. 성공 지표

| 지표 | 측정 방법 |
|---|---|
| 프롬프트 생성 소요 시간 | 수동 작성 대비 70% 이상 단축 (상황 선택 시점부터 클립보드 복사까지) |
| 섹션 제어 정확성 | active 카드만 프롬프트에 포함되는지 단위 테스트 |
| 빈 헤더 출력 zero | value가 비어있는 active 카드 미출력 자동 검증 |
| 프리뷰 반응속도 | 카드 입력 이벤트 → DOM 갱신 100ms 이내 |
| LLM 호출 zero | 코어 플로우 내 외부 API 호출 부재 검증 |
| 구동 안정성 | TypeScript 컴파일 에러 Zero, 빌드 단계 에러 Zero |
| 보안 검증 | 경로 순회 시도 시 403 응답, CSP 위반 zero |
| @멘션 보안 | pathGuard를 통한 프로젝트 루트 외 파일 접근 차단 100% |
