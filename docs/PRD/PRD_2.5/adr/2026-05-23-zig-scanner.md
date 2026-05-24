---
title: "Zig 언어/에코시스템 스캐너 추가 (13 → 14)"
date: 2026-05-23
status: active
scope:
  - "§3.2.3"
  - "§5"
  - "src/core/scanner"
  - "data/detection-rules"
related: []
tags:
  - prd
  - prd/2-5
  - adr
up: "[[DECISIONS]]"
---

# 2026-05-23 — Zig 언어/에코시스템 스캐너 추가 (13 → 14)

**결정**: `src/core/scanner`의 언어/프레임워크 감지에 Zig를 추가. `.zig`(primary), `.zon`(config) 확장자 매핑, `build.zig.zon` manifest 기반 의존성 파서, Zig 도메인 fallback 'systems', zigwin32/mach/raylib 등 주요 zig 라이브러리 9종을 frameworks 매핑에 등록. 기본 ignore에 zig 빌드 캐시(`zig-cache`, `.zig-cache`, `zig-out`, `zig-pkg`) 추가. 지원 언어 13개 → 14개, 지원 에코시스템 13개 → 14개로 확장.

**근거**:
1. **누락 보고**: 사용자가 `E:\Project\wgpum`(Zig 1.x 데스크탑 GPU 모니터링 앱)에서 스캐너가 Zig를 인식하지 못함을 보고. 검증 결과 (a) `language.ts` EXTENSION_MAP에 `.zig`/`.zon` 없음, (b) `frameworks.json`에 zig ecosystem 없음, (c) `domain-classifier.ts` LANGUAGE_DOMAIN_HINTS에 Zig 없음, (d) zig 빌드 캐시(`zig-pkg`에 zigwin32 4000+ 파일)가 기본 ignore에 없어 사용자가 .gitignore를 작성한 경우에만 제외되는 상태였음.
2. **`build.zig.zon` 의존성 파서**: `dsl-regex` 파서 재사용 — Swift SPM의 `.package(url: ...)`와 유사한 URL 추출 패턴(`\.url\s*=\s*"([^"]+)"`)으로 의존성 URL 추출 후 frameworks 매핑(예: `marlersoft/zigwin32`)을 URL substring으로 매칭. 신규 parser 추가 없이 처리.
3. **frameworks 매핑 9종**: zig 생태계는 Rust/Node 대비 작아 핵심만 등재. 각 도메인 1~2개 — desktop(zigwin32), game(mach·raylib·raylib-zig·SDL-zig), web-backend(zig-network·http.zig), cli(zig-clap), general(zig-cookbook). 추후 확장 가능.
4. **Zig 도메인 fallback**: deps 없는 단순 zig 프로젝트는 LANGUAGE_DOMAIN_HINTS의 `Zig → systems`로 분류. Rust/C/C++와 동일한 카테고리. wgpum 실측에서는 zigwin32 deps가 desktop 도메인으로 high confidence 분류됨.
5. **기본 ignore 확장**: 사용자가 .gitignore를 작성하지 않은 zig 프로젝트에서도 `zig-pkg/`(deps cache)·`.zig-cache/`·`zig-out/` 제외 보장. 기본 ignore에 `zig-cache`(legacy 명칭)도 함께 포함하여 구버전 호환.

**연쇄 정리**:
- `src/core/scanner/language.ts`: EXTENSION_MAP에 `.zig`(primary, Zig), `.zon`(config, Zig Object Notation) 추가.
- `src/core/scanner/gitignore.ts`: DEFAULT_IGNORE_DIRS에 `.zig-cache`, `zig-cache`, `zig-out`, `zig-pkg` 추가.
- `src/core/scanner/domain-classifier.ts`: LANGUAGE_DOMAIN_HINTS에 `Zig: 'systems'` 추가.
- `data/detection-rules/languages.json`: `.zig`, `.zon` 매핑 추가(데이터 정합성, 현재 미사용 자산이지만 동기 유지).
- `data/detection-rules/frameworks.json`: `zig` ecosystem 신규(dsl-regex parser, build.zig.zon manifest, 9개 framework 매핑).
- `data/role-mappings.json`: languageRoles에 `Zig → "Zig 시스템 프로그래머"` 추가.
- [[3.Features|§3.2.3]] `languageRoles` 카운트 `13개 언어` → `14개 언어`.
- [[5.Architecture|§5]] `src/core` 행 + 파일 스캔 엔진 행 `13개 에코시스템` → `14개 에코시스템` 2건 갱신.
- 테스트: `tests/fixtures/scanner/zig-app/`(build.zig + build.zig.zon + src/*.zig 2개) 및 `zig-bare/`(zon 없음) fixture 신규. `tests/core/scanner/zig.test.ts` 6 케이스 — 언어 감지, framework 감지, framework 부재 시 domain fallback 검증.
- 검증: wgpum 실측 — Zig 12 files primary, zigwin32 detected, domain `desktop` high confidence. zig-pkg(.gitignore 매칭)는 정상 제외.
