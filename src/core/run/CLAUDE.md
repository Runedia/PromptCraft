# src/core/run — Run as... 순수 데이터/로직

`Run as...` 기능의 프레임워크 비종속·I/O 없는 순수 부분.

- `providers.ts` — provider 레지스트리(claude-code/gemini/copilot/codex). 프론트(`@core/run/providers.js`)·백엔드 공용.
- `env.ts` — `mergeLaunchEnv()`: launch용 환경변수 순수 머지(base 위에 Machine→User 덮어쓰기, PATH는 Machine;User 재결합). I/O 없음.
- `shells.ts` — 빌트인 셸 프로파일(cmd/powershell/pwsh) + `buildArgv()`. config 오버라이드 템플릿(`{cwd}`/`{launch}`) 정규화.

**규칙:** 실제 프로세스 spawn·`Bun.which` 등 I/O는 여기 두지 않는다 → `src/server/run/launcher.ts`.
