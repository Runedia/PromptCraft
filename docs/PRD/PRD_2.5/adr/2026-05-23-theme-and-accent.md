---
title: "P1-7 시스템 테마 자동 감지 활성 + P1-8 다크 accent alpha 0.12 → 0.18"
date: 2026-05-23
status: completed
scope:
  - "§7.2.2"
  - "§4.6"
  - "§5.4.3"
  - "src/web/components/ThemeProvider.tsx"
  - "src/web/styles/design-system.css"
related: []
tags:
  - prd
  - prd/2-5
  - adr
up: "[[DECISIONS]]"
---

# 2026-05-23 — P1-7 시스템 테마 자동 감지 활성 + P1-8 다크 accent alpha 0.12 → 0.18

**결정**: §7.2.2 B 디자인 시스템 P1 2건을 일괄 적용·완료.

1. **P1-7 — `prefers-color-scheme` 자동 감지 활성**: `ThemeProvider.tsx`의 props를 `defaultTheme="light"` + `enableSystem={false}` → `defaultTheme="system"` + `enableSystem`(true)로 변경. 첫 진입 시 OS preference를 따르며, 사용자가 `ThemeToggle`을 누르면 명시 선택이 localStorage(next-themes 기본 키 `theme`)에 저장되어 시스템 변경과 무관하게 유지된다. `ThemeToggle`은 `resolvedTheme` 기반이라 system 매핑 결과를 그대로 인식하므로 추가 변경 없이 호환된다.
2. **P1-8 — 다크 accent bg 알파 상향**: `design-system.css`의 다크 모드 `--accent` 값 `rgba(251, 146, 60, 0.12)` → `rgba(251, 146, 60, 0.18)`. amber #fb923c on bg #0a0a0a 조합에서 0.12는 hover/selected 상태가 시각적으로 거의 인지되지 않았다. 0.18로 50% 가량 상향하여 active accent의 가시성을 확보하되, primary color #fb923c(투명도 1.0) 단독 사용 구간과의 시각 위계는 유지한다.

**근거**:
1. **P1-7**: `next-themes`의 system 모드는 다크/라이트 OS 사용자 모두 첫 진입 경험을 자연스럽게 만든다. 이전의 `defaultTheme="light"`는 다크 OS 사용자에게 의도치 않은 라이트 모드 깜빡임을 발생시켰다. `ThemeToggle.tsx:9-13`의 `mounted` 가드(SSR 비대응 환경에서 hydration mismatch 방지)는 그대로 유지되므로 안전.
2. **P1-8**: §4 UI-Design line 597의 후속 작업 메모("의도적으로 살짝 진하게 설정됨")가 사실은 의도와 반대로 *너무* 옅었다. 0.18은 shadcn 다크 accent 표준(0.15~0.2) 범위이며 디자인 토큰의 다른 alpha 값(`--shadow-drag: 0 8px 24px rgba(0,0,0,0.12)`)과 충돌하지 않는다.

**연쇄 정리**:
- [[7.Roadmap|§7.2.2]] B 디자인 시스템 표에서 P1-7·P1-8 행 삭제 (P1-6 1건만 잔존). P1-N 번호는 결번 그대로 유지(번호화 정책).
- [[7.Roadmap|§7.2.4]] 우선순위 매트릭스 P1-B 행 `3건` → `1건`, 총계 `13건` → `11건`.
- [[5.Architecture|§5.4.3]] 테마 시스템 표의 "시스템 연동" 행 갱신: `enableSystem={false}` (수동 토글만) | **P2**(자동 감지 옵션 추가 검토) → `enableSystem` + `defaultTheme="system"` (OS 감지 후 첫 토글로 수동 override) | 유지.
- [[4.UI-Design|§4 UI-Design]] 본문 line 38·100·362 갱신 (ThemeProvider 설정 문자열, 다크 accent 값 0.18).
- [[4.UI-Design|§4.6]] 후속 개선 표에서 기존 1·2 행(prefers-color-scheme, accent alpha) 제거 후 나머지 7행 재번호화(3→1 ... 9→7). 표 자체 번호는 재번호화 정책 적용(외부 cross-ref가 historical record이므로 보존). 본 ADR이 재번호화 사실을 명시.
- 코드: `src/web/components/ThemeProvider.tsx` props 변경, `src/web/styles/design-system.css` 다크 `--accent` 값 변경.
- 테스트: theme 전환은 next-themes 라이브러리 자체 검증으로 위임. 시각 회귀는 `preview-latency`·`preview-toggle` E2E의 다크/라이트 양 모드 무관 회귀 검증으로 갈음.
