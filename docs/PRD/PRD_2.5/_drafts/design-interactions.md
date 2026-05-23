# Interaction & Behavior Specs (from `v*.jsx` + `primitives.jsx` + `shared.jsx`)

## 1. Keyboard Shortcuts

### 1.1 Rendered hints (`<kbd>` glyphs visible in UI)

| Shortcut    | Action                                | Source / surface                                  |
| ----------- | ------------------------------------- | ------------------------------------------------- |
| `⌘↵`        | Copy prompt to clipboard              | `ActionBar` 복사 button (all variants); V3 right rail 복사 |
| `⌘⇧↵`       | Run as Claude Code                    | V3 right-rail Run button (rendered kbd); V4 command palette item |
| `⌘K`        | Toggle command palette                | V4 status bar `jump` button; palette footer       |
| `⌘S`        | Save as template                      | V4 command palette item                           |
| `esc`       | Close command palette                 | V4 palette header (right side)                    |
| `↑↓`        | Navigate list / mention items         | V4 palette footer; `MentionPopover` footer        |
| `↵`         | Select / run                          | V4 palette items + footer; `MentionPopover` footer|

### 1.2 Implicit / non-rendered keys

| Key         | Action                                                         |
| ----------- | -------------------------------------------------------------- |
| `@`         | In `multiline-mention` textarea → fires `onMention()` (opens `MentionPopover`). Hardcoded in `SectionCard.onKeyDown`. |
| any keystroke in input/textarea | Fires `onChange(value)` → updates card.value     |

> **Gap:** Most shortcuts are advertised in `<kbd>` but **not wired** in current demo (no global `keydown` listener present). Wiring is a v2.5 implementation task.

## 2. Card Lifecycle Interactions

### 2.1 Add card (from pool)

1. User clicks a chip in `<CardPool>` (V1/V3/V4/V5) or a row button in the sidebar list (V2).
2. Screen handler `handleAdd(p)` pushes:
   ```js
   { ...p, active: true, order: cards.length, inputType: 'multiline', value: '', rows: 2 }
   ```
3. New card appears at the **end** of the active list. Pool filters out cards already in `cards`.

### 2.2 Remove card

1. Visible only when `!card.required`.
2. Click `×` in card header → `onRemove()` → `handleRemove(id)` → `cards.filter(c => c.id !== id)`.
3. Card disappears from editor and preview. No confirmation, no undo (Undo button rendered but not wired).

### 2.3 Edit value

- Textarea / input: each keystroke → `onChange(value)` → `cards.map(c => c.id === id ? {...c, value} : c)`.
- Chip-style (`select-or-text`): click option → `onChange(option)`. Selected chip styles to `--pc-fg` bg + `--pc-fg-inverse` fg.

### 2.4 Drag reorder

- Visual affordance only: `<Icon name="grip">` with `cursor: grab`.
- No DnD library hooked up in demos. Reorder logic is a v2.5 implementation task. `card.order` already exists on the model — wire `react-dnd` or HTML5 DnD to mutate it.

### 2.5 Inactive vs empty

| Condition                                            | Visual                                            |
| ---------------------------------------------------- | ------------------------------------------------- |
| `card.active === false`                              | container opacity `0.55`                          |
| `card.active && !value.trim()`                       | `empty` badge in header (warning); excluded from preview |
| `card.active && value.trim()`                        | normal; included in preview                       |
| `card.required && card.active && !value.trim()` (v5) | + 3px left-rail `--pc-warning`                    |

## 3. Mention Popover Flow

```
@-key pressed in textarea (multiline-mention)
       │
       ▼
SectionCard.onKeyDown detects 'e.key === @' && inputType === 'multiline-mention'
       │
       ▼
onMention() callback fires (V1 only — others wire optional)
       │
       ▼
Screen state: setMention(true); setTimeout → false after 2500ms (demo auto-dismiss)
       │
       ▼
<MentionPopover visible top={310} left={120}/>  ← position is hard-coded in V1 demo
       │
       ▼
filtered = FILE_SUGGESTIONS.filter(f => f.path.includes(query))
       │
       ▼
First row highlighted (--pc-bg-muted). User picks with mouse or ↑↓/↵ (advertised, not wired)
       │
       ▼
On select: insert path token (e.g. `@src/components/Header.tsx`) into textarea value
        — wiring is a v2.5 implementation task
```

Footer hints: `↑↓ 탐색 · ↵ 선택` and `:line-range 지원` (path range syntax like `Header.tsx:40-55`, visible in `error-evidence` seed value).

## 4. Run Dropdown Flow (`ActionBar`)

```
Click "Run as Claude Code" button
   │
   ▼
setRunOpen(true)  → dropdown appears anchored under button
   │
   ▼
Dropdown lists 4 providers (Claude Code default-highlighted):
   ┌────────────────────────────────────┐
   │ Claude Code            claude      │  ← highlighted (--pc-bg-muted)
   │ Gemini                 gemini      │
   │ GitHub Copilot         gh copilot  │
   │ Codex                  codex       │
   └────────────────────────────────────┘
   │
   ▼
Click row → onRun(provider); setRunOpen(false)
   │
   ▼
Toast: <terminal-icon> Run started · {provider} · runId: a3f9   (visible 2200ms)
```

V3 variant: replaces dropdown with stacked buttons (primary Run + 3 secondary `pc-btn-sm` Gemini/Copilot/Codex).
V5 variant: ActionBar still uses dropdown, but `미리보기` toggle on top bar shows/hides preview pane.

## 5. Toast Behavior

- Position: `absolute; bottom: 20; left: 50%; transform: translate(-50%, {0|12}px)`.
- Show: `setToast('Copied to clipboard')` or `setToast('Run started · {provider}')`.
- Auto-hide: `setTimeout(() => setToast(null), 2200)`.
- Variants:
  - Copy success → `<Icon name="check"/> Copied to clipboard`
  - Run success → `<Icon name="terminal"/> Run started · {provider}<muted> · runId: a3f9</muted>`
- Transitions: opacity `.25s`, transform `.25s`. `pointer-events: none`.

## 6. Preview Token Counter (drift across variants)

Two distinct formulas appear:

| Where                                  | Formula                                                |
| -------------------------------------- | ------------------------------------------------------ |
| `PreviewMarkdown` footer               | `Math.ceil((value.length + label.length) / 3.5)` per active card |
| Top bars / footers in V1/V2/V3/V4/V5   | `Math.ceil(value.length / 3.5)` per active card        |

> **Gap:** Same metric, different implementations — unify in v2.5 (use the label-inclusive form in `PreviewMarkdown`).

## 7. Pre-scan Animation (V6)

Trigger: any change to `path` state.

```
useEffect(path) {
  setScanning(true); setScanned(false);
  const t = setTimeout(() => { setScanning(false); setScanned(true); }, 1100);
  return () => clearTimeout(t);
}
```

- Description in UI: "입력 후 800ms 자동 스캔" (intent), demo uses 1100ms.
- During `scanning`: spinner + "스캔 중…" + "분석: 247 files".
- On `scanned`: green dot + "스캔 완료" + chip rail (lang/framework/domain/pkg) + 재스캔 button.
- CTA `계속하기` is `disabled={!scanned}`.

Spinner: `12×12` ring with `border-top-color: --pc-accent`, `animation: spin 0.8s linear infinite` (keyframes injected via inline `<style>` tag).

## 8. Theme Toggle Mechanism

### 8.1 Hook

```js
const [theme, setTheme] = React.useState('light');
React.useEffect(() => {
  document.documentElement.classList.toggle('pc-dark', theme === 'dark');
}, [theme]);
return [theme, setTheme];
```

### 8.2 Class contract

- Default (no class): light tokens active via `:root { ... }`.
- `<html class="pc-dark">`: dark tokens override via `.pc-dark { ... }` (same property names, different values).
- All component styles read tokens via `var(--pc-*)` — **no class-conditional inline styles needed**.

### 8.3 Toggle button (`<ThemeToggle>`)

`pc-btn pc-btn-ghost pc-btn-sm` containing `<Icon name={theme === 'light' ? 'moon' : 'sun'} size={13}>`. Click handler: `setTheme(theme === 'light' ? 'dark' : 'light')`. `title` reflects target mode (`'다크 모드'` / `'라이트 모드'`).

### 8.4 Persistence

Not implemented in demo. v2.5 implementation should:
1. Read `localStorage['pc-theme']` on mount (with `prefers-color-scheme` fallback).
2. Write on change.
3. Avoid FOUC by inlining a tiny pre-React script that sets the class before paint.

## 9. Hover & Focus States Summary

| Element                | Hover                                          | Focus                                                  |
| ---------------------- | ---------------------------------------------- | ------------------------------------------------------ |
| `.pc-btn` default      | `bg: var(--pc-bg-muted)`                       | (browser default; no explicit ring)                    |
| `.pc-btn-primary`      | `bg: var(--pc-fg-secondary)`                   | —                                                      |
| `.pc-btn-ghost`        | `bg: var(--pc-bg-muted)`                       | —                                                      |
| `.pc-input`            | (none)                                         | `border-color: var(--pc-fg); box-shadow: 0 0 0 3px var(--pc-bg-muted)` |
| `SectionCard outlined` | (none)                                         | `border: --pc-fg; box-shadow: 0 0 0 3px var(--pc-bg-muted)` |
| `SectionCard filled`   | (none)                                         | `box-shadow: inset 0 0 0 1px var(--pc-fg)`             |
| Pool chip (dashed)     | (inherits `.pc-btn:hover`)                     | —                                                      |
| Scrollbar thumb        | `var(--pc-fg-muted)`                           | —                                                      |
| Run dropdown row       | (none — first row pre-highlighted in demo)     | —                                                      |
| Mention row            | (none — first row pre-highlighted in demo)     | —                                                      |
| V6 tree tile           | (none) — selection-only                        | (selection ring already applied)                       |

> **Gap:** No explicit `:focus-visible` ring system. v2.5 should add a uniform 3px `--pc-bg-muted` ring (or a stronger `--pc-accent` ring) for keyboard navigation.

## 10. Motion Inventory

| Where                              | Property                                       | Duration | Easing  |
| ---------------------------------- | ---------------------------------------------- | -------- | ------- |
| `.pc-btn`                          | bg, border-color, color                        | `0.12s`  | default |
| `.pc-input`                        | border-color, box-shadow                       | `0.12s`  | default |
| `SectionCard` container            | border-color, box-shadow                       | `0.12s`  | default |
| V6 tree tile                       | `all`                                          | `0.12s`  | default |
| Toast                              | opacity, transform                             | `0.25s`  | default |
| V6 spinner                         | rotate                                         | `0.8s`   | linear  |

> **Gap:** No easing curves defined. v2.5 should adopt a `cubic-bezier(0.2, 0, 0, 1)`-style curve token and apply across micro-interactions.

## 11. Z-index Stack (observed inline values)

| Layer                        | Value | Source                          |
| ---------------------------- | ----- | ------------------------------- |
| Run dropdown                 | `50`  | `ActionBar`                     |
| Command palette overlay      | `100` | V4                              |
| Mention popover              | `100` | `MentionPopover`                |
| Toast                        | `1000`| `Toast`                         |

> **Gap:** No token system. v2.5 should define `--pc-z-dropdown: 50`, `--pc-z-popover: 100`, `--pc-z-modal: 200`, `--pc-z-toast: 1000`.

## 12. Cross-screen State Continuity (out of demo scope)

Each `v*.jsx` is self-contained (its own `useState`). In v2.5 build-out the canonical state shape is roughly:

```ts
interface WorkspaceState {
  scan: SAMPLE_SCAN;            // pre-scan result
  tree: TreeId;                 // selected workflow
  cards: CardModel[];           // active + ordered
  pool: PoolItem[];             // derived (POOL_CARDS − cards.id)
  theme: 'light' | 'dark';
  ui: {
    runOpen: boolean;
    mentionOpen: boolean;
    paletteOpen: boolean;       // v4
    previewOpen: boolean;       // v5
  };
  toast: { kind: 'copy' | 'run'; provider?: string } | null;
}
```

`makeDemoCards()` seeds `cards`; `POOL_CARDS` is the canonical addable set; `TREES` + `SAMPLE_ROLES` drive the entry screen.
