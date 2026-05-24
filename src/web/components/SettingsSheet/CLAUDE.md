# SettingsSheet — 설정 Sheet

## 책임
- 우측 슬라이드 Sheet(shadcn `Sheet`, side=right)로 설정 노출
- 섹션 "모양": 테마 3지 선택(시스템/라이트/다크) — next-themes `setTheme`에 위임. localStorage 영속, `/api/config` 무관. TopBar `ThemeToggle`과 상태 공유(자동 동기)
- 섹션 "실행": 기본 셸 3지 선택(cmd/powershell/pwsh) — `run.shell` 키
  - open 시 `GET /api/config` → `run.shell` 현재값 로드(없으면 'cmd')
  - 변경 시 낙관적 갱신 + `PUT /api/config { "run.shell": value }`, 실패 시 롤백. `pendingRef` 재진입 가드로 키보드 연속 변경 시 PUT 중복 발화 방지
- 사용자 정의 셸 템플릿(`run.shells`) 편집은 범위 외(고급 기능)

## Props
- `open: boolean` / `onClose: () => void` — 부모(WorkspacePage)가 제어 (HistorySheet와 동일 패턴)

## 의존성
- shadcn `Sheet`, `RadioGroup`, `Label`
- `next-themes`의 `useTheme`
- `sonner.toast`
- 백엔드 `GET`/`PUT /api/config` (범용 key-value)

## 디자인 토큰
- 기존 shadcn 표준 토큰만 사용(`bg-background`, `border-border`, `text-muted-foreground`, `--primary`/`--ring`). 신규 토큰 없음(P1-6 실측 결론).
