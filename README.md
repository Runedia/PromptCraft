# PromptCraft

로컬 설치형 코딩 프롬프트 빌더 — AI 코딩 도구에 더 완전하고 구조화된 질문을 자동으로 작성해줍니다.

## 요구사항

- Node.js 24+
- pnpm 10.30.3

## 설치

```bash
# pnpm이 없으면 먼저 설치: npm install -g pnpm
git clone <repo-url>
cd promptcraft
pnpm install
```

## 사용법

```bash
# 프로젝트 스캔
promptcraft scan [path]

# 프롬프트 빌드 (인터랙티브 Q&A)
promptcraft build

# 컨텍스트 파일 생성 (CLAUDE.md, GEMINI.md)
promptcraft context [path]

# 히스토리 조회
promptcraft history

# Web UI 시작 (localhost:3000)
promptcraft serve
```

## 개발

```bash
# 개발 모드 (nodemon)
pnpm dev

# 테스트 실행
pnpm test

# 커버리지
pnpm test:coverage
```

## 프로젝트 구조

```
promptcraft/
├── bin/                   # CLI 진입점
├── src/
│   ├── core/              # 순수 비즈니스 로직
│   │   ├── scanner/       # 프로젝트 디렉토리 분석
│   │   ├── qna/           # 분기 Q&A 엔진
│   │   ├── prompt/        # 프롬프트 빌더
│   │   ├── context/       # 컨텍스트 파일 생성기
│   │   └── db/            # SQLite 데이터 계층
│   ├── cli/               # CLI 레이어
│   ├── api/               # Express REST API
│   └── shared/            # 공통 유틸리티
├── data/
│   ├── trees/             # Q&A 분기 트리 JSON
│   └── templates/         # Handlebars 템플릿
├── web/                   # React Web UI
└── tasks/                 # 개발 계획
```

## 데이터 저장 위치

- DB, 설정: `~/.promptcraft/`
- Web UI: `http://localhost:3000`
