# src/web — Web UI 레이어

**목적:** React ^19 + Vite ^6 기반 웹 인터페이스. Tailwind CSS v4 + shadcn/ui 사용.

## 컨벤션

- **별도 CSS 파일 신규 생성 금지** — `styles/design-system.css`의 `@theme` 토큰 + Tailwind 유틸 사용
- shadcn/ui 추가: `bunx --bun shadcn@latest add <component>` → `src/web/components/ui/`
- 조건부 클래스: `cn()` from `@/lib/utils`

## Import 경로 규칙

- **같은 디렉토리 내** 파일만 `./` 상대경로 허용
- **그 외 모든 경우** alias 사용 (상대경로 `../` 금지)
  - `src/web` 내부 → `@/store/...`, `@/components/...`, `@/hooks/...` 등
  - `src/core` 참조 → `@core/builder/...`, `@core/types/...` 등

## 상태 관리

- `useCardStore` — 카드 상태 (zundo undo/redo 지원)
- `useTemporalStore` — `() => useStore(useCardStore.temporal)`

## 디자인 토큰 (shadcn 표준)

```
bg-background / bg-card / bg-muted / bg-accent / bg-popover
text-foreground / text-muted-foreground / text-secondary-foreground
text-primary / text-destructive / text-success / text-warning
border-border / border-border/50
bg-primary / bg-success / bg-warning / bg-destructive
font-code / font-ui (비shadcn, 유지)
shadow-card / shadow-card-hover / shadow-drag (비shadcn, 유지)
```

## UI 식별자

- 모든 주요 UI 요소는 `src/web/ui-ids.ts`에 `UI_IDS` 상수로 정의하고 `data-ui-id` 속성으로 부착한다
- 신규 컴포넌트 추가 시 `ui-ids.ts`에 ID 등록 후 `bun run ui-map:generate` 실행
- 전체 맵은 `docs/ui-map.md` (자동 생성 — 직접 수정 금지)

## 컴포넌트 구조

- `components/ui/` — shadcn/ui 원본
- `components/[Feature]/` — 기능별 컴포넌트 (PascalCase)
- `components/inputs/` — 입력 관련 공통 컴포넌트 (소문자 예외)
