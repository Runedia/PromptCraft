# PromptCraft

로컬 설치형 코딩 프롬프트 빌더. Bun 1.3.x 런타임 (npm/node 아님).

## Commands

| Command | Description |
|---------|-------------|
| `bun install` | 의존성 설치 (`postinstall`이 `ui-map:generate` 자동 실행) |
| `bun run dev` | 개발 서버 (server + web 동시) |
| `bun run build` | 프로덕션 빌드 (tsc + vite) |
| `bun test --parallel` | 단위/통합 테스트 |
| `bunx playwright test` | e2e 테스트 (`bun test`로 돌리면 안 됨 — e2e spec까지 수집함) |
| `bun run verify` | typecheck + lint + format:check (커밋 전 게이트) |

> `format:check`는 이름과 달리 `biome check . --write` — 읽기 전용이 아님. 부분/서브에이전트 작업 시 전역 실행 주의.

## Architecture

```
src/
  cli/     # Commander.js 진입점 — serve만. 로직은 server로 위임
  server/  # Express ^5 API (127.0.0.1 전용). web ↔ core 연결
  core/    # 순수 로직 (스캔/카드/빌드). LLM·프레임워크 의존 0
  web/     # React 19 + Vite 6 + Tailwind v4 + shadcn/ui
  shared/  # 레이어 비종속 타입·유틸·i18n
```

의존 방향: cli → server → core. web → core(타입 참조). shared ← 전 레이어.

## Context Routing

→ cli: src/cli/CLAUDE.md
→ core: src/core/CLAUDE.md
→ server: src/server/CLAUDE.md
→ shared: src/shared/CLAUDE.md
→ web: src/web/CLAUDE.md
→ prd: docs/PRD/PRD_2.5/CLAUDE.md

### During Work

- Create CLAUDE.md in any new directory you create

### Safety

- Never record secrets, API keys, or user data
- Never overwrite decisions — mark as [superseded]

### PRD 의사결정 (사용자 auto-memory 제외)

- PRD 관련 의사결정·완료·정정 기록은 사용자 auto-memory(`~/.claude/projects/.../memory/`)에 저장하지 않는다.
- PRD 결정의 SSOT는 `docs/PRD/PRD_2.5/`의 ADR 시스템(`adr/` + `DECISIONS.base`)이며, 진입점은 `docs/PRD/PRD_2.5/CLAUDE.md`를 참고한다.

### Code Style

- Follow biome.json: single quotes, 2-space indent, LF, lineWidth 160, trailingCommas es5.
