---
title: "언어 감지를 GitHub Linguist 공식 데이터 기반으로 전환 (14 → 21 언어)"
date: 2026-05-27
status: active
scope:
  - "§3.2.3"
  - "src/core/scanner"
  - "scripts"
  - "data/detection-rules"
  - "data/role-mappings.json"
related:
  - "[[2026-05-23-zig-scanner]]"
tags:
  - prd
  - prd/2-5
  - adr
up: "[[DECISIONS]]"
---

# 2026-05-27 — 언어 감지를 GitHub Linguist 공식 데이터 기반으로 전환 (14 → 21 언어)

**결정**: `src/core/scanner`의 언어 감지를 손으로 유지하던 `EXTENSION_MAP`에서 **GitHub Linguist 공식 `languages.yml` 파생 맵**으로 전환한다. 빌드 스크립트(`scripts/sync-linguist.ts`)가 공식 yml을 `Bun.YAML`로 파싱하고, 순수 변환 함수(`scripts/build-language-map.ts`)가 화이트리스트·충돌 우선순위·별칭 병합·복합 확장자 드롭·manual override를 적용해 `data/detection-rules/languages.json`(258개 확장자)을 생성한다. 런타임은 이 커밋된 JSON을 `detection-loader.getLanguageMap()`으로 로드하며 **런타임 의존성은 0**(fetch는 `bun run sync:linguist` 갱신 시에만). `languageRoles`는 14개 → 21개로 확장(Dart·Scala·Lua·R·Vue·Svelte·Astro 추가), `domain-classifier`의 언어 힌트에 Vue·Svelte·Astro → `web-frontend` 추가.

**근거**:
1. **누락 반복**: 손유지 `EXTENSION_MAP`에 `.vue`(Vue), `.kts`(Kotlin script), `.tsx`(Linguist는 별도 `TSX`), `.jsx`, `.h` 등이 빠져 있어 React/Vue 등 흔한 프로젝트의 주 언어가 집계에서 통째로 누락되었다(루트 실측에서 `.tsx` 42개 미집계 확인). 확장자 맵을 손으로 유지하는 것은 GitHub Linguist를 재발명하는 일이며 누락이 영구적으로 재발한다.
2. **공식 데이터 직접 사용**: GitHub Linguist는 사실상 표준이고 지속 갱신되지만 Ruby gem이라 bun/TS에서 직접 호출할 수 없다. 서드파티 미러 패키지(`linguist-languages`) 대신 공식 `languages.yml`을 빌드 스크립트로 직접 파싱하여 의존성 없이 공식 데이터를 쓴다. `Bun.YAML` 내장 파서로 외부 YAML 라이브러리도 불필요.
3. **화이트리스트 방식**: Linguist 804개 언어 전량은 esoteric 언어를 유입시키므로, 관심 언어(프로그래밍 언어 + Vue/Svelte/Astro markup + JSON/XML/YAML config)만 화이트리스트로 둔다. **신규 언어 지원 = 화이트리스트에 언어명 한 줄 추가**(확장자는 Linguist가 제공) → 누락을 구조적으로 차단한다.
4. **충돌·예외 처리**: 화이트리스트 내부 확장자 충돌 8건(`.h`→C, `.ts`/`.tsx`→TypeScript, `.rs`→Rust, `.inc`·`.fcgi` 등 모호 제외)은 우선순위 맵·제외 집합으로 해소한다. 복합 확장자(`.zig.zon`·`.cs.pp` 등)는 `path.extname`이 마지막 세그먼트만 반환해 매칭 불가하므로 드롭한다. `.zon`(Zig Object Notation, config)·`.jsp`(JSP, template)는 Linguist에 없거나 다르게 분류되어 manual override로 보존한다.
5. **결정론**: 생성된 `languages.json`을 커밋해 런타임 네트워크 의존을 제거한다. `src/core` 순수성·결정론 규칙에 부합.

**연쇄 정리**:
- `scripts/build-language-map.ts` 신규 — 파싱된 yaml → `{ext: {name, role}}` 순수 변환(화이트리스트·충돌·별칭·복합 드롭·override).
- `scripts/sync-linguist.ts` 신규 — 공식 yml fetch + 변환 + `languages.json` write. `package.json`에 `sync:linguist` 스크립트 추가.
- `data/detection-rules/languages.json`: 형식 `{ext: name}` → `{ext: {name, role}}`로 변경, 258개 확장자(복합 확장자 dead entry 제거 반영).
- `src/core/scanner/language.ts`: 하드코딩 `EXTENSION_MAP`·`KNOWN_EXTENSIONS`·`LANGUAGE_GLOB` 제거 → `detectLanguages` 내부에서 `getLanguageMap()`으로 동적 구성.
- `src/core/scanner/detection-loader.ts`: `getLanguageMap` 반환 타입을 `{name, role}` 맵으로 변경, 캐시 타입 명시(`LanguageMap`).
- `src/core/scanner/domain-classifier.ts`: `LANGUAGE_DOMAIN_HINTS`에 `Vue`·`Svelte`·`Astro` → `web-frontend` 추가.
- `data/role-mappings.json`: `languageRoles`에 Dart·Scala·Lua·R·Vue·Svelte·Astro 추가(14 → 21).
- `linguist-languages` 런타임 의존성 제거(빌드 스크립트가 공식 yml을 직접 fetch).
- [[3.Features|§3.2.3]] 매핑 테이블 `languageRoles` 카운트 `14개 언어` → `21개 언어` 갱신.
- 테스트: `tests/scripts/build-language-map.test.ts`(변환 함수), `tests/core/scanner/language-extensions.test.ts`(`.vue`/`.kts`/`.svelte`/신규 언어/도메인 힌트). scanner+scripts 전체 66 pass.

**관련**:
- [[2026-05-23-zig-scanner]]: 해당 결정은 `EXTENSION_MAP`에 `.zig`/`.zon`을 **수동 추가**하고 지원 언어를 13 → 14로 확장했다. 본 전환이 그 수동 방식을 대체한다 — Zig 지원 자체는 유지되나, 이제 `.zig`는 Linguist 화이트리스트(Zig)로, `.zon`은 manual override로 파생된다. Zig 빌드 캐시 ignore(`zig-cache` 등)는 별도 모듈(`gitignore.ts`)에 그대로 유지되며 본 전환과 무관하다.
- 동일 라운드 선행 작업: 테스트 fixtures 및 언어별 의존성/산출물 디렉토리를 스캔 집계에서 제외하는 ignore 정책 일원화(`gitignore.ts` 단일 소스화). 스캐너 노이즈 제거로 본 전환과 독립적이나 같은 라운드에서 처리됨.
