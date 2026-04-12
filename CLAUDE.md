## Context Routing

→ cli: src/cli/CLAUDE.md
→ core: src/core/CLAUDE.md
→ server: src/server/CLAUDE.md
→ shared: src/shared/CLAUDE.md
→ web: src/web/CLAUDE.md

## Agent Memory System

### Before Working
- Read this file for global context, then read the target directory's CLAUDE.md before changes
- If this file has a ## Context Routing section, use it to find the right subdirectory CLAUDE.md
- Check .memory/decisions.md before architectural changes
- Check .memory/patterns.md before implementing common functionality
- Check if audit is due: if 14+ days or 10+ sessions since last audit in .memory/audit-log.md, suggest running one

### During Work
- Create CLAUDE.md in any new directory you create

### After Work
- Update relevant CLAUDE.md if conventions changed
- Log decisions to .memory/decisions.md (ADR format)
- Log patterns to .memory/patterns.md
- Uncertain inferences → .memory/inbox.md (never canonical files)

### Safety
- Never record secrets, API keys, or user data
- Never overwrite decisions — mark as [superseded]
- Never promote from inbox without user confirmation

### Code Style
- Follow biome.json: single quotes, 2-space indent, LF, lineWidth 160, trailingCommas es5.