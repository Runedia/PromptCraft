# Design Tokens — SSOT (from `PromptCraftDesigin/styles.css`)

> v0/Vercel-inspired monochrome system. Light/dark via `.pc-dark` class on `:root`.
> One restrained accent: warm amber/ember (PromptCraft identity).

## 1. Color Tokens

### 1.1 Neutrals — Background

| Token              | Light                          | Dark                           | Usage                                    |
| ------------------ | ------------------------------ | ------------------------------ | ---------------------------------------- |
| `--pc-bg`          | `#ffffff`                      | `#0a0a0a`                      | Page / canvas base                       |
| `--pc-bg-subtle`   | `#fafaf9`                      | `#111110`                      | Preview pane, sidebar                    |
| `--pc-bg-muted`    | `#f4f4f3`                      | `#161614`                      | Hover, filled card, focus glow           |
| `--pc-bg-inset`    | `#eeeeec`                      | `#1c1c1a`                      | Terminal preview pane (v4)               |
| `--pc-bg-elevated` | `#ffffff`                      | `#18181a`                      | Popovers, dropdowns, palette             |
| `--pc-bg-overlay`  | `rgba(255, 255, 255, 0.85)`    | `rgba(10, 10, 10, 0.85)`       | Backdrops                                |

### 1.2 Neutrals — Border

| Token                 | Light       | Dark        | Usage                          |
| --------------------- | ----------- | ----------- | ------------------------------ |
| `--pc-border`         | `#e7e5e2`   | `#262624`   | Default border                 |
| `--pc-border-strong`  | `#d4d2cc`   | `#3a3a37`   | Scrollbar thumb, dashed pool   |
| `--pc-border-inset`   | `#eeeeec`   | `#1f1f1d`   | Row dividers (v4 list)         |

### 1.3 Neutrals — Foreground

| Token               | Light       | Dark        | Usage                              |
| ------------------- | ----------- | ----------- | ---------------------------------- |
| `--pc-fg`           | `#0a0a0a`   | `#f5f5f4`   | Body text, primary button bg       |
| `--pc-fg-secondary` | `#525252`   | `#a8a8a4`   | Secondary text, descriptions       |
| `--pc-fg-muted`     | `#8a8a87`   | `#707070`   | Meta, captions, kbd                |
| `--pc-fg-subtle`    | `#b4b3ae`   | `#4a4a47`   | Placeholders, grip dots            |
| `--pc-fg-inverse`   | `#ffffff`   | `#0a0a0a`   | Text on `--pc-fg` (primary btn)    |

### 1.4 Accent — Warm Amber/Ember

| Token                | Light                            | Dark                              | Usage                          |
| -------------------- | -------------------------------- | --------------------------------- | ------------------------------ |
| `--pc-accent`        | `#c2410c`                        | `#fb923c`                         | Markdown `##` heading, domain  |
| `--pc-accent-hover`  | `#9a3412`                        | `#fdba74`                         | Hover state                    |
| `--pc-accent-bg`     | `#fff7ed`                        | `rgba(251, 146, 60, 0.08)`        | Tinted tile background         |
| `--pc-accent-border` | `#fed7aa`                        | `rgba(251, 146, 60, 0.3)`         | Tinted border                  |
| `--pc-accent-fg`     | `#7c2d12`                        | `#fdba74`                         | Text on accent surface         |

### 1.5 Semantic

| Token          | Light       | Dark        | Usage                       |
| -------------- | ----------- | ----------- | --------------------------- |
| `--pc-success` | `#047857`   | `#34d399`   | Scan complete, ✓ filled     |
| `--pc-warning` | `#b45309`   | `#fbbf24`   | Empty card badge, warn rail |
| `--pc-danger`  | `#b91c1c`   | `#f87171`   | Destructive                 |
| `--pc-info`    | `#1d4ed8`   | `#60a5fa`   | Informational               |

## 2. Spacing & Radius

### 2.1 Radius

| Token            | Value   | Usage                                      |
| ---------------- | ------- | ------------------------------------------ |
| `--pc-radius-sm` | `4px`   | Tiny chips, kbd inner                      |
| `--pc-radius`    | `6px`   | Default button/input/card                  |
| `--pc-radius-md` | `8px`   | Section panel (v5), tree tile (v6)         |
| `--pc-radius-lg` | `12px`  | Command palette modal                      |
| `--pc-radius-xl` | `16px`  | Reserved                                   |

### 2.2 Spacing (inline, no token system — observed values)

| Context                    | Padding                              |
| -------------------------- | ------------------------------------ |
| Top bar (`44px` height)    | `0 16–20px`                          |
| Editor pane                | `24px` (v1), `24px 32px` (v5)        |
| Document column            | `40px 56px 80px`, max-width `720px`  |
| Card (`comfortable`)       | `12px 14px` header / `0 14px 12px 34px` body |
| Card (`compact`)           | `8px 10px` header / `0 10px 10px 30px` body  |
| Section gap (vertical)     | `8px` (v1), `10px` (v5), `22px` (v3) |
| Preview content            | `28px 36px` / dense `20px 24px`      |

## 3. Shadow Tokens

| Token             | Light                                                            | Dark                                                         | Usage                  |
| ----------------- | ---------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------- |
| `--pc-shadow-sm`  | `0 1px 2px rgba(15,15,15,0.04)`                                  | `0 1px 2px rgba(0,0,0,0.3)`                                  | Subtle lift            |
| `--pc-shadow-md`  | `0 1px 2px rgba(15,15,15,0.04), 0 4px 12px rgba(15,15,15,0.04)`  | `0 1px 2px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.3)`      | Card                   |
| `--pc-shadow-lg`  | `0 1px 3px rgba(15,15,15,0.05), 0 8px 32px rgba(15,15,15,0.06)`  | `0 1px 3px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.4)`      | Dropdowns, popovers    |
| `--pc-shadow-pop` | `0 12px 40px rgba(15,15,15,0.16), 0 4px 12px rgba(15,15,15,0.08)`| `0 12px 40px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.4)`    | Modal, command palette |

## 4. Typography Tokens

### 4.1 Font Stacks

| Token             | Stack                                                                                                  | Role                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| `--pc-font-sans`  | `"Geist", ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`         | UI body — primary                          |
| `--pc-font-mono`  | `"Geist Mono", "JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace`                  | Code, paths, kbd, metadata labels, preview |
| `--pc-font-serif` | `"Instrument Serif", "Iowan Old Style", Georgia, serif`                                                | Document title (v3) — editorial            |

### 4.2 Web Font Loading

| Family             | License                  | Source                            | Weights used       |
| ------------------ | ------------------------ | --------------------------------- | ------------------ |
| Geist              | SIL OFL 1.1 (open)       | Google Fonts / `vercel/geist-font` | 400, 500, 600      |
| Geist Mono         | SIL OFL 1.1 (open)       | Google Fonts / `vercel/geist-font` | 400, 500           |
| Instrument Serif   | SIL OFL 1.1 (open)       | Google Fonts (`Instrument+Serif`) | 400 (regular + italic) |

**Loading strategy:** self-host via `@fontsource/geist-sans`, `@fontsource/geist-mono`, `@fontsource/instrument-serif`. Preload regular + medium weights as `font-display: swap`. Mono and serif lazy-loaded on first need (preview / document title respectively).

### 4.3 Type Scale (observed)

| Role                       | Size      | Weight | Family | Notes                              |
| -------------------------- | --------- | ------ | ------ | ---------------------------------- |
| Entry hero (v6)            | `36px`    | 600    | sans   | `letter-spacing: -0.8`             |
| Document title (v3)        | `38px`    | 400    | serif  | `letter-spacing: -0.8; line-height: 1.15` |
| Page H1 (v2/v5)            | `20–22px` | 600    | sans   | `letter-spacing: -0.4`             |
| Section block H2 (v3)      | `16px`    | 600    | sans   | `letter-spacing: -0.2`             |
| Stat number (v3 tile)      | `18px`    | 600    | mono   |                                    |
| Body / lead paragraph      | `13–14px` | 400    | sans   | `line-height: 1.55–1.6`            |
| Card label                 | `12–13px` | 600    | sans   | `letter-spacing: -0.1`             |
| Card body (sans)           | `12.5–13px` | 400  | sans   | `line-height: 1.55–1.6`            |
| Card body (mention/mono)   | `11.5–12.5px` | 400 | mono  |                                    |
| Preview body               | `12px`    | 400    | mono   | `line-height: 1.7`                 |
| Preview heading (`##`)     | `12.5px`  | 600    | mono   | color `--pc-accent`                |
| Caption / meta uppercase   | `10.5–11px` | 500  | mono   | `letter-spacing: 0.6–0.7; text-transform: uppercase` |
| Status badge (required/empty) | `10px` | 500    | mono   | uppercase                          |
| Kbd (`pc-kbd`)             | `10.5px`  | 500    | mono   | `min-width: 18px; height: 18px`    |

### 4.4 Body Defaults

```css
body {
  font-family: var(--pc-font-sans);
  background: var(--pc-bg);
  color: var(--pc-fg);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
```

Utilities: `.pc-mono { font-family: var(--pc-font-mono) }`, `.pc-serif { font-family: var(--pc-font-serif) }`.

## 5. Base Component Tokens

### 5.1 Button (`.pc-btn`)

| State / variant                | Spec                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| default (md)                   | `height: 30px; padding: 0 12px; font-size: 13px; weight: 500; radius: var(--pc-radius); border: 1px solid var(--pc-border); bg: var(--pc-bg); fg: var(--pc-fg)` |
| hover                          | `background: var(--pc-bg-muted)`                                                      |
| `[disabled]`                   | `opacity: 0.5; cursor: not-allowed`                                                   |
| `.pc-btn-primary`              | `bg: var(--pc-fg); fg: var(--pc-fg-inverse); border: var(--pc-fg)`                    |
| `.pc-btn-primary:hover`        | `bg: var(--pc-fg-secondary); border: var(--pc-fg-secondary)`                          |
| `.pc-btn-ghost`                | `bg: transparent; border: transparent`                                                |
| `.pc-btn-ghost:hover`          | `bg: var(--pc-bg-muted)`                                                              |
| `.pc-btn-sm`                   | `height: 26px; padding: 0 8px; font-size: 12px`                                       |
| `.pc-btn-lg`                   | `height: 36px; padding: 0 16px; font-size: 14px`                                      |
| gap (icon ↔ text)              | `6px`                                                                                 |
| transition                     | `background 0.12s, border-color 0.12s, color 0.12s`                                   |

### 5.2 Input (`.pc-input`)

| State                    | Spec                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------- |
| default                  | `height: 32px; padding: 0 10px; font-size: 13px; bg: var(--pc-bg); border: 1px solid var(--pc-border); radius: var(--pc-radius)` |
| `:focus`                 | `border-color: var(--pc-fg); box-shadow: 0 0 0 3px var(--pc-bg-muted)`                |
| `.pc-mono` modifier      | `font-family: var(--pc-font-mono); font-size: 12.5px`                                 |
| `textarea.pc-input`      | `height: auto; padding: 8px 10px; line-height: 1.5; resize: vertical`                 |
| transition               | `border-color 0.12s, box-shadow 0.12s`                                                |

### 5.3 Keyboard hint (`kbd.pc-kbd`)

`min-width: 18px; height: 18px; padding: 0 4px; font: 500 10.5px/1 var(--pc-font-mono); color: var(--pc-fg-muted); bg: var(--pc-bg); border: 1px solid var(--pc-border); border-bottom-width: 1.5px; radius: 3px`

### 5.4 Scrollbar (`.pc-scroll`)

Webkit only. `width/height: 8px; track: transparent; thumb: var(--pc-border-strong); thumb-hover: var(--pc-fg-muted); thumb-radius: 4px`.

### 5.5 Dotted background (`.pc-grid-bg`)

`background-image: radial-gradient(circle, var(--pc-border) 1px, transparent 1px); background-size: 24px 24px;` — reserved for entry/empty states.

## 6. Light → Dark Mapping Rules

1. **Backgrounds invert by lightness, not hue.** Warm-neutral grays preserved (slightly warm because base palette is warm-neutral, not pure gray).
2. **Foregrounds invert** (`--pc-fg ↔ --pc-fg-inverse`).
3. **Accent saturation rises in dark mode** (`#c2410c` → `#fb923c`); accent-bg becomes a low-alpha tint of the accent instead of a tinted off-white.
4. **Semantics shift to lighter tints** in dark to maintain WCAG AA contrast on dark surfaces.
5. **Shadows deepen** in dark (`rgba(0,0,0,0.3–0.6)` vs `rgba(15,15,15,0.04–0.16)`).
6. **Radii, spacing, font tokens are mode-invariant.**

## 7. Tokens NOT yet defined (gaps to fill in PRD 2.5)

- z-index scale (popover/dropdown/modal use ad-hoc `zIndex: 50/100/1000`)
- motion/easing tokens (transitions hardcoded to `.12s` linear-default; no easing curve)
- focus-visible ring (currently `box-shadow: 0 0 0 3px var(--pc-bg-muted)` only)
- typography tokens proper (size/weight/lh observed but not promoted to vars)
