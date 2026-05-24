---
title: "§7.5 \"본 절의 한계 및 결정 필요 항목\" 통째 폐기"
date: 2026-05-23
status: active
scope:
  - "§7.5"
related:
  - "[[2026-05-22-token-meter-removed]]"
  - "[[2026-05-23-p0-1-cancel]]"
  - "[[2026-05-23-followups-4-cleanup]]"
tags:
  - prd
  - prd/2-5
  - adr
up: "[[DECISIONS]]"
---

# 2026-05-23 — §7.5 "본 절의 한계 및 결정 필요 항목" 통째 폐기

**결정**: §7.5 섹션(헤딩 + 결정 필요 표 3행 + baseline 원칙 마무리 문단) 통째 삭제. §7은 §7.1~§7.4의 4개 섹션으로 마무리.

**근거**:
1. **"토큰 측정 인프라 구현 방식" 행은 DECISIONS와 정면 모순.** [[2026-05-22-token-meter-removed]]에서 이미 "PromptCraft 자체 계측 안 함, 외부 도구(`getagentseal/codeburn` 등) 위임"으로 결정. §7.5의 "Provider API 헤더 파싱 vs PromptCraft 자체 계측 vs 양자 병행" 결정 유보 표기는 stale.
2. **"KPI #16 응답-구현 정합성 측정 비용" 행은 P1-2 설계 시 자연 결정될 사항.** 별도 메타 섹션에 명시할 가치 약함.
3. **"P2-4 L1 시나리오 재정의 vs 폐기" 행은 P2-4 수행 또는 PRD 2.6 단계에서 결정.** 메타 명시 불필요.
4. **마무리 baseline 원칙 문단**(KPI 갱신 약속, P2-1 3회 반복 평가 후 KPI 재조정)은 §7 전체 운영 정책으로서 가치 있으나, §7.5 통째 폐기 의도에 따라 함께 삭제. KPI 재조정 약속은 P2-1 수행 시 자연히 트리거되므로 별도 명시 없이도 작동.

**연쇄 정리**:
- [[7.Roadmap|§7.5]] 섹션 통째 제거. 앞 `---` 구분자도 함께 제거하여 §7.4 → 문서 끝으로 자연 흐름.
- 이전 ADR의 §7.5 cross-ref는 dead link로 남음. 본 문서 line 39([[2026-05-23-p0-1-cancel]]의 연쇄 정리), line 92([[2026-05-23-followups-4-cleanup]]의 4번 항목 Dual-Pane 연쇄 정리) 두 곳. **historical record로 보존**(메모리 규칙 1) — 이전 ADR 본문은 수정하지 않음. 본 ADR이 명시적으로 dead link 발생 사실을 기록.
