# ActionBar — 워크스페이스 TopBar 우측 액션 영역

## 책임
- Undo/Redo (zundo의 `useTemporalStore`)
- 프롬프트 클립보드 복사 (단축키 `⌘↵` hint 표시)
- 템플릿 저장 트리거 (선택, `onSave` prop)
- Run as 드롭다운 — `@core/run/providers.js` 레지스트리 기반. 미설치(`GET /api/prompt/providers`) provider는 비활성화('미설치' 표기).

## Imperative API (외부 단축키 연동용)
`forwardRef<ActionBarHandle>` 로 다음 메서드 노출:
- `copy()` — `⌘↵` 단축키 경로
- `runDefault()` — `⌘⇧↵` 단축키 경로 (default = `claude-code`)

상위에서 `const ref = useRef<ActionBarHandle>(null)` 로 ref를 잡고
`useKeyboard` 훅에 `ref.current?.copy` / `.runDefault` 를 전달한다.

## 히스토리 자동 저장
복사(`copy`) 또는 Run as 성공 시 `saveHistory()` fire-and-forget 호출.
body: `{ treeId, prompt, situation(goal 카드 value), answers }` → `POST /api/history`.
저장 결과는 복사/실행 UX에 영향 없음(`.catch(()=>{})` 무시).

## 의존성
- shadcn `Button`, `DropdownMenu`, `Tooltip`
- `useCardStore.prompt`, `useCardStore.treeId`, `useCardStore.cards`, `useTemporalStore`
- `sonner.toast`
- 백엔드 `POST /api/prompt/run` (body `{ target, cwd }`, 응답 `{ ok, launched }`) — 클립보드 복사 후 호출, 새 터미널 창 실행. `GET /api/prompt/providers` — 설치 여부. `POST /api/history` — 히스토리 자동 저장.

## Props
- `onSave?: () => void` — 선택적 저장 트리거 (없으면 저장 버튼 숨김)
- `onHistory?: () => void` — 선택적 히스토리 트리거 (없으면 History 버튼 숨김)
- `projectPath?: string` — 실행 시 cwd로 전달. 없으면 Run 시 경고 toast. TopBar가 WorkspacePage에서 주입.

## 사용 위치
`src/web/components/TopBar/TopBar.tsx` 내부에서만 사용. PromptPreview 내부 액션바는 Stage 3에서 제거됨 (이 ActionBar로 통합).
