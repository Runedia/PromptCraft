---
title: "D2Coding 한글 monospace 셀프 호스팅 추가 (--font-code 한글 fallback)"
date: 2026-05-23
status: active
scope:
  - "§4.3.1"
  - "§5.4.1"
  - "src/web/public/fonts/d2coding"
  - "src/web/styles/design-system.css"
related: []
tags:
  - prd
  - prd/2-5
  - adr
up: "[[DECISIONS]]"
---

# 2026-05-23 — D2Coding 한글 monospace 셀프 호스팅 추가 (`--font-code` 한글 fallback)

**결정**: `--font-code` chain의 한글 글리프 fallback 부재로 mono caption에서 영문 Geist Mono + 한글 시스템 sans가 mix되던 문제를 해결. D2Coding 폰트(Regular 400 + Bold 700) TTF를 GitHub naver/d2codingfont release zip에서 추출하여 `src/web/public/fonts/d2coding/`에 직접 호스팅. `design-system.css` 상단의 `@font-face`로 정의하고 `unicode-range`(Hangul 범위)로 한글 글리프 한정 적용. `--font-code` chain은 `"Geist Mono", "D2Coding", "Cascadia Code", "JetBrains Mono", monospace`로 갱신.

**근거**:
1. **시각 정합성 문제**: 기존 `--font-code = "Geist Mono", "Cascadia Code", "JetBrains Mono", monospace`는 한글 글리프가 없어 브라우저가 한글 부분만 시스템 sans(Windows: 맑은 고딕, macOS: Apple SD Gothic Neo)로 fallback. 영문 `[ ]` + 한글이 섞인 토글 버튼(`[원본] [미리보기]`)에서 글자 폭·세로 정렬·획 두께가 불일치하여 mono caption 컨셉이 깨짐. PromptPreview body, 카드 라벨, mono caption 전반에 동일 문제.
2. **D2Coding 채택**: 한글 고정폭 mono 폰트의 사실상 표준. SIL OFL 1.1로 셀프 호스팅 정책과 정합. fontsource에는 D2Coding이 없어 GitHub raw 직접 호스팅 채택(weekly 50 downloads의 `@kfonts/d2coding`는 exports 비어 있어 호환성 불확실, weekly 624의 `@fontsource/nanum-gothic-coding`는 D2Coding과 시각 차이로 후보에서 제외).
3. **`unicode-range` 사용**: D2Coding을 chain 앞쪽에 두면 영문 글리프도 D2Coding으로 렌더되어 Geist Mono의 시각 컨셉이 손상됨. `unicode-range: U+AC00-D7AF, U+1100-11FF, U+3130-318F, U+A960-A97F, U+D7B0-D7FF`로 한글 글리프 한정 적용. 영문은 chain 앞의 Geist Mono로 처리되어 영문+한글 mix가 자연스러움.
4. **번들 크기**: TTF 2개 × ~4MB = 약 8MB. brotli/gzip 압축 시 절반 가량 감소. 한글 caption이 사용자 인지의 핵심이므로 수용 가능한 트레이드오프. 향후 한글 subset 도구(`pyftsubset` 등)로 추가 최적화 여지.
5. **woff2 미적용 사유**: 공식 release zip은 TTF/OTF만 배포. woff2 변환은 별도 빌드 파이프라인 의존성(`ttf2woff2` 등)을 추가하므로 최초 도입 단계에서는 TTF 직접 사용으로 단순성 유지. 모던 브라우저는 TTF font-face를 모두 지원하므로 동작 차이 없음.

**연쇄 정리**:
- 신규: `src/web/public/fonts/d2coding/D2Coding-Regular.ttf`(4.0MB), `D2Coding-Bold.ttf`(4.2MB). naver/d2codingfont VER1.3.2-20180524 zip에서 추출. zip 및 ligature/all/ttc 변형은 삭제.
- `src/web/styles/design-system.css`: 상단에 `@font-face` 2개 추가, `--font-code` chain에 `"D2Coding"` 삽입(`"Geist Mono"` 뒤).
- [[4.UI-Design|§4.3.1]] 폰트 표에 D2Coding 행 추가, 토큰 표의 `--font-code` 값 갱신, 로딩 방식 문단에 `public/fonts/d2coding/` 직접 호스팅 사실 명시.
- [[5.Architecture|§5.4.1]] 폰트 로딩 표·결정 문단을 `@fontsource/*` + D2Coding 직접 호스팅 병용으로 갱신.
- CSP `font-src 'self'` 정책과 정합 (D2Coding TTF도 동일 origin).
- 테스트: 시각 회귀는 E2E `preview-toggle.spec.ts`(한글 카드 라벨 렌더 검증)·`preview-latency.spec.ts`(반응속도 회귀 검증)로 갈음. 별도 폰트 로딩 단위 테스트는 추가하지 않음(브라우저 native @font-face 동작에 위임).
