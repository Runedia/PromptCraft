---
title: "누락 3개 트리에 roleSuffix 추가 (5트리 전체 ${Framework} ${roleSuffix} 조합 역할 일관 적용)"
date: 2026-05-24
status: active
scope:
  - "§3.2.3"
  - "data/trees"
related:
  - "[[2026-05-24-role-resolver-base-prepend]]"
tags:
  - prd
  - prd/2-5
  - adr
up: "[[DECISIONS]]"
---

# 2026-05-24 — 누락 3개 트리에 `roleSuffix` 추가 (5트리 전체 `${Framework} ${roleSuffix}` 조합 역할 일관 적용)

**결정**: `error-solving`·`feature-impl`·`concept-learn` 트리에 `roleSuffix` 필드를 추가하여 5개 트리 모두 `${Framework} ${roleSuffix}`·`${Language} ${roleSuffix}` 조합 역할이 1~2번 슬롯에 prepend되도록 한다. 어휘는 `code-review`·`refactoring`의 "전문가" 패턴과 일관:

| 트리 | roleSuffix |
|---|---|
| error-solving | 디버깅 전문가 |
| feature-impl | 기능 구현 전문가 |
| code-review | 코드 리뷰 전문가 (기존) |
| refactoring | 리팩토링 전문가 (기존) |
| concept-learn | 기술 멘토 (학습 맥락에 자연스러운 어휘) |

**근거**:
1. **PRD 2.3 §3.2.6 정책 누락 복원**: PRD 2.3 line 294의 "프레임워크 기반 역할 제안 칩 최대 5개 표시 (예: React 감지 → 'React 개발자', '프론트엔드 개발자')"는 모든 트리에 적용되어야 할 정책이지만, `roleSuffix` 필드가 `code-review`·`refactoring`에만 정의되어 있어 다른 3개 트리에서는 `${Framework} ${tree-action}` 조합 역할(예: error-solving에서 "React 디버깅 전문가")이 1번 슬롯에 생성되지 않았다. 본 결정으로 5트리 전체에 일관 적용.
2. **2026-05-24 base prepend 결정과 시너지**: 직전 ADR로 슬롯 1~2가 base 역할로 채워지도록 변경했으나, `roleSuffix`가 있으면 트리×조합 역할이 슬롯 1~2를 차지하고 base는 슬롯 3~4로 밀린다. 이 차이가 trees마다 발생하면 메인 화면에서 트리 전환 시 위쪽 슬롯이 급변하여 "비슷한 느낌" 효과를 해친다. 본 결정으로 5트리 모두 슬롯 1~2가 트리×조합 역할(어휘는 트리별 specialization, 형식은 통일)로 채워져 시각 안정성 확보.
3. **"전문가" 통일 + concept-learn만 "멘토" 예외**: 학습 맥락에서 "전문가"보다 "멘토"가 자연스러운 어휘. 4개 트리는 동일 패턴, 1개 트리만 의도된 일탈로 의미 우선. 사용자 확인 완료.
4. **데이터 수정 3 파일로 완료**: 알고리즘·서버·클라이언트 변경 0건. `data/trees/*.json`의 3개 파일에 1행씩 추가하는 최소 변경. `resolveRoleSuggestions` 알고리즘은 이미 `roleSuffix` 인자를 처리하므로 데이터만 보강하면 즉시 동작.

**연쇄 정리**:
- `data/trees/error-solving.json`: `"roleSuffix": "디버깅 전문가"` 추가.
- `data/trees/feature-impl.json`: `"roleSuffix": "기능 구현 전문가"` 추가.
- `data/trees/concept-learn.json`: `"roleSuffix": "기술 멘토"` 추가.
- 테스트: `tests/core/builder/role-resolver.trees.test.ts` 신규 4 케이스 — 5트리 roleSuffix 존재 검증, 1번 슬롯 `${Framework} ${roleSuffix}` 검증, 2번 슬롯 `${Language} ${roleSuffix}` 검증, 어휘 통일 검증.
- 별도 알고리즘·서버 변경 없음. `domain-loader.ts`의 `loadTreesMeta()`는 모듈 캐시 사용하므로 서버 재시작 후 새 `roleSuffix` 반영. 테스트는 직접 trees JSON 읽음.
