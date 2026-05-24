---
title: "§3.2.8 Run as... — fire-and-forget 파이프라인 보류, 새 터미널+클립보드로 단순화"
date: 2026-05-24
status: active
scope:
  - "§2.2"
  - "§3.2.8"
  - "§3.2.10"
  - "§5.1"
  - "§5.5.2"
  - "§5.5.3"
  - "§5.5.4"
  - "§4.5.4"
related:
  - "[[2026-05-22-feat-staged-commits-removed]]"
tags:
  - prd
  - prd/2-5
  - adr
up: "[[DECISIONS]]"
---

# 2026-05-24 — §3.2.8 Run as... fire-and-forget 보류, 새 터미널+클립보드 단순화

**결정**: §3.2.8 본문이 기술한 완전한 fire-and-forget 파이프라인(`runId` 발급, `.promptcraft/runs/<runId>.prompt.md` 기록, `--file` 플래그로 프롬프트 주입, `Bun.spawn(..., detached)` + stdout/stderr `.log` 파이프, `GET /api/runs/:runId/log` 로그 조회)을 **보류**한다. 대신 cwd에서 새 터미널 창으로 provider CLI를 실행하고 프롬프트를 클립보드에 복사하는 범위로 한정 구현한다.

**근거**:
1. **하네스 인터페이스 불확실성**: claude-code·gemini·copilot·codex 등 외부 CLI가 프롬프트 파일 직접 실행(`--file`)을 지원하는지 확정되지 않았고, 하네스 업데이트에 따라 인터페이스가 바뀔 위험이 있다. 특정 실행 인자에 결합하면 유지보수 부채가 된다.
2. **인터랙티브 터미널은 출력 캡처 불가**: 새 콘솔 창이 stdio를 직접 소유하므로 `.log` 파이프·`runId`·로그 조회 API는 의미가 없다. 따라서 해당 산출물 전부 드롭.
3. **공격면 축소**: 프롬프트를 인자로 주입하지 않고 클립보드로만 전달하여 명령 인자 주입면을 제거. provider 화이트리스트 + `Bun.spawn(file, args[])` 셸 미경유로 전역 프로세스 실행 규칙을 준수.
4. **셸 확장성**: 셸(cmd/powershell/pwsh)을 DB config `run.shell`/`run.shells`(템플릿)로 추가·변경 가능하게 설계하여, 하네스/환경 변화에 코드 변경 없이 대응한다.

**번호/범위**:
- §3.2.8은 단순화 버전으로 living spec 재작성(본 ADR이 보류 trail 보존).
- §3.2.10 표: `/api/prompt/run` 상태 정정, `/api/prompt/providers` 신설, `/api/runs/:runId/log` 보류 표기.
- 보류된 파이프라인은 하네스의 프롬프트 직접 실행 지원이 확인되면 후속 사이클에서 재검토.
- (2026-05-24 후속 정합화) §2.2 김개발 시나리오·§5.5.2 데이터 흐름 도식·§5.5.3 호출 타이밍·§5.5.4 영속화 표·§4.5.4 Run dropdown 흐름이 보류된 fire-and-forget 모델(`/api/prompts/build`·`/api/run`·`runId`·`.prompt.md`·`.log`·`runs.sqlite`)을 잔존시키고 있었음을 전수조사에서 발견하여 단순화 모델(`POST /api/prompt/run` `{target,cwd}`→`{ok,launched}`, 클립보드 전용)로 정정. 본 ADR scope에 §2.2·§5.5.2·§5.5.3·§5.5.4·§4.5.4를 추가하여 적용 범위를 확정한다. 추가로 §5.1 계층 도식·표가 Run as를 "`src/cli`가 Provider CLI spawn(detach)"로 기술하던 것을 코드 사실(launch 주체 = `src/server/run/launcher`, 새 터미널 실행, detach 잔재 제거)에 맞게 정정하고 scope에 §5.1을 추가한다 — `src/cli`는 `promptcraft serve` 진입점으로 명확화.
