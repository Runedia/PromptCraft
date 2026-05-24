---
title: "P1-14 Mention :line-range UI hint 구현 완료"
date: 2026-05-24
status: completed
scope:
  - "§7.2.2"
  - "src/web/components/inputs/MentionInput.tsx"
  - "src/web/ui-ids.ts"
related: []
tags:
  - prd
  - prd/2-5
  - adr
up: "[[DECISIONS]]"
---

# 2026-05-24 — P1-14 Mention `:line-range` UI hint 구현 완료

**결정**: §7.2.2 §C의 P1-14 "Mention `:line-range` UI hint" 과제를 완료. `MentionInput.tsx` 자동완성 popover 하단에 단축키 캡션 영역(`data-ui-id="WORK_MENTION_HINTS"`)을 신설하여 `↑↓ 이동` · `Enter 전체` · `Shift+Enter :line-range 지원` · `Esc 닫기` 4개 단축키를 항상 노출한다. popover가 열릴 때 (suggestions ≥ 1) 항상 표시되며 preview 유무와 무관하게 보인다.

**근거**:
1. **동작-단서 격차 해소**: Shift+Enter 라인 범위 분기는 `MentionInput.tsx:178-183`(`insertMentionWithLineRange` 호출 경로)에 이미 구현되어 있었으나 키 hint·캡션이 어디에도 없어 일반 사용자는 발견 불가. 파일 preview 영역의 "라인 범위 지정" 버튼은 발견 보조 수단이지만 (a) preview는 selectedIdx로 선택된 파일이 있을 때만 노출, (b) 키보드 단축키는 별도로 학습해야 함. 본 결정으로 popover 진입 즉시 단축키 4종이 시각화되어 동작-단서 격차 0으로 회복.
2. **":line-range" 리터럴 명시 사유**: PRD §7.2.2 §C가 캡션 어휘로 정확히 `:line-range 지원`을 지목. 사용자가 `@path#L10-20` 표기법을 인지하기 전에라도 ":line-range"라는 별도 호칭으로 기능 존재를 식별할 수 있게 함. 실제 입력 표기(`#L<num>`)와 호칭(`:line-range`)의 분리는 PRD가 의도한 노출 정책으로 본 결정에서 그대로 채택.
3. **popover 내 footer 배치 선택 사유**: 대안 후보는 (a) textarea 아래 상시 캡션, (b) placeholder hint 확장, (c) popover footer. (a)는 카드 입력 영역의 시각 밀도를 상시 가중시키며 mention 미사용 카드(`multiline` 등)의 컨텍스트와 무관. (b)는 placeholder가 입력 시작 후 사라져 가장 hint가 필요한 시점에 무효. (c)는 popover가 mention 컨텍스트에서만 열리고 닫힐 때 함께 사라져 노출 컨텍스트가 정확히 일치. font-code + muted-foreground 색조로 본문 노이즈 최소화.
4. **kbd 시각 강조 채택**: 단축키 토큰(`↑↓`/`Enter`/`Shift+Enter`/`Esc`)은 `<kbd className="font-code text-foreground">`로 본문 muted-foreground 대비 한 단계 진한 색상을 적용. 별도 background/border는 추가하지 않고 색상 대비만으로 hierarchy 형성(border·shadow 추가 시 popover 시각 무게가 과중).
5. **신규 UI ID 등록**: `WORK_MENTION_HINTS`를 `ui-ids.ts`의 MentionInput 섹션으로 신설하여 E2E 단축키 hint 회귀 검증 경로 확보. `docs/ui-map.md`는 자동 재생성(53 → 54개 항목).

**연쇄 정리**:
- `src/web/components/inputs/MentionInput.tsx`: suggestions popover 마지막 child로 단축키 footer `<div>` 신설. `border-t border-border` + `px-3 py-1.5` + `text-xs text-muted-foreground font-code` 조합으로 design-system 토큰 내에서 처리(별도 CSS 신규 0건, [[5.Architecture|§5.3]] Tailwind v4 정책 준수).
- `src/web/ui-ids.ts`: `WORK_MENTION_HINTS` 신규 등록(MentionInput 섹션 신설). `bun run ui-map:generate` 실행하여 `docs/ui-map.md` 자동 재생성.
- [[7.Roadmap|§7.2.2]] §C 표에서 P1-14 행 제거(P1-N 번호는 결번 그대로 유지, [[DECISIONS#본 문서의 작성 정책]] 2번 항).
- [[7.Roadmap|§7.2.4]] 우선순위 매트릭스 P1-C 행 `4건` → `3건`, 총계 `11건` → `10건`.
- 타입 체크 통과(`bunx tsc --noEmit` exit 0). 동작 회귀는 기존 `MentionInput` 행위(자동완성/preview/Shift+Enter 분기) 미변경으로 단위 테스트 추가 없이 회귀 위험 없음.
