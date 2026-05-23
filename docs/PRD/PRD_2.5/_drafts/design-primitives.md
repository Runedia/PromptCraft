# Design Primitives — Component Specs (from `primitives.jsx` + `shared.jsx`)

## 0. Module Topology

`shared.jsx` (icons, hooks, data) ← `primitives.jsx` (composables) ← `v1–v6.jsx` (screens).
All exports attached to `window.*` for the Babel-in-browser handoff demo.

| Module      | Exports                                                                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| shared.jsx  | `Icon`, `TREES`, `SAMPLE_SCAN`, `SAMPLE_ROLES`, `FILE_SUGGESTIONS`, `useTheme`, `ThemeToggle`, `Toast`                                    |
| primitives  | `SectionCard`, `makeDemoCards`, `PreviewMarkdown`, `CardPool`, `POOL_CARDS`, `ActionBar`, `MentionPopover`, `ART_W (1280)`, `ART_H (800)` |

## 1. `<SectionCard>` — Editable prompt section

### 1.1 Props

| Prop        | Type                                                | Default        | Notes                                                  |
| ----------- | --------------------------------------------------- | -------------- | ------------------------------------------------------ |
| `card`      | `CardModel`                                         | —              | See §1.2                                               |
| `onChange`  | `(value: string) => void`                           | —              | Fires on every keystroke / option toggle               |
| `onRemove`  | `() => void`                                        | —              | Only rendered when `!card.required`                    |
| `onMention` | `() => void`                                        | —              | Fires when `@` typed in `multiline-mention` textarea   |
| `density`   | `'comfortable' \| 'compact'`                        | `'comfortable'`| Padding preset                                         |
| `variant`   | `'outlined' \| 'filled' \| 'underline'` (implicit)  | `'outlined'`   | Other strings fall through to underline                |

### 1.2 `CardModel` shape

```ts
interface CardModel {
  id: string;                  // 'role' | 'goal' | 'stack-environment' | 'error-evidence' | 'tried-methods' | <pool ids>
  label: string;               // Korean section label
  required?: boolean;          // hides remove button, shows 'required' badge
  active: boolean;             // false → 0.55 opacity
  order: number;
  inputType: 'text' | 'multiline' | 'multiline-mention' | 'select-or-text';
  value?: string;
  options?: string[];          // present when inputType === 'select-or-text'
  hint?: string;               // placeholder
  rows?: number;               // textarea rows (default 2)
}
```

### 1.3 Variants

| Variant       | Border                                              | Background           | Focus signal                                         |
| ------------- | --------------------------------------------------- | -------------------- | ---------------------------------------------------- |
| `outlined`    | `1px solid var(--pc-border)`                        | `var(--pc-bg)`       | border → `var(--pc-fg)` + ring `0 0 0 3px var(--pc-bg-muted)` |
| `filled`      | `1px solid transparent`                             | `var(--pc-bg-muted)` | `inset 0 0 0 1px var(--pc-fg)`                       |
| `underline`   | top/sides transparent, bottom `1px solid --pc-border` | `var(--pc-bg)`     | (none explicit — bottom border stays)                |

Used by: V1/V3/V5 → `outlined` (implicit), V2 → `filled`, V3 uses no variant (inline document).

### 1.4 States

| State                          | Visual                                                                                                |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| default                        | per variant                                                                                            |
| focused (textarea/input)       | per variant focus signal                                                                              |
| inactive (`card.active=false`) | container `opacity: 0.55`                                                                              |
| empty + active                 | `empty` badge (10px mono uppercase, `--pc-warning`) next to label                                     |
| required                       | `required` badge (10px mono uppercase, `--pc-fg-muted`); remove button suppressed                     |
| hover (grip)                   | cursor: grab                                                                                          |

### 1.5 Layout

```
┌─ container (radius: var(--pc-radius)) ──────────────────────────┐
│  header  (padding: 12px 14px | compact 8px 10px)               │
│  ├── [grip 12px] [label 12/600] [required?] [empty?]           │
│  └── [× remove btn 22×22]   (omitted if required)              │
│  body    (padding: 0 14px 12px 34px | compact 0 10px 10px 30px)│
│  └── input | textarea | option chips                           │
└────────────────────────────────────────────────────────────────┘
```

Left body padding (`34px`/`30px`) intentionally aligns body with label text (past grip+gap).

### 1.6 Input rendering rules

| `inputType`            | Renders                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| `select-or-text`       | Wrap chip group (`pc-btn pc-btn-sm`, fontSize 11.5, height 24). Selected chip → `--pc-fg` bg + inverse fg. |
| `multiline` / `multiline-mention` | `<textarea>` borderless, `font: var(--pc-font-sans|mono) 12.5px/1.55`, `rows = card.rows || 2` |
| `text` (default)       | `<input>` borderless, height 22, fontSize 12.5                                                   |

### 1.7 Key interactions

- `@` in `multiline-mention` → `onMention()` opens `<MentionPopover>`.
- Option button click → `onChange(optionLabel)`.
- Remove button → `onRemove()` (only when not required).
- Grip is decorative (cursor only; DnD wiring is screen-level).

## 2. `<PreviewMarkdown>` — Live markdown preview

### 2.1 Props

| Prop    | Type         | Default | Notes                              |
| ------- | ------------ | ------- | ---------------------------------- |
| `cards` | `CardModel[]`| —       | Source of truth                    |
| `dense` | `boolean`    | `false` | `false` → `28px 36px` padding; `true` → `20px 24px` |

### 2.2 Rendering

- Partitions `cards` into `active = card.active && value.trim()` vs `empty = card.active && empty`.
- For each active card: `## {label}` (`--pc-accent`, 12.5px/600 mono) + body (`whiteSpace: pre-wrap`, `--pc-fg-secondary`).
- Empty cards rendered at `opacity: 0.4` with label muted and body italic `(비어 있음 — 출력에서 제외)`.
- Footer: dashed-top divider with `{n} sections active` left / `~{tokens} tokens` right (`fontSize: 11`, muted).
- Token estimate: `Math.ceil((value.length + label.length) / 3.5)` summed across active cards.
- Container: full-height, scrollable, `font: var(--pc-font-mono) 12px/1.7`.

## 3. `<CardPool>` — Chip strip of addable cards

### 3.1 Props

| Prop    | Type                              | Default | Notes                          |
| ------- | --------------------------------- | ------- | ------------------------------ |
| `pool`  | `{ id: string; label: string }[]` | —       | Filtered (not yet in cards)    |
| `onAdd` | `(item) => void`                  | —       | Pushes new card                |
| `dense` | `boolean`                         | `false` | `false` → chip height 26; `true` → 22 |

### 3.2 Chip spec

- `pc-btn pc-btn-sm`, `borderStyle: dashed`, `background: transparent`, `color: var(--pc-fg-secondary)`, `fontSize: 11.5`.
- Prefixed with `+` icon (`size: 10`).
- Click → `onAdd(item)`.
- V2 variant overrides this with a vertical list (full-width dashed buttons) — pool is rendered inline, not via this primitive.

## 4. `<ActionBar>` — Bottom-right command cluster

### 4.1 Props

| Prop         | Type                              | Notes                       |
| ------------ | --------------------------------- | --------------------------- |
| `onCopy`     | `() => void`                      | Triggers copy + toast       |
| `onRun`      | `(provider: string) => void`      | After provider selected     |
| `runOpen`    | `boolean`                         | Controlled dropdown         |
| `setRunOpen` | `(v: boolean) => void`            |                             |
| `compact`    | `boolean` (defined but unused)    | Reserved                    |

### 4.2 Composition (left → right)

| Slot   | Element                                                  |
| ------ | -------------------------------------------------------- |
| 1      | Undo button `pc-btn-sm` (icon: undo)                     |
| 2      | Redo button `pc-btn-sm` (icon: redo)                     |
| 3      | `1×18px` vertical divider (`--pc-border`)                |
| 4      | `복사` button `pc-btn-sm` (icon: copy) + `<kbd>⌘↵</kbd>` |
| 5      | `Run as Claude Code` `pc-btn-sm pc-btn-primary` (icon: play) + chevronDown |

### 4.3 Run dropdown

- Anchored under the Run button (`position: absolute; top: 100%; right: 0; marginTop: 4; zIndex: 50`).
- Container: `bg: var(--pc-bg-elevated)`, `border: 1px solid var(--pc-border)`, `radius: var(--pc-radius)`, `shadow: var(--pc-shadow-lg)`, `padding: 4`, `minWidth: 200`.
- Items: `Claude Code` (preselected, `--pc-bg-muted` highlight), `Gemini`, `GitHub Copilot`, `Codex`. Each row: label left, command alias right (`claude`, `gemini`, `gh copilot`, `codex`) in mono 10px muted.
- Selecting → `onRun(provider); setRunOpen(false)`.

## 5. `<MentionPopover>` — File suggestion dropdown

### 5.1 Props

| Prop      | Type      | Default | Notes                              |
| --------- | --------- | ------- | ---------------------------------- |
| `visible` | `boolean` | —       | Caller controls open state         |
| `query`   | `string`  | —       | Substring filter against path      |
| `top`     | `number`  | `0`     | Absolute position px               |
| `left`    | `number`  | `0`     | Absolute position px               |

### 5.2 Layout

```
┌─ 320 × auto, var(--pc-bg-elevated), shadow-lg, zIndex 100 ─┐
│ [header]  파일 · {n}개         (uppercase mono 10px muted) │
│ [row]    [file icon] path                 size            │
│   ...                                                      │
│ [footer] ↑↓ 탐색  ↵ 선택            :line-range 지원      │
└────────────────────────────────────────────────────────────┘
```

- Row: 11.5px mono, `padding: 7px 10px`, first row has `--pc-bg-muted` highlight.
- Footer: top border 1px, mono 10px muted.

### 5.3 Data: `FILE_SUGGESTIONS`

| Path                         | Size  | Type  |
| ---------------------------- | ----- | ----- |
| `src/components/Header.tsx`  | 2.1K  | tsx   |
| `src/components/Hero.tsx`    | 1.4K  | tsx   |
| `src/components/Footer.tsx`  | 0.9K  | tsx   |
| `src/app/layout.tsx`         | 0.8K  | tsx   |
| `src/app/page.tsx`           | 1.2K  | tsx   |
| `src/lib/db.ts`              | 0.6K  | ts    |

## 6. Card Data — `POOL_CARDS` & `makeDemoCards`

### 6.1 `POOL_CARDS` (addable, not pre-active)

| `id`                  | `label`        |
| --------------------- | -------------- |
| `expected-behavior`   | 기대 동작       |
| `current-situation`   | 현재 상황       |
| `constraints`         | 제약 조건       |
| `build-log`           | 빌드 로그       |
| `request-log`         | 요청/응답 로그  |
| `profiling-data`      | 프로파일링      |
| `output-format`       | 응답 형식       |

V2 extends pool with: `acceptance-criteria (수락 기준)`, `related-code (관련 코드)`, `example-io (입출력 예시)`, `review-focus (리뷰 중점)`.

### 6.2 `makeDemoCards()` — canonical demo (error-solving × web-frontend)

| `id`                 | `label`      | `required` | `inputType`         | `rows` | `value` (preview)                                                                                                                 |
| -------------------- | ------------ | ---------- | ------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `role`               | 역할         | ✓          | `select-or-text`    | —      | `프론트엔드 디버깅 전문가` (options: first 3 of `SAMPLE_ROLES`)                                                                    |
| `goal`               | 목표         | ✓          | `text`              | —      | `Next.js 14 SSR 환경에서 hydration mismatch 원인 진단 및 해결`                                                                     |
| `stack-environment`  | 스택 & 환경  | —          | `multiline`         | 4      | `Next.js 14.2 (App Router)\nReact 19 RC\nTypeScript 5.4\nBun 1.3.10\nTailwind CSS v4`                                              |
| `error-evidence`     | 에러 증거    | —          | `multiline-mention` | 4      | `@src/components/Header.tsx:40-55\n\nText content does not match server-rendered HTML.\nWarning: Did not expect server HTML to contain a <div> in <h1>.` |
| `tried-methods`      | 시도한 방법  | —          | `multiline`         | 2      | `` (empty — triggers `empty` badge)                                                                                                |

All seeded cards are `active: true`, `order` in 0..4.

## 7. `TREES` — Workflow archetypes

5 entries selected on V6 entry screen and shown as left rail icons in V3.

| `id`            | `label`    | `sub`                          | `icon`      | `sample` (one-liner)           | `activeCards` |
| --------------- | ---------- | ------------------------------ | ----------- | ------------------------------ | ------------- |
| `error-solving` | 에러 해결   | 버그·런타임·빌드 오류            | `bug`       | 렌더링 시 hydration mismatch     | 5             |
| `feature-impl`  | 기능 구현   | 새 기능·API·UI 추가              | `sparkles`  | 인증 미들웨어 추가               | 4             |
| `code-review`   | 코드 리뷰   | 품질·보안·성능 검토              | `eye`       | PR #142 리뷰                    | 4             |
| `concept-learn` | 개념 학습   | 용어·패턴·아키텍처               | `book`      | Server Components 이해          | 5             |
| `refactoring`   | 리팩토링    | 구조 개선·기술 부채 해소         | `refactor`  | 컴포넌트 책임 분리               | 5             |

## 8. `SAMPLE_SCAN` — Pre-scan result fixture

```ts
SAMPLE_SCAN = {
  path: '~/work/acme-shop',
  language: 'TypeScript',
  framework: 'Next.js 14',
  domain: 'web-frontend',
  packageManager: 'bun',
  files: 247,
  detected: ['React 19', 'Tailwind v4', 'Prisma', 'tRPC'],
}
```

Rendered as: chip rail in V6 scan banner, breadcrumb strip in V1, sidebar block in V2, right-rail Context list in V3, top status bar in V4, brand bar in V5.

## 9. `SAMPLE_ROLES` — Suggested roles (error-solving × web-frontend)

```
프론트엔드 디버깅 전문가
브라우저 호환성 엔지니어
React 컴포넌트 아키텍트
TypeScript 개발자
풀스택 디버거
```

First 3 are exposed as `select-or-text` options on the `role` card. All 5 shown as pill chips in V6 entry screen.

## 10. `<Icon>` — SVG inline atlas

`<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">`

| Glyphs available (40)                                                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `chevronRight`, `chevronDown`, `chevronLeft`, `plus`, `x`, `search`, `folder`, `file`, `grip`, `drag`, `play`, `bug`, `sparkles`, `eye`, `book`, `refactor`, `code`, `layers`, `arrowRight`, `sun`, `moon`, `check`, `terminal`, `spark`, `copy`, `save`, `undo`, `redo`, `cmd`, `settings`, `history`, `lock`, `flame`, `wand` |

Defaults: `size=14`, `stroke=1.5`.

## 11. `<Toast>` — Bottom-center transient message

| Prop      | Type      | Notes                                  |
| --------- | --------- | -------------------------------------- |
| `children`| `ReactNode` | Body (icon + text)                   |
| `visible` | `boolean` | Mounted always; opacity-toggled        |

Style: `position: absolute; bottom: 20; left: 50%; transform: translate(-50%, {visible ? 0 : 12}px)`, `bg: var(--pc-fg)`, `color: var(--pc-fg-inverse)`, `padding: 8px 14px`, `radius: var(--pc-radius)`, `font: var(--pc-font-mono) 12px`, `shadow: var(--pc-shadow-pop)`, `transition: opacity .25s, transform .25s`, `zIndex: 1000`, `pointerEvents: none`.

Variants in v1–v5:
- Copy → `<Icon name="check"/> Copied to clipboard`
- Run  → `<Icon name="terminal"/> Run started · {provider} · runId: a3f9`
- Auto-dismiss after `2200ms` via `setTimeout`.

## 12. `useTheme()` — Theme hook

```ts
const [theme, setTheme] = useTheme();   // 'light' | 'dark'
```

Implementation:
```js
const [theme, setTheme] = React.useState('light');
React.useEffect(() => {
  document.documentElement.classList.toggle('pc-dark', theme === 'dark');
}, [theme]);
```

Companion `<ThemeToggle>` renders `pc-btn-ghost pc-btn-sm` with `moon` (light → dark) / `sun` (dark → light) at `size: 13`.
