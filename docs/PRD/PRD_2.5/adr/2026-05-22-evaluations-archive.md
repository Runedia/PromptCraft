---
title: "평가 자료 영구 보존 (zip 아카이브)"
date: 2026-05-22
status: active
scope:
  - "docs/evaluations"
related: []
tags:
  - prd
  - prd/2-5
  - adr
up: "[[DECISIONS]]"
---

# 2026-05-22 — 평가 자료 영구 보존 (zip 아카이브)

**결정**: 1차/2차 평가의 입력·응답·결과를 `docs/evaluations/scenarios-1-code-review.zip` (63KB) + `scenarios-2-refactoring.zip` (147KB)로 보존.

**근거**:
1. 평가의 정량 baseline은 PRD §6의 근거이므로 영구 보존 필요.
2. `시나리오2/project/` 폴더(13개 obscura 워크스페이스 clone본)는 V8 빌드 포함으로 매우 크고(수~수십 GB), 평가 결과는 평가보고서.md와 평가결과/ 폴더에 모두 기록됨. **재현 시 원본 저장소(`E:\Project\temp\`)에서 재 clone 가능**하므로 zip에서 제외.
3. 평가 baseline 커밋(`1950048`)과 결과별 브랜치 패턴(`test001~006`, `gem001~006`, `pi001~006`, `test003_2`)은 `docs/evaluations/README.md`에 명문화하여 후속 재현 절차 보장.
