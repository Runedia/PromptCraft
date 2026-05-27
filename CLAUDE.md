## Context Routing

→ cli: src/cli/CLAUDE.md
→ core: src/core/CLAUDE.md
→ server: src/server/CLAUDE.md
→ shared: src/shared/CLAUDE.md
→ web: src/web/CLAUDE.md
→ prd: docs/PRD/PRD_2.5/CLAUDE.md

## 프로젝트 탐색 규칙

코드의 **위치·심볼·관계가 불확실할 때** codegraph MCP를 사용한다 (Grep/Glob보다 우선).

- 어디 있는지 모를 때 → codegraph_search / codegraph_context
- 호출관계·변경 영향범위를 알아야 할 때 → codegraph_callers / codegraph_callees / codegraph_impact
- 첫 사용 전 ToolSearch로 codegraph 스키마를 로드한다.

다음은 codegraph를 쓰지 않는다.

- 정확한 파일 경로를 앎 → Read
- 정확한 문자열·패턴 검색 → Grep
- codegraph 인덱스 미준비(codegraph_status로 확인) → Grep/Read 폴백

인덱스는 파일 쓰기보다 ~1초 지연된다. 방금 편집한 파일은 다음 턴에 조회한다.

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
