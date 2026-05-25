---
title: "§5.2.3 NFR 측정 도구 구현 (반응속도·스캔·빌드·Graceful Shutdown)"
date: 2026-05-23
status: completed
scope:
  - "§5.2.3"
  - "tests/perf"
  - "tests/e2e"
  - "src/server/index.ts"
related: []
tags:
  - prd
  - prd/2-5
  - adr
up: "[[DECISIONS]]"
---

# 2026-05-23 — §5.2.3 NFR 측정 도구 구현 (반응속도·스캔·빌드·Graceful Shutdown)

**결정**: PRD §5.2.3 "측정 조건 TBD" 4개 항목에 대해 자동 측정 러너를 구현하고, npm script로 등재한다. 측정 결과는 `tests/perf-results/<benchmark>.json`에 history append 방식으로 누적하며, **임계값 초과 시 경고 출력만 하고 exit는 차단하지 않는다**(기존 `tests/scan-benchmark-runner.ts`와 동일한 정책).

| 항목 | 측정 도구 | 임계값 | 측정 방식 |
|---|---|---|---|
| 반응속도(카드 → DOM) | `tests/e2e/preview-latency.spec.ts` (Playwright + Chromium) | 중앙값 < 100ms | test-only store 주입(`window.__promptcraftTest`)으로 25개 카드 활성 워크스페이스를 직접 진입, `MutationObserver`로 `WORK_PREVIEW_CONTENT` 갱신 시점 포착, `performance.now()` 차이 30회 측정 |
| 스캔 성능 | `tests/perf/api-scan-benchmark.ts` (supertest) | 중앙값 < 5000ms | 200+ 파일 fixture를 매 iteration마다 새로 생성하여 콜드 스타트 5회 측정, `POST /api/scan` 응답 시간 |
| 빌드 성능 | `tests/perf/api-build-benchmark.ts` (supertest) | 중앙값 < 5000ms | `card-definitions.json` 27개 중 25개를 활성 상태(예제 값 채움)로 구성, `POST /api/prompt/build` 응답 시간 10회 측정 |
| Graceful Shutdown | `tests/perf/graceful-shutdown-check.ts` (`child_process.spawn`) | 최대 < 10000ms, exit code 0 | 서버를 자식 프로세스로 띄우고 SIGINT/SIGTERM 발송 후 종료 시간·exit code 측정 |

**근거**:

1. **§6.9.2와의 경계**: [[6.Evaluation#6.9.2 후속 평가|§6.9.2]]는 "토큰·latency 측정 인프라 미구축, 외부 도구 위임"으로 결정했다. 그러나 이는 LLM 응답의 토큰·latency 평가 자동화에 한정된 결정이며, NFR(반응속도/스캔/빌드/Shutdown)은 PromptCraft 자체 코드의 성능 약속이므로 별개의 측정 대상이다. PRD §5.2.3 각주("실측 측정이 수행되지 않았으며 ... 별도 벤치마크 도구를 통한 측정이 필요할 경우 위 측정 조건을 기준으로 한다")가 본 결정의 직접 근거이다.
2. **Playwright 채택 사유**: PRD §5.2.3 측정 조건의 "Chrome 130+" 명시와 정합 — 실제 Chromium 환경에서 React 리렌더 + DOM 갱신 시간을 측정한다. `happy-dom`/`jsdom` 단위 측정은 layout/paint 단계가 누락되어 본 NFR을 충실히 반영하지 못한다.
3. **결과 누적 정책**: `tests/scan-benchmark-runner.ts`의 기존 패턴(history append + 임계값 위반 시 경고)을 따르며, CI 차단은 채택하지 않는다. 이유는 (a) 환경 노이즈(예: GitHub Actions의 가변 자원)로 인한 false positive 위험, (b) 본 NFR은 사용자 경험 약속이지 강제 게이트가 아니며 회귀 감지는 history 그래프로 충분.
4. **Graceful Shutdown — Windows 한계**: Node.js `child_process.kill(pid, 'SIGINT'/'SIGTERM')`은 Windows에서 OS의 `TerminateProcess`와 동등하게 동작하여 자식 프로세스의 graceful 핸들러를 우회한다. 본 측정 러너는 `process.platform === 'win32'`일 때 측정을 명시적으로 skip하고 `pass: true`(NFR 미달이 아닌 측정 불가)로 표기한다. Linux/macOS 환경(CI 또는 평가 머신)에서 실측을 권장한다.
5. **25개 카드 시나리오**: 단일 트리 정의(예: `feature-impl` 13개)로는 PRD 명시 25개 활성 상태를 재현할 수 없어, E2E 측정에서는 임의로 `active: true`로 구성한 세션을 test-only store 주입 hook으로 워크스페이스에 직접 주입한다. 실제 운영 시나리오에서 25개를 동시 활성화하는 경우는 드물지만, 본 측정은 NFR의 stress 한계를 검증하는 목적이다. (진입 방식 변경: [[2026-05-25-feat28-session-restore-removed]] — localStorage seed 제거에 따라 test-only store 주입으로 전환.)

**연쇄 변경**:
- `package.json` scripts에 `benchmark:api-scan` / `benchmark:api-build` / `benchmark:shutdown` / `benchmark:preview` / `benchmark:nfr` 5개 추가.
- `@playwright/test ^1.60.0` devDependency 추가, Chromium 1223 다운로드.
- `playwright.config.ts` 신규(127.0.0.1:4173, headless, viewport 1440×900).
- `tests/perf/` 디렉터리에 4개 러너 + 공용 `perf-reporter.ts`. `tests/e2e/` 디렉터리에 spec + seed 헬퍼.
- [[5.Architecture#5.2.3 성능|§5.2.3]] "측정 조건" 열에 측정 도구 파일명 추가, 각주("실측 측정이 수행되지 않았다")를 측정 구현 사실로 갱신.

**부수 수정** (측정 작업 중 발견된 기존 버그):
- 빌드 산출물(`dist/src/server/index.js`)에서 `WEB_DIST = path.join(__dirname, '../../dist/web')`가 `dist/dist/web`을 가리켜 production 빌드 후 `GET /` 시 정적 자산 ENOENT 500이 발생하는 버그를 동일 세션에서 수정. `src/server/index.ts:19-22`에 `isBuiltLayout` 분기를 추가하여 빌드 산출물(`<root>/dist/src/server`)과 개발 소스(`<root>/src/server`) 모두 `<root>/dist/web`을 가리키도록 정정. 검증: `PORT=4188 bun dist/bin/promptcraft.mjs serve --port 4188 --no-open` 실행 시 `GET /` 200 응답 확인. Playwright `webServer`는 빌드 시간 절약 목적으로 여전히 `bun src/server/index.ts`(소스 모드 + 빌드된 `dist/web` 정적 자산)를 사용.

**핵심 KPI 실측치 (2026-05-23 Windows 11 / Bun 1.3.14 / Chromium 148)**:

| 측정 | count | median | p95 | threshold | 판정 |
|---|---|---|---|---|---|
| 반응속도 | 30 | 3.9ms | 4.6ms | <100ms | PASS |
| 스캔 성능(250 파일) | 5 | 11.18ms | 89.4ms | <5000ms | PASS |
| 빌드 성능(25 카드) | 10 | 3.23ms | 18.71ms | <5000ms | PASS |
| Graceful Shutdown | — | — | — | — | SKIP (win32) |

PRD §5.2.3 임계값 대비 2~3 자릿수 여유. 회귀 감시는 `tests/perf-results/*.json` 히스토리로 수행한다.
