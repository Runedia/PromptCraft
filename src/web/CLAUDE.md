# src/web — Web UI 레이어

**목적:** React ^19 + Vite ^6 기반 웹 인터페이스. Tailwind CSS v4 + shadcn/ui 사용.

## 컨벤션

- **별도 CSS 파일 신규 생성 금지** — `design-system.css`의 `@theme` 토큰 + Tailwind 유틸 사용
- shadcn/ui 추가: `pnpm dlx shadcn@latest add <component>` → `src/web/components/ui/`
- 조건부 클래스: `cn()` from `@/lib/utils`

## 상태 관리

- `useCardStore` — 카드 상태 (zundo undo/redo 지원)
- `useTemporalStore` — `() => useStore(useCardStore.temporal)`

## 디자인 토큰 (주요)

```
bg-bg-primary / bg-bg-secondary
text-text-muted / text-accent-primary
border-border-subtle
bg-accent-success
font-code
```

## 컴포넌트 구조

- `components/ui/` — shadcn/ui 원본
- `components/[Feature]/` — 기능별 컴포넌트
