---
title: "P2-10 로컬 LLM 적응형 후처리(AI 다듬기) 구현 완료 · 확장 재정의 · P1-4 의존 해소"
date: 2026-05-25
status: completed
scope:
  - "§7.2.2 A"
  - "§7.2.3"
  - "§7.2.4"
related:
  - "[[7.Roadmap]]"
  - "[[1.Overview]]"
  - "[[2026-05-25-p1-12-settings-ui-done]]"
tags:
  - prd
  - prd/2-5
  - adr
up: "[[DECISIONS]]"
---

# P2-10 로컬 LLM 적응형 후처리(AI 다듬기) 구현 완료 · 확장 재정의 · P1-4 의존 해소

## 배경

P2-10 원문은 "AI 다듬기 — Ollama 등 연동 후처리. 비용 제로 원칙 유지하며 품질 향상"으로 **프롬프트 후처리 다듬기**만 정의했다. 구현 과정에서 다음이 확정되었다.

- vibe_level(L1~L5, [[1.Overview#1.4|§1.4]])은 설계 철학이며 런타임 분류기로 코드에 부재했다. 레벨 신호 일부는 카드 구조에 매핑되나, occupancy/정규식만으로는 "내용의 질"을 판단할 수 없다(카드를 채워도 내용이 공허할 수 있음).
- 대상은 Ollama 한정이 아니라 **OpenAI-호환 엔드포인트**(LM Studio·vllm·Ollama `/v1`) 전반이며, 공식 `openai` SDK로 통신한다.

## 결정

1. **P2-10을 "다듬기 + 코칭/자동생성"으로 확장 재정의.** 입력 완성도·내용 질에 적응하는 단일 **사용자-트리거** 스테이지로 구현한다. 충분하면 다듬고, 부족하면 코칭/자동생성한다.
2. **[superseded by [[2026-05-25-refine-redefine-polish-tool]]]** **레벨 측정 2층 구조.** (a) core 순수 휴리스틱 `structuralScore`(occupancy + 구조 신호, LLM 무관·결정적)가 사전 게이트로 "LLM에 보낼 가치"를 판단한다. (b) LLM 기준표(`src/core/refine/vibe-rubric.json`, vibe_level 6축 × L1~L5)가 실제 내용의 질을 평가한다. occupancy만으로 질을 판단하는 우회는 채택하지 않는다([[feedback_no_llm_bypass]]의 정적 재포맷 vs 추론 합성 구분과 정합). _(2026-05-25 재정의: structural은 비차단 안내로 격하, vibe-rubric 제거 — 후속 ADR 참조.)_
3. **파인튜닝 배제.** 라벨 데이터 부재 + 구조화 카드 위 규칙 우위. 양자화 소형 instruct 모델 프롬프팅으로 충분. LoRA는 출시 후 accept/reject 피드백에서 기반 모델의 체계적 실패가 관측될 때만 v2 검토.
4. **OpenAI-호환 단일 프로토콜.** `openai` SDK + `baseURL` 오버라이드로 모든 호환 백엔드를 단일 클라이언트로 커버. 다중 provider 추상화 불필요. 신규 의존성 `openai`.
5. **core/server 레이어 분리로 KPI #6 유지.** LLM 호출은 server에만 존재하고 코어 생성 플로우(`/api/prompt/build`)와 분리된 사용자-트리거 라우트(`/api/prompt/refine`)다. **코어 플로우 LLM 호출 zero(KPI #6) 유지.** 모델 미설정 시 비활성 게이트(409 `no_model`). 비용 제로(로컬)·비파괴(원본 무손실, 복사 전용).
6. **[superseded by [[2026-05-25-refine-redefine-polish-tool]]]** **`vibe-rubric.json` ↔ `vibe_level.md` 정합 책임.** 기준표는 문서를 LLM 채점용으로 운영화한 것이며, **문서가 개념 SSOT**다. 향후 vibe_level 정의 변경 시 기준표를 함께 갱신한다. _(2026-05-25 재정의: refine과 vibe-rubric 운영화 연결 단절 — 후속 ADR 참조. vibe_level.md 개념 문서 자체는 유지.)_
7. **P1-4(Rationale 자동 삽입) 의존 해소.** 보류 사유였던 로컬 LLM 인프라가 본 과제로 확보되었다. P1-4는 §7.2.2 A에 active로 유지하며, 본 refine 인프라(`src/server/refine` + `openai` SDK) 위에서 후속 구현한다.

## 영향

- §7.2.3에서 P2-10 행 제거. P2-N 번호는 결번 유지. §7.2.4 매트릭스: P2 1건→0건, 총계 4건→3건.
- §7.2.2 A의 P1-4 행은 유지하되 비고에 의존 해소를 반영(본 ADR 참조).
- 신규 산출물: `src/core/refine/*`(순수 — structuralScore·rubric·prompts·parse·models·types), `src/server/refine/*`(I/O — openaiClient·availability·config·refineService), `src/server/routes/llm.ts`, `POST /api/prompt/{structural,refine}`, `GET /api/llm/status`, `src/web/components/RefineSheet/`, SettingsSheet "AI 다듬기" 섹션, ActionBar 트리거. config 키 `refine.{baseUrl,model,apiKey,threshold}`(DB).
- 설계·계획 문서: `docs/superpowers/specs/2026-05-25-p2-10-local-llm-refine-design.md`, `docs/superpowers/plans/2026-05-25-p2-10-local-llm-refine.md`.
- 검증: 전체 698 테스트 PASS. master 단일 squash 커밋 `408a942`.
