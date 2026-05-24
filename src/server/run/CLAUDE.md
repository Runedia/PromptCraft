# src/server/run — Run as... 프로세스 실행 (I/O)

`Run as...`의 I/O 격리 레이어. 순수 데이터/로직은 `src/core/run/`.

- `launcher.ts` — `launch(target, cwd)`: DB config(`run.shell`/`run.shells`) 로드 → `core/run/shells.buildArgv` → `Bun.spawn`(새 창, fire-and-forget). `isInstalled`/`providerAvailability`(`Bun.which`), `isValidCwd`.
- `env.ts` — `resolveLaunchEnv()`: PowerShell `[Environment]` → JSON으로 최신 시스템+사용자 환경변수 수집(`Bun.spawnSync`, 동기), `core/run/env.mergeLaunchEnv`로 머지. 모든 실패는 `process.env` 폴백. `launch()`가 이 결과를 `Bun.spawn`의 `env`로 주입.

**제약:** `Bun.spawn`은 `file, args[]` 고정 배열 + shell 미경유. 프롬프트는 인자 주입 금지(클립보드 전용).
