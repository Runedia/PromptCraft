---
title: "§3.2.8 Run as... — 새 터미널에 최신 시스템 환경변수 주입(env refresh)"
date: 2026-05-24
status: active
scope:
  - "§3.2.8"
  - "src/server/run/launcher.ts"
  - "src/server/run/env.ts"
  - "src/core/run/env.ts"
related:
  - "[[2026-05-24-run-as-simplified]]"
tags:
  - prd
  - prd/2-5
  - adr
up: "[[DECISIONS]]"
---

# 2026-05-24 — §3.2.8 Run as... 새 터미널 환경변수 새로고침

**결정**: `launch()`가 `Bun.spawn` 시 `env`를 명시 주입한다. PowerShell `[Environment]::GetEnvironmentVariables('Machine'/'User')`로 레지스트리의 최신 환경변수를 읽고 각 값을 `ExpandEnvironmentVariables`로 확장한 뒤, `process.env` 위에 Machine→User 순으로 머지(PATH는 Machine;User 재결합)하여 새 터미널에 전달한다. 수집·머지 실패 시 `process.env`로 graceful 폴백한다.

**근거**:
1. **스냅샷 고정 문제**: `Bun.spawn`이 `env` 미지정 시 자식은 PromptCraft의 `process.env`(기동 시점 스냅샷)를 상속한다. 앱 장기 실행 중 OS 환경변수(PATH 등)가 변경돼도 새 터미널에 반영되지 않는다. 탐색기는 `WM_SETTINGCHANGE`로 갱신하지만 PromptCraft는 처리하지 않아 스냅샷에 고정된다.
2. **PowerShell 방식 채택**: 라이브러리(winreg/native-reg)·네이티브(Rust/Zig)·`bun:ffi` 경로를 비교 후 기각. `bun:ffi`는 Bun 1.3.14에서도 "experimental" + UTF-16 타입 부재, N-API 라이브러리는 Bun 버전 종속, 네이티브 모듈은 키 2개 1회 읽기에 과잉공학. PowerShell `[Environment]` → JSON은 의존성 0, Bun 버전 면역, 프로젝트 process-execution 규칙(`file,args[]`+shell 미경유) 부합.
3. **동기 실행**: `Bun.spawnSync`로 `launch()`/`/run` 핸들러 동기 시그니처 유지. run은 저빈도 fire-and-forget이라 PowerShell 콜드스타트 블로킹 무해.
4. **항상 적용 + 폴백**: config 토글은 설정 표면만 늘리고 비활성 동기가 불분명. PowerShell은 Win10/11 기본 내장이라 부재 가능성 ≈ 0이며, 모든 실패 경로가 기존 동작(부모 상속)으로 무해 퇴화한다.

**번호/범위**:
- `2026-05-24-run-as-simplified`(새 터미널+클립보드 단순화)의 후속 개선이며 번복 아님 — 해당 ADR은 `active` 유지.
- 신규 코드: `src/core/run/env.ts`(순수 머지), `src/server/run/env.ts`(PowerShell I/O). `src/core/run/shells.ts`는 argv 전용이라 미변경 — `env`는 `Bun.spawn` 레벨이라 빌트인 셸·config override 템플릿 모두에 자동 적용.
- 비목표: 앱 자체 `process.env` 갱신, `WM_SETTINGCHANGE` 수신, 레지스트리 삭제 변수 반영.
- [[3.Features|§3.2.8]] living spec에 "새 터미널은 최신 시스템 환경변수를 상속한다" 문장 추가.
