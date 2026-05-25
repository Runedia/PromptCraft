---
title: "refine 재정의: 프롬프트 채점기 → 다듬기 도구 (P2-10 결정 #2·#6 supersede)"
date: 2026-05-25
status: completed
scope:
  - "§1.4"
related:
  - "[[2026-05-25-p2-10-local-llm-refine-done]]"
  - "[[7.Roadmap]]"
  - "[[1.Overview]]"
tags:
  - prd
  - prd/2-5
  - adr
up: "[[DECISIONS]]"
---

# refine 재정의: 프롬프트 채점기 → 다듬기 도구

## 배경

P2-10([[2026-05-25-p2-10-local-llm-refine-done]])로 구현된 "AI 다듬기"를 실사용 검증한 결과, 세 증상이 확인되었다.

1. **정상 스펙에도 "데이터 부족" 오판.** 기능구현 기본 4카드(`role`/`goal`/`stack-environment`/`impl-scope`)는 `structuralScore`가 `4×12 = 48`점에 고정된다. `UPPER_CARDS`(constraints/acceptance-criteria/review-focus/output-format) 미충전 + 파일경로·번호리스트 부재 시 보너스가 0이기 때문이다. 기본 threshold 50 → `48 < 50` → 내용 품질과 무관하게 항상 "부족" 판정(false negative).
2. **에러 혼동.** `/api/prompt/refine`이 네트워크 도달 실패와 모델 응답 파싱 실패를 동일한 503 메시지로 보고해 원인 구분이 불가능했다.
3. **개념 정체성 불일치(근본 원인).** 기능은 "다듬기 도구"로 노출되나 내부는 "프롬프트 엔지니어링 성숙도 채점기"였다. 6축 vibe 루브릭(DECOMP/VERIFY/ORCH/FAIL/CTX/META × L1~L5)은 *대화형 프롬프팅 행동/세션* 평가용인데 *정적 카드 아티팩트* 하나에 적용되어 매핑 대상 없는 축에서 환각 점수를 냈다. 또한 스키마가 강제한 `dimensions` 배열은 UI에 표시되지 않는 죽은 출력이면서, 소형 로컬 모델의 JSON 생성을 깨뜨려 파싱 실패(→ 오표기된 "연결 실패")를 유발했다.

## 결정

1. **refine을 "다듬기 도구"로 재정의.** 입력(조립된 피처 스펙) → 출력(코딩 에이전트용으로 재작성된 프롬프트 + 보강 제안). 채점·등급 폐기. 출력은 최소 스키마 `{refined, suggestions, rationale}`.

2. **[supersedes [[2026-05-25-p2-10-local-llm-refine-done]] 결정 #2]** "structural 사전 게이트 + vibe-rubric 2층 측정"을 폐기한다. `structuralScore`는 산식을 보존하되 **차단 게이트가 아니라 비차단 안내**(belowThreshold → soft note)로 격하한다. 6축 루브릭(`src/core/refine/vibe-rubric.json`, `rubric.ts`)은 제거한다.

3. **[supersedes [[2026-05-25-p2-10-local-llm-refine-done]] 결정 #6]** `vibe-rubric.json` ↔ `vibe_level.md`([[1.Overview#1.4|§1.4]]) 운영화 연결을 끊는다. `vibe_level.md` 개념 문서 자체의 존속·정의는 본 ADR 범위 밖이며 변경하지 않는다.

4. **에러 분리.** `/refine`은 모델 미설정 `409 no_model`, 모델 응답 파싱 실패 `422 refine_parse_failed`, 네트워크/도달 불가 `503 refine_unreachable`로 구분 응답한다.

5. **신뢰성·UX.** 서버는 `response_format: { type: 'json_object' }` + `max_tokens: 4096`으로 호출(LM Studio/Ollama/vllm 공통 지원 모드)해 소형 모델 파싱 실패율을 낮춘다. web은 `GET /api/llm/status`의 `available`로 사전 게이트해 도달 불가 시 클릭 전 경고하고, 모드 분기(coach/polish) 없는 단일 "AI 다듬기" 버튼으로 단순화한다.

## 영향

- [[feedback_no_llm_bypass]] 정합성 유지: 정적 재포맷이 아닌 LLM 추론 재작성을 유지하므로 "우회 축소구현"에 해당하지 않는다. occupancy 게이트 폐기는 품질 판단을 LLM에 일임하는 방향이며, 휴리스틱은 보조 안내로만 남는다(결정 #2 재정의의 정당화).
- 로드맵 번호 변경 없음(P2-10은 이미 §7.2.3에서 행 제거·결번 처리됨). 본 ADR은 완료된 P2-10의 구현 설계를 재정의하는 것이며 신규 P-번호를 발급하지 않는다.
- 코드 변경: `src/core/refine/`에서 `rubric.ts`·`vibe-rubric.json` 삭제, `types.ts`(RefineAssessment 최소화·vibe 타입 제거)·`prompts.ts`(루브릭·mode 제거)·`parse.ts`(최소 스키마) 수정. `src/server/refine/openaiClient.ts`(JSON mode·max_tokens)·`refineService.ts`(mode 제거)·`routes/prompt.ts`(에러 분기) 수정. `src/web/components/RefineSheet/RefineSheet.tsx` 재구성. i18n `core.refine`·`web.refine` 재작성.
- 설계·계획 문서: `docs/superpowers/specs/2026-05-25-refine-redefine-polish-tool-design.md`, `docs/superpowers/plans/2026-05-25-refine-redefine-polish-tool.md`.
- 검증: 전체 696 테스트 PASS, typecheck 클린.
