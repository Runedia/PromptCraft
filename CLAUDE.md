## Context Routing

→ cli: src/cli/CLAUDE.md
→ core: src/core/CLAUDE.md
→ server: src/server/CLAUDE.md
→ shared: src/shared/CLAUDE.md
→ web: src/web/CLAUDE.md
→ prd: docs/PRD/PRD_2.5/CLAUDE.md

## 프로젝트 탐색 규칙

- 코드 탐색 시 codegraph MCP 사용이 가능할 경우 가능한 codegraph mcp를 사용한다.
- 더 빠르고 정확한 탐색이 가능하다.
- 세션이 시작되었을 때 코드 기준으로만 탐색이 가능하다.

### During Work

- Create CLAUDE.md in any new directory you create

### Safety

- Never record secrets, API keys, or user data
- Never overwrite decisions — mark as [superseded]
- Never promote from inbox without user confirmation

### PRD 의사결정 (사용자 auto-memory 제외)

- PRD 관련 의사결정·완료·정정 기록은 사용자 auto-memory(`~/.claude/projects/.../memory/`)에 저장하지 않는다.
- PRD 결정의 SSOT는 `docs/PRD/PRD_2.5/`의 ADR 시스템(`adr/` + `DECISIONS.base`)이며, 진입점은 `docs/PRD/PRD_2.5/CLAUDE.md`를 참고한다.

### Code Style

- Follow biome.json: single quotes, 2-space indent, LF, lineWidth 160, trailingCommas es5.
