# Architecture Design — PromptCraft

---

## 1. 시스템 아키텍처 개요

```
┌──────────────────────────────────────────────────────────┐
│                      사용자 인터페이스                   │
│                                                          │
│   ┌──────────────┐              ┌─────────────────────┐  │
│   │   CLI        │              │   Web UI (React)    │  │
│   │  Commander.js│              │   localhost:3000    │  │
│   │  Inquirer.js │              │                     │  │
│   └──────┬───────┘              └──────────┬──────────┘  │
│          │ 직접 호출                       │ HTTP        │
└──────────┼─────────────────────────────────┼─────────────┘
           │                                 │
           ▼                                 ▼
┌──────────────────────┐      ┌───────────────────────────┐
│                      │      │   API Server              │
│                      │◄─────┤   Express (localhost)     │
│    Core Logic        │      │   REST endpoints          │
│    (Library)         │      └───────────────────────────┘
│                      │
│  ┌────────────────┐  │
│  │ Scanner        │  │      ┌───────────────────────────┐
│  │ QnA Engine     │  │      │   Data Layer              │
│  │ Prompt Builder │  │─────►│   SQLite (better-sqlite3) │
│  │ Context Gen    │  │      │   ~/.promptcraft/db       │
│  └────────────────┘  │      └───────────────────────────┘
│                      │
└──────────────────────┘
```

### 핵심 원칙

- **CLI는 Core Logic을 직접 호출**한다. Express 서버를 경유하지 않는다.
- **Web UI는 Express API를 통해** Core Logic에 접근한다.
- **Core Logic은 순수 라이브러리**로, HTTP나 CLI에 대한 의존성이 없다.
- MVP 단계에서 **Node.js 단일 스택**으로 구현한다.

---

## 2. 모듈 구조

```
promptcraft/
├── bin/
│   └── promptcraft.js          # CLI entry point (#!/usr/bin/env node)
│
├── src/
│   ├── core/                   # Core Logic (라이브러리 계층)
│   │   ├── scanner/
│   │   │   ├── index.js        # Scanner 진입점
│   │   │   ├── language.js     # 확장자 기반 언어 감지
│   │   │   ├── framework.js    # 설정 파일 기반 프레임워크 감지
│   │   │   └── structure.js    # 디렉토리 트리 생성 (depth 2)
│   │   │
│   │   ├── qna/
│   │   │   ├── index.js        # QnA 엔진 진입점
│   │   │   ├── engine.js       # 분기 트리 순회 로직
│   │   │   └── validator.js    # 입력 유효성 검증
│   │   │
│   │   ├── prompt/
│   │   │   ├── index.js        # 프롬프트 빌더 진입점
│   │   │   ├── builder.js      # 템플릿 조립 로직
│   │   │   └── templates/      # 프롬프트 템플릿 파일들
│   │   │
│   │   ├── context/
│   │   │   ├── index.js        # 컨텍스트 파일 생성기 진입점
│   │   │   ├── generator.js    # 포맷별 생성 로직
│   │   │   └── formats/        # CLAUDE.md, GEMINI.md 템플릿
│   │   │
│   │   └── db/
│   │       ├── index.js        # DB 접근 계층 진입점
│   │       ├── connection.js   # SQLite 연결 관리
│   │       └── repositories/   # 테이블별 CRUD
│   │           ├── history.js
│   │           ├── template.js
│   │           └── config.js
│   │
│   ├── cli/                    # CLI 계층
│   │   ├── index.js            # Commander.js 명령어 정의
│   │   ├── commands/
│   │   │   ├── scan.js         # promptcraft scan
│   │   │   ├── build.js        # promptcraft build (질의응답 → 프롬프트)
│   │   │   ├── context.js      # promptcraft context
│   │   │   └── history.js      # promptcraft history
│   │   └── ui/
│   │       └── prompts.js      # Inquirer.js 대화형 UI
│   │
│   ├── api/                    # API 서버 계층
│   │   ├── index.js            # Express 앱 설정
│   │   ├── routes/
│   │   │   ├── scan.js         # /api/scan
│   │   │   ├── qna.js          # /api/qna
│   │   │   ├── prompt.js       # /api/prompt
│   │   │   ├── context.js      # /api/context
│   │   │   └── history.js      # /api/history
│   │   └── middleware/
│   │       ├── errorHandler.js
│   │       └── validation.js
│   │
│   └── shared/                 # 공유 유틸리티
│       ├── constants.js        # 상수 정의
│       ├── errors.js           # 커스텀 에러 클래스
│       └── utils.js            # 공통 헬퍼
│
├── data/
│   ├── trees/                  # 분기 트리 JSON 정의
│   │   ├── error-solving.json
│   │   ├── feature-impl.json
│   │   ├── code-review.json
│   │   └── concept-learn.json
│   └── templates/              # 프롬프트 및 컨텍스트 템플릿
│       ├── prompt-default.hbs
│       ├── claude.hbs
│       └── gemini.hbs
│
├── web/                        # React 웹 UI (별도 빌드)
│   ├── src/
│   ├── public/
│   └── package.json
│
├── tests/
├── package.json
└── README.md
```

---

## 3. 계층별 책임

### 3.1 Core Logic (`src/core/`)

| 모듈 | 책임 | 입력 | 출력 |
|---|---|---|---|
| Scanner | 디렉토리 분석 | 경로(string) | ScanResult 객체 |
| QnA Engine | 분기 트리 순회, 다음 질문 결정 | 트리ID + 현재 응답 | 다음 질문 또는 완료 상태 |
| Prompt Builder | 수집 데이터 → 프롬프트 조립 | ScanResult + QnA 응답 | 완성된 프롬프트(string) |
| Context Generator | 컨텍스트 파일 생성 | ScanResult + 사용자 설정 | 파일 내용(string) |
| DB | 데이터 영속화 | CRUD 파라미터 | 결과 객체 |

### 3.2 CLI (`src/cli/`)

- Commander.js로 명령어 정의
- Inquirer.js로 대화형 입력 처리
- Core Logic 모듈을 직접 `require()`하여 호출
- 출력은 터미널 텍스트 + 클립보드 복사

### 3.3 API Server (`src/api/`)

- Express로 REST API 제공
- Core Logic을 HTTP로 래핑하는 역할만 수행
- 자체 비즈니스 로직 없음
- Web UI 정적 파일 서빙 (`web/build/`)

### 3.4 Web UI (`web/`)

- React SPA
- API Server에 HTTP 요청
- 독립적으로 빌드 (`npm run build` → `web/build/`)
- Express가 빌드 결과물을 정적 파일로 서빙

---

## 4. 데이터 흐름

### 4.1 프롬프트 생성 (CLI)

```
사용자 → CLI(scan 명령) → Scanner.scan(path)
                              │
                              ▼
                         ScanResult 반환
                              │
사용자 → CLI(build 명령) → QnA Engine.start(treeId)
                              │
                         ┌────┴────┐
                         │ 질문 루프 │ ← 사용자 응답 반복
                         └────┬────┘
                              │
                         QnA 완료 (answers 객체)
                              │
                              ▼
                     Prompt Builder.build(scanResult, answers)
                              │
                              ▼
                     완성된 프롬프트 → 클립보드 복사 + DB 저장
```

### 4.2 프롬프트 생성 (Web UI)

```
React UI → POST /api/scan { path }
              → Scanner.scan(path)
              → 200 { scanResult }

React UI → POST /api/qna/start { treeId }
              → QnA Engine.start(treeId)
              → 200 { firstQuestion }

React UI → POST /api/qna/answer { sessionId, answer }
              → QnA Engine.next(sessionId, answer)
              → 200 { nextQuestion | completed: true, answers }

React UI → POST /api/prompt/build { scanResult, answers }
              → Prompt Builder.build(scanResult, answers)
              → 200 { prompt }
```

---

## 5. 주요 데이터 구조

### ScanResult

```json
{
  "path": "/home/user/my-project",
  "languages": [
    { "name": "JavaScript", "extension": ".js", "count": 45, "percentage": 62.5 },
    { "name": "TypeScript", "extension": ".ts", "count": 20, "percentage": 27.8 }
  ],
  "frameworks": [
    { "name": "Express", "version": "4.18.2", "source": "package.json" },
    { "name": "React", "version": "18.2.0", "source": "package.json" }
  ],
  "structure": {
    "name": "my-project",
    "children": [
      { "name": "src", "children": ["components", "utils", "pages"] },
      { "name": "tests", "children": ["unit", "integration"] }
    ]
  },
  "packageManager": "npm",
  "hasEnv": true,
  "configFiles": ["package.json", ".eslintrc.js", "tsconfig.json"],
  "scannedAt": "2026-03-06T12:00:00Z"
}
```

### QnA Session State

```json
{
  "sessionId": "uuid-v4",
  "treeId": "error-solving",
  "currentNodeId": "error-message",
  "answers": {
    "situation": "error-solving",
    "language": "JavaScript",
    "errorMessage": "TypeError: Cannot read property...",
    "triedMethods": "console.log로 확인해봤으나..."
  },
  "completed": false
}
```

---

## 6. 기술 스택 상세

| 영역 | 라이브러리 | 버전 | 용도 |
|---|---|---|---|
| CLI | commander | ^12.x | 명령어 파싱 |
| CLI | inquirer | ^9.x | 대화형 입력 |
| CLI | clipboardy | ^4.x | 클립보드 복사 |
| CLI | chalk | ^5.x | 터미널 색상 |
| Core | better-sqlite3 | ^11.x | SQLite 접근 |
| Core | handlebars | ^4.x | 템플릿 엔진 |
| Core | glob | ^10.x | 파일 패턴 매칭 |
| Core | uuid | ^9.x | 세션 ID 생성 |
| API | express | ^4.x | HTTP 서버 |
| API | cors | ^2.x | CORS 처리 |
| Web | react | ^18.x | UI 프레임워크 |
| Web | vite | ^5.x | 빌드 도구 |

---

## 7. 배포 구조

```
npm install -g promptcraft
    │
    ├── promptcraft scan [path]       # CLI 직접 사용
    ├── promptcraft build             # 대화형 프롬프트 빌드
    ├── promptcraft context [path]    # 컨텍스트 파일 생성
    ├── promptcraft history           # 히스토리 조회
    └── promptcraft serve             # 웹 UI 서버 시작 (localhost:3000)
```

- `~/.promptcraft/` 디렉토리에 DB, 설정, 커스텀 트리 저장
- `promptcraft serve` 실행 시 Express + 빌드된 React 정적 파일 서빙

---

## 8. 역할별 작업 범위

| 담당 | 작업 범위 | 의존성 |
|---|---|---|
| 분기 질의응답 + 프롬프트 조립 | `src/core/qna/`, `src/core/prompt/`, `data/trees/`, `data/templates/` | 없음 (독립 작업 가능) |
| 프로젝트 스캔 + 컨텍스트 생성 | `src/core/scanner/`, `src/core/context/` | 없음 (독립 작업 가능) |
| API + DB + CLI | `src/cli/`, `src/api/`, `src/core/db/`, `bin/` | Core 모듈 인터페이스 확정 후 |
| 웹 UI | `web/` | API 명세 확정 후 |
