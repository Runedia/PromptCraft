---
title: "시안 SSOT 폐기, 현재 구현 SSOT 채택"
date: 2026-05-22
status: active
scope:
  - "§4.UI-Design"
  - "§3.Features"
  - "§5.Architecture"
  - "§7.Roadmap"
related: []
tags:
  - prd
  - prd/2-5
  - adr
up: "[[DECISIONS]]"
---

# 2026-05-22 — 시안 SSOT 폐기, 현재 구현 SSOT 채택

**결정**: `PromptCraftDesigin/` 폴더(시안 HTML/JSX 자료)는 단순 참고였으며, **`src/web/`의 현재 구현이 디자인 시스템의 SSOT**다. 시안 폴더는 PRD 작성 완료 후 삭제 예정.

**근거**:
1. 시안은 현 디자인이 구현된 *이유*를 설명하는 참고자료였을 뿐, 향후 디자인 변경의 기준이 아니다.
2. 시안과 현재 구현의 격차(V1 vs V2 채택, --pc-* vs shadcn 표준 등)는 "결정된 사항"이며 비교 명세가 PRD에 들어갈 가치 없음.
3. PRD §4가 "시안 vs 구현 Delta" 톤이면 시안 폴더 삭제 후 무의미해진다.

**연쇄 정리**:
- §4 UI-Design 통째 재작성. "시안", "PromptCraftDesigin", "V1~V6 변형", "V2 채택", "시안 vs 구현 Delta" 등 비교 표현 모두 제거.
- §3 Features의 "V2 Three-Column 베이스" → "Three-Column" 명칭 단순화.
- §5 Architecture §5.4 토큰 네이밍 표에서 "시안 토큰 vs shadcn" 비교 제거. 현재 구현 명세 + 후속 보강 항목으로 재구성.
- §7 Roadmap의 P1-5~P1-15 디자인 과제에서 시안 출처·권고 인용 제거.

**보존 자료**: 시안에 대한 마지막 분석 기록을 `_drafts/design-{tokens,primitives,screens,interactions}.md` 4개에 보존. 시안 폴더 삭제 후에도 결정 사유 추적 가능.

> **후속 갱신**: `_drafts/` 폴더는 이후 통째 삭제되어(git log 보존) 본 ADR의 "보존 자료" 표기는 historical record로 둔다. 삭제 결정을 기록했던 ADR은 trail 정리 과정에서 제거되었다.
