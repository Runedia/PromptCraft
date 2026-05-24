---
title: "§7.2.2 P1-11 History UI 완료 — 향후 과제 표에서 제거, 결번 유지"
date: 2026-05-24
status: completed
scope:
  - "§7.2.2"
  - "§7.2.4"
  - "§4.6"
related:
  - "[[2026-05-24-remove-template-feature]]"
  - "[[2026-05-24-run-as-simplified]]"
tags:
  - prd
  - prd/2-5
  - adr
up: "[[DECISIONS]]"
---

# 2026-05-24 — §7.2.2 P1-11 History UI 완료

**결정**: P1-11(History UI)은 커밋 `4d1ea9b`(feat(history): 프롬프트 히스토리 자동 저장 및 조회 UI)로 **구현 완료**되었다. [[7.Roadmap|§7.2.2]] P1-C 표에서 P1-11 행을 제거하고(번호는 결번 유지), [[7.Roadmap|§7.2.4]] 매트릭스 건수를 조정하며, [[4.UI-Design|§4.6]] 후속 개선 영역의 History UI 항목을 완료로 정정한다.

**근거**:
1. **코드 실측**: `src/web/components/HistorySheet/HistorySheet.tsx`가 구현되어 `ActionBar.tsx`·`WorkspacePage.tsx`에서 소비되고 `ui-ids.ts`에 등록됨. 서버 `src/server/routes/history.ts`는 `POST /`·`GET /`·`GET /:id`·`DELETE /:id` 4개 핸들러를 모두 등록(자동 저장·목록 조회·단건 복원·삭제). [[3.Features|§3.2.10]] API 표가 이미 "`/api/history` ✅ HistorySheet (자동 저장·조회·복원·삭제)"로 반영함.
2. **선행 trail 일치**: [[2026-05-24-remove-template-feature|템플릿 제거 ADR]]가 "P1-11에서 구현한 History 기능(커밋 `4d1ea9b`)이 과거 프롬프트 복원을 이미 제공한다"를 템플릿 제거 근거로 전제했다. 즉 P1-11 완료는 이미 다른 결정의 전제로 사용되었으나 §7 향후 과제 표가 갱신되지 않아 모순 상태였다.
3. **보류 엔드포인트 정리**: 구 P1-11 설명은 소비 대상으로 `/api/runs/:runId/log`와 `/api/history`를 함께 명시했으나, `/api/runs/:runId/log`는 [[2026-05-24-run-as-simplified]]로 **보류**되었다. 완료된 History UI는 `/api/history`만 소비한다.

**번호/범위**:
- P1-11 번호는 번호화 정책에 따라 결번 그대로 유지(재번호 금지).
- 본 완료 처리로 P1-C 활성 과제는 P1-12·P1-15 2건으로 감소.

**연쇄 정리**:
- [[7.Roadmap|§7.2.2]] P1-C 표에서 P1-11 행 제거. 표 아래에 "P1-11(History UI)은 커밋 `4d1ea9b`로 완료되어 제거. P1-N 결번 유지([[DECISIONS]] 참조)" 1문장 추가.
- [[7.Roadmap|§7.2.4]] 우선순위 매트릭스 P1-C 행 `3건` → `2건`, 총계 `9건` → `8건`(P1-16 추가 반영 후 기준).
- [[4.UI-Design|§4.6]] 후속 개선 표의 History UI(#2) 행을 완료로 정정 — 현재 상태 "✅ 완료(커밋 `4d1ea9b`)", 후속 작업 비움. `/api/runs/:runId/log` 소비 문구는 보류 엔드포인트이므로 `/api/history`로 정정.
