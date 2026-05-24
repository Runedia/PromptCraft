---
title: "추천 역할 알고리즘 재배치 (base prepend) + scan API roleSuggestionsByTree dict 추가"
date: 2026-05-24
status: active
scope:
  - "§3.2.3"
  - "src/core/builder/role-resolver.ts"
  - "src/server/domain-loader.ts"
  - "src/server/routes/scan.ts"
  - "src/web/components/TreeSelect/TreeSelect.tsx"
related:
  - "[[2026-05-24-trees-rolesuffix]]"
tags:
  - prd
  - prd/2-5
  - adr
up: "[[DECISIONS]]"
---

# 2026-05-24 — 추천 역할 알고리즘 재배치 (base prepend) + scan API roleSuggestionsByTree dict 추가

**결정**: `resolveRoleSuggestions`의 출력 순서를 재배치하여 **`domainRoles[domain].default` 상위 2개를 모든 트리에서 base로 항상 prepend**한다. `/api/scan` 응답에 `roleSuggestionsByTree: Record<treeId, string[]>` dict를 신규 추가하여 5개 트리 각각의 5개 역할을 사전 계산해 반환한다. 메인 화면 `TreeSelect`는 `selectedTreeId` 변경 시 dict 조회로 추천 역할을 갱신한다. 결과: 메인 화면 추천 역할이 워크스페이스 `role` 카드 옵션과 1:1 일치, 트리 전환 시 1~2번 슬롯(base)은 그대로 유지되고 4~5번만 차별화되어 "비슷한 느낌"을 유지한다.

**근거**:
1. **이전 알고리즘의 두 결함**:
   - (a) 메인 화면은 `treeId='default'`로 호출되어 `domainMap.default` 위주, 워크스페이스는 실제 `treeId`로 호출되어 `domainMap[treeId]` 위주. dedupe 후 두 집합이 거의 안 겹쳐서 사용자가 "메인 ↔ 워크스페이스 역할이 다르다"고 인지.
   - (b) 트리×도메인 역할 어휘가 트리 그룹별로 비대칭. 예 systems 도메인 — `error-solving`은 "시스템 디버깅 전문가/성능 최적화 엔지니어", `code-review`는 "**시니어 시스템 엔지니어/메모리 안전성 전문가/테크 리드**". 공통 호칭이 일부 트리에만 등장하여 트리 전환 시 어휘가 급변.
2. **base prepend가 두 문제를 동시에 해결**: `domainMap.default`는 이미 "도메인 기본 역할 3개"로 정의되어 base 의도와 일치. 알고리즘에서 default 상위 2개를 가장 앞쪽에 prepend하면 (i) 모든 트리(default 포함)에서 동일 base 노출 → 메인 ↔ 워크스페이스 일치, (ii) 트리 전환 시 슬롯 1~2는 불변 → "비슷한 느낌". 데이터 재설계 0건, 알고리즘만 변경.
3. **scan 응답 dict 채택 이유**: 5트리 × 5역할 ≈ 600~800 bytes로 페이로드 비용 미미. 트리 선택 시 클라이언트 round-trip 추가 없음. 로컬 서버라 latency 무관하지만 코드 단순성에서 유리. 기존 `roleSuggestions`(default fallback)는 보존하여 backward compat. 별도 endpoint나 클라이언트 재구현은 role-resolver 로직 중복 위험.
4. **framework 정제 역할 1개로 축소**: 이전 알고리즘은 상위 2개 framework 모두 노출했으나 base 2개 + framework 2개 + tree-spec ≥ 5개로 5 슬롯 초과. 도메인 통일성을 우선하여 framework는 1개 슬롯만. 추가 framework는 워크스페이스 전체 옵션 리스트에 dedupe 후 잔존.
5. **roleSuffix 미적용 트리도 일관성 유지**: error-solving·feature-impl·concept-learn은 `roleSuffix` 필드 없음. base prepend 정책 덕에 이들 트리도 슬롯 1~2가 base로 채워져 roleSuffix 보유 트리(code-review·refactoring)와의 시각 격차가 자연스럽게 줄어듦.

**연쇄 정리**:
- `src/core/builder/role-resolver.ts`: 출력 순서 재배치 — tree×조합(roleSuffix 있을 때) → base 상위 2 → framework 1 → tree-spec → default 잔여 → language fallback → general fallback. `slice` 호출자 결정으로 변경.
- `src/server/domain-loader.ts`: `loadTreesMeta()`·`TreeMeta` 신규 추가 (`data/trees/*.json`에서 id·roleSuffix만 캐시 로딩). `clearDomainLoaderCache()`에 treesMeta 캐시 초기화 포함.
- `src/server/routes/scan.ts`: 응답에 `roleSuggestionsByTree` dict 추가. `loadTreesMeta()` 호출하여 각 트리 메타로 `resolveRoleSuggestions` 반복 호출(5개 트리 × 5개 역할).
- `src/web/components/TreeSelect/TreeSelect.tsx`: 상태 `suggestedRoles` → `defaultRoles` + `rolesByTree` 분리. `selectedTreeId` 변경 시 `useMemo`로 dict 조회, 없으면 `defaultRoles` fallback.
- [[3.Features|§3.2.3]] 역할 후보 파이프라인 ASCII와 설명 문단을 새 알고리즘으로 재서술. `roleSuggestionsByTree` dict 운영 정책 명시.
- 테스트: `tests/core/builder/role-resolver.test.ts` 13 케이스 전면 재작성 (base prepend·메인-워크스페이스 일치·트리간 base 공통·default treeId 분기). `tests/core/builder/cardSession.test.ts` 1 케이스 어휘 수정 (framework 정제 1개로 축소 반영). `tests/server/routes/scan.test.ts` 신규 케이스 (roleSuggestionsByTree dict 존재 + 트리간 base 공통 + roleSuffix 트리 1번 슬롯 검증).
