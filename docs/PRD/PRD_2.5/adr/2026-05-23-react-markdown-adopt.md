---
title: "§5.4.4 react-markdown 도입 결정 (미리보기 모드 전용 토글)"
date: 2026-05-23
status: active
scope:
  - "§5.4.4"
  - "§4.3.1"
  - "§4.3.2"
  - "§3"
  - "src/web/components/PromptPreview"
related: []
tags:
  - prd
  - prd/2-5
  - adr
up: "[[DECISIONS]]"
---

# 2026-05-23 — §5.4.4 `react-markdown` 도입 결정 (미리보기 모드 전용 토글)

**결정**: §5.4.4 "react-markdown 미사용" P1 결정 항목을 **도입**으로 확정. `PromptPreview` 헤더에 `[원문] / 미리보기` 토글 버튼 2개를 추가하고, 미리보기 모드에서만 `react-markdown` + `remark-gfm`으로 카드 본문을 prose 렌더한다. 원문 모드는 default이며 기존 carbon-mono raw text 렌더링을 그대로 유지한다. 토글 상태는 localStorage에 persist(zundo temporal 히스토리에는 포함하지 않음).

**근거**:
1. **원문 default로 carbon-mono 컨셉 보존**: [[4.UI-Design|§4 UI-Design]]의 PromptPreview는 "LLM이 받는 텍스트와 1:1 시각 매핑"이 핵심 가치. markdown 렌더가 default면 사용자가 보는 화면과 LLM 입력이 시각 분리되어 컨셉이 약화됨. 원문이 default + 미리보기는 옵션 모드로 두면 디버깅 신뢰성을 유지하면서 가독성을 옵션 제공 가능.
2. **카드 value 풀 markdown 렌더가 react-markdown 도입 의의를 명확화**: 사용자가 카드에 markdown 문법(목록·강조·코드블럭·GFM 표·체크박스)을 쓰는 시나리오에서 미리보기 모드가 그것을 실제 prose로 보여줘야 도입 의의가 있다. 헤더(`## label`)만 prose 처리하는 절충안은 `react-markdown` 의존성 정당화에 부족.
3. **CSS 자산 활용**: `design-system.css:155-187`의 `.prose-preview *` 스코프(font 11px, color tokens, link/list/table/code 스타일)는 이미 작성되어 있으나 `react-markdown` 미사용으로 dead asset 상태. 본 결정으로 활성화.
4. **GFM 활성**: `remark-gfm` plugin으로 표·체크박스·자동링크 지원. LLM 응답에도 흔히 등장하는 GitHub-flavored syntax이며 카드 입력 일관성을 위해 활성.
5. **localStorage persist 채택**: 새로고침 후에도 사용자 선호(원문 vs 미리보기) 유지. 일반 UX 패턴이며 zustand persist middleware로 간결 구현. zundo temporal 히스토리에는 포함하지 않음(§5.5.1 UI 상태 제외 원칙).

**연쇄 정리**:
- [[5.Architecture|§5.4.4]] 제목 `react-markdown 미사용` → `react-markdown 도입 (미리보기 모드 전용)`. 표·결정 문단을 도입 결정 내용으로 재서술. 우선순위 `P1` → `결정 완료`.
- [[4.UI-Design|§4.3.2]] PromptPreview 레이아웃 ASCII Header 행에 `[원문] / 미리보기` 토글 명세 추가. 상태 소스에 `useUIStore.previewMode` 추가.
- [[4.UI-Design|§4.3.1]] 타이포 표 라인 162 `PromptPreview.tsx:25`(좌측 "preview" 라벨) 참조는 토글로 대체되므로 갱신 필요(자세한 줄 번호는 구현 후 재계산).
- [[3.Features|§3]] 프리뷰 절에 "원문/미리보기 토글" 단락 1개 추가.
- `src/web/ui-ids.ts`에 `WORK_PREVIEW_TOGGLE_RAW`·`WORK_PREVIEW_TOGGLE_RENDERED` 2개 등록 후 `bun run ui-map:generate`.
- `package.json`에 `remark-gfm` 신규 추가.
- 신규 store `useUIStore` (또는 cardStore 외부의 별도 store). `previewMode: 'raw' | 'rendered'`. `persist` middleware로 `promptcraft-preview-mode` key에 저장.
- 테스트: 단위(토글 동작·localStorage 저장·GFM 체크박스 렌더)·E2E 회귀(`tests/e2e/preview-latency.spec.ts` 100ms threshold 유지).
