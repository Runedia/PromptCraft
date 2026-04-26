# TopBar — Three-Column 워크스페이스 상단 44px 바

## 책임
- 좌측: 진입화면으로 돌아가는 뒤로 버튼, 로고, 트리 breadcrumb (트리 아이콘 + 라벨), 프로젝트 경로 (mono, truncate)
- 우측: domain badge (scanResult.domainContext.primary), 재스캔 popover, ActionBar (Undo/Redo/Copy/Run/Save), ThemeToggle

## 의존성
- `@/components/ActionBar/ActionBar.js` — Run as / Copy / Undo·Redo / Save
- `@/components/ThemeToggle.js`
- `@/components/ui/popover.js` — 재스캔 입력 컨테이너
- `@/lib/treeCardStyles.js` — 트리 아이콘/색상

## actionBarRef
부모(WorkspacePage) 가 `useRef<ActionBarHandle>` 로 ref 를 잡고 prop 으로 전달.
Stage 4 의 `useKeyboard` 가 `actionBarRef.current?.copy / .runDefault` 를 호출.

## 레이아웃 결정
- 높이 44px (`h-11`), 디자인 명세 그대로
- 우측 그룹은 `gap-2` 로 미세 조정 — ActionBar 자체가 내부 `gap-1` 이라 너무 빡빡하지 않게
- domain badge 는 scanResult 가 있을 때만 표시
