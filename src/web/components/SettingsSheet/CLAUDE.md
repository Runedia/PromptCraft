# SettingsSheet — 설정 Sheet

## 책임
- 우측 슬라이드 Sheet(shadcn `Sheet`, side=right)로 설정 노출
- 섹션 "모양": 테마 3지 선택(시스템/라이트/다크) — next-themes `setTheme`에 위임. localStorage 영속, `/api/config` 무관. TopBar `ThemeToggle`과 상태 공유(자동 동기)
- 섹션 "실행": 기본 셸 3지 선택(cmd/powershell/pwsh) — `run.shell` 키
  - open 시 `GET /api/config` → `run.shell` 현재값 로드(없으면 'cmd')
  - 변경 시 낙관적 갱신 + `PUT /api/config { "run.shell": value }`, 실패 시 롤백. `pendingRef` 재진입 가드로 키보드 연속 변경 시 PUT 중복 발화 방지
- 사용자 정의 셸 템플릿(`run.shells`) 편집은 범위 외(고급 기능)
- 섹션 "AI 다듬기": refine.baseUrl/model/apiKey/threshold 키. onBlur 시 PUT /api/config(낙관적 아님 — 단순 저장+실패 toast).
  - 모델은 **선택 전용 combobox**(Popover+Command, cmdk). 목록은 GET /api/llm/status로 조회. 자유 입력 없음 — 항목 선택 시 즉시 PUT.
    - Radix Dialog(modal) 안에서 동작하려면 Popover에 `modal`을 반드시 켠다. 네이티브 `<datalist>`는 Dialog focus-trap에 막혀 선택 커밋 불가 → combobox로 대체(P2-10 후속 수정).
  - 엔드포인트 입력 옆 새로고침 버튼: 현재 baseUrl/apiKey를 먼저 저장한 뒤 GET /api/llm/status 재조회(status가 저장된 config 기준이므로). 빈 목록 시 사용자가 엔드포인트 교정 후 재조회하는 경로.
- 섹션 "데이터": Export/Import 버튼 — `GET /api/export`(blob 다운로드), `POST /api/import`(파일 업로드 → 병합).
  - Import는 `window.confirm` 1단계 확인(설정 덮어쓰기 경고) 후 실행. 결과는 toast로 "추가 N건 · 중복 스킵 M건". 서버 `warnings`는 warning toast로 개별 표시.
  - 파일 input은 hidden + ref 트리거. 선택 직후 `e.target.value = ''` 리셋 — 같은 파일 재선택 허용.

## Props
- `open: boolean` / `onClose: () => void` — 부모(WorkspacePage)가 제어 (HistorySheet와 동일 패턴)

## 의존성
- shadcn `Sheet`, `RadioGroup`, `Label`, `Popover`, `Command`(cmdk), `Button`
- `next-themes`의 `useTheme`
- `sonner.toast`
- 백엔드 `GET`/`PUT /api/config` (범용 key-value), `GET /api/llm/status` (모델 목록)

## 디자인 토큰
- 기존 shadcn 표준 토큰만 사용(`bg-background`, `border-border`, `text-muted-foreground`, `--primary`/`--ring`). 신규 토큰 없음(P1-6 실측 결론).
