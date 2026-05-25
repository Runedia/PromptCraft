---
title: "Feature #28 (세션 복구 — localStorage 자동 저장 + 복원 다이얼로그) 제거"
date: 2026-05-25
status: active
scope:
  - "§3.1.2 #28"
  - "§3.2.10 단축키(Esc)"
  - "§4.3.x 복원 다이얼로그"
  - "§4 컴포넌트 인벤토리(dialog.tsx)"
  - "§5.2.3 세션 복구"
  - "§5.2.4 자동 저장"
related:
  - "[[2026-05-24-p1-11-history-done]]"
  - "[[2026-05-24-remove-template-feature]]"
  - "[[2026-05-23-nfr-measure-tools]]"
  - "[[3.Features]]"
  - "[[4.UI-Design]]"
  - "[[5.Architecture]]"
tags:
  - prd
  - prd/2-5
  - adr
up: "[[DECISIONS]]"
---

# 2026-05-25 — Feature #28 (세션 복구 — localStorage 자동 저장 + 복원 다이얼로그) 제거

**결정**: Feature #28 "세션 복구"를 PRD에서 제거한다. 구성 요소인 (a) `localStorage` 세션 자동 저장(`useCardSession` debounce 1초), (b) 재진입 시 복원 다이얼로그(`WORK_RESTORE_DIALOG`)를 런타임에서 전면 삭제한다. 완료·복사된 작업의 보존은 History(Feature #25, [[2026-05-24-p1-11-history-done|P1-11]])가 단독으로 담당한다. #28 번호는 번호화 정책에 따라 결번으로 유지한다.

**근거**:

1. **완료 작업에 대한 순수 노이즈 + History와의 중복**: `ActionBar.tsx`의 `copy()`/`run()`은 성공 시 `saveHistory()`(`POST /api/history`)를 호출하나 `clearSavedSession()`은 호출하지 않는다. 따라서 작업을 완료·복사해 History에 영구 보존한 뒤에도 `localStorage` 세션이 잔존하여, 같은 트리 재진입 시 "이미 끝낸 작업"을 복원할지 다시 묻는다. History가 완료 프롬프트의 보존·조회·복원을 이미 제공하므로(자동 저장·조회·복원·삭제, `/api/history` 4핸들러), 복원 다이얼로그는 완료 작업에 대해 가치를 더하지 않는 반복 차단 모달이다. 이는 [[2026-05-24-remove-template-feature|템플릿 제거 ADR]]이 "History가 과거 프롬프트 복원을 이미 제공한다"를 근거로 삼은 것과 동일 논리의 연장이다.

2. **보호 대상의 가치 부재**: 복원 세션이 유일하게 정당화되는 시나리오는 *미복사·미완료* 작업의 우발적 소실(탭 종료·새로고침·크래시) 복구다(이 경우 History에는 아무것도 남지 않는다). 그러나 이 복구 가치는 "없음"으로 평가했다. 작성 중 보존되지 않은 입력의 소실은 일반 웹 폼과 동일한 수용 가능한 동작이며, 이를 위해 전 진입에 차단 모달을 유지하는 비용이 정당화되지 않는다.

3. **트리거의 부정확성**: 표시 조건(`WorkspacePage.tsx`의 `savedPathMatches`)은 `projectPath` 단일 비교다. 특히 `saved.projectPath === undefined`(저장 시점에 `scanResult.path`가 없던 세션)이면 **어떤 경로로 진입하든 무조건 매치**되어, 관계없는 컨텍스트에까지 복원 프롬프트가 출현한다. lang·scan·셸 등 다른 환경 정보는 트리거 조건이 아니므로, "환경이 달라지면 계속 뜬다"는 체감의 실제 원인은 이 `undefined` 무조건 매치 구멍이다.

**대안(부분 존치/격하) 미채택 사유**: (a) copy/run 시 `clearSavedSession` 추가로 완료 작업만 억제하는 안, (b) 차단 모달을 비차단 토스트/배너로 격하하는 안을 검토했으나 채택하지 않았다. 두 안 모두 미완료 작업 복구라는 잔여 가치를 전제하는데, 근거 2에 따라 그 가치 자체가 없다고 평가했으므로 메커니즘을 보존할 이유가 없다. 코드·테스트·문서의 영속 표면을 남기지 않고 전면 제거한다.

**연쇄 정리**:

- **런타임 제거**: `useCardSession.ts`의 세션 영속 계층 전부(`SESSION_KEY_PREFIX`·`SESSION_TTL_MS`·`SavedSession`·자동저장 `useEffect`·`getSavedSession`·`clearSavedSession`·`restoreSession`) → 잔존 export `{ initSession, reresolveCardsForLang }`. `WorkspacePage.tsx`의 복원 state·핸들러·다이얼로그 JSX 및 마운트 effect의 saved 분기(항상 `initSession` + 경로 scan으로 단순화). `ui-ids.ts`의 `WORK_RESTORE_DIALOG`(+ `@region Restore`) — `WORK_HISTORY_RESTORE_BTN`은 History 기능이므로 유지. `components/ui/dialog.tsx`는 유일 소비처 소멸로 삭제. `bun run ui-map:generate` 재생성.
- **i18n**: `web.workspacePage.restore{Title,Desc,Yes,No}` 4키(`ko.json`·`en.json`).
- **PRD 본문**: [[3.Features|§3.1.2]] #28 행 제거(번호 결번 유지, 결번 사유 1문장). [[3.Features|§3.2.10]] 단축키 표 Esc 행 및 후속 설명에서 복원 다이얼로그 언급 제거. [[4.UI-Design]] 복원 다이얼로그 단락·dialog.tsx 인벤토리 행·Esc 단축키 표 항목 제거. [[5.Architecture|§5.2.3]] "세션 복구" 행·[[5.Architecture|§5.2.4]] "자동 저장" 행 제거. 저장소/지연 표에서 "세션 상태 localStorage 저장"·"카드 편집 → localStorage 저장(1000ms)" 항목 정정(카드 컬렉션 persist가 별도로 존재하지 않으면 함께 제거).
- **테스트 진입 방식 전환**: e2e 4종(`settings`·`preview-toggle`·`i18n`·`preview-latency`)은 그간 `buildSeedSession` → `localStorage` 주입 → 복원 다이얼로그 "이어서 하기" 통과로 카드 채워진 워크스페이스에 진입했다. 복원 제거로 이 통로가 사라지므로, dev/E2E 가드(`import.meta.env.DEV || VITE_E2E`) 하에서만 노출되는 test-only store 주입 훅(`window.__promptcraftTest.setSession`)을 신설하고 `seed-session.ts` fixture를 그 통로로 주입한다. 프로덕션 번들에는 가드로 트리쉐이크되어 노출되지 않는다.
- **[[2026-05-23-nfr-measure-tools]] 갱신**: 해당 ADR이 측정 방법론으로 명시한 "localStorage seed로 25개 카드 활성 워크스페이스 직접 진입"(§24·§35) 기술을 "test-only store 주입으로 25개 카드 활성 워크스페이스 직접 진입"으로 갱신한다. 측정의 본질(25개 활성, `MutationObserver`로 `WORK_PREVIEW_CONTENT` 갱신 포착, `performance.now()` 30회, 중앙값 < 100ms)은 불변이며 진입·주입 수단만 바뀐다. [[5.Architecture|§5.2.3]] 반응속도 측정 조건 문장은 진입 수단을 명시하지 않으므로 변경 없다.
- **번호 결번**: Feature #28은 결번 유지(재번호 금지). 본 ADR이 취소 trail의 SSOT다.
- **dead link 검토**: 본 제거로 사라지는 PRD 본문 내 복원 다이얼로그 직접 cross-ref는 위 정정으로 모두 제거된다. ADR 내 #28/복원 참조는 historical record이며 결번 정책으로 #28 번호가 유지되므로 dead link가 되지 않는다 — 그대로 보존한다.
