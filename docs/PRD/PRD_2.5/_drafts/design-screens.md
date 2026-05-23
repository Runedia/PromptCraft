# Screen Specs — V1 ~ V6 (from `v*.jsx`)

All artboards are **1280 × 800** (`ART_W × ART_H` from `primitives.jsx`). Sticky behaviors are inferred from `overflow: auto` regions inside fixed-height shells.

## V1 — Classic Dual-Pane (60/40)

**Purpose.** PRD's canonical layout. Card editor left, live markdown preview right. The "what you write" / "what gets sent" mental model in one frame.

### Layout

```
┌── Top bar · 44px ──────────────────────────────────────────────────────┐
│ [logo 18] PromptCraft  [bug] 에러 해결 › ~/work/acme-shop      domain: web-frontend  [history] [⚙] │
├──────────────────────────────────┬─────────────────────────────────────┤
│ LEFT · editor (60%)              │ RIGHT · preview (40%)               │
│ padding: 24                      │ bg: --pc-bg-subtle                  │
│ ┌ breadcrumb chip (--pc-bg-muted)│ ┌ header strip · 36px              │
│ │ folder · path · framework      │ │ "preview · markdown"  ~N tokens  │
│ │ · 247 files · ● scan complete  │ ├──────────────────────────────────│
│ └────────────────────────────────│ │ <PreviewMarkdown> (flex 1)       │
│ ── Active sections · N ──        │ │                                  │
│ [SectionCard outlined] × 5       │ │                                  │
│   gap 8                          │ │                                  │
│ ── Card pool · 추가 가능 ──      │ ├──────────────────────────────────│
│ <CardPool> (dashed chip strip)   │ │ Action footer · 52px  bg:--pc-bg │
│ <MentionPopover at 310, 120>     │ │     <ActionBar/>                 │
└──────────────────────────────────┴─────────────────────────────────────┘
```

### Numbers

| Region                  | Size                                      |
| ----------------------- | ----------------------------------------- |
| Top bar                 | height `44px`, padding `0 16px`, gap `16` |
| LEFT pane               | width `60%`, `padding: 24`, scroll        |
| Vertical split          | `1px solid var(--pc-border)`              |
| RIGHT pane              | width `40%`, bg `--pc-bg-subtle`          |
| Preview header strip    | height `36px`, padding `0 16px`           |
| Preview action footer   | height `52px`, padding `0 16px`           |
| Section card gap        | `8px`                                     |
| Breadcrumb chip padding | `10px 12px`                               |

### Differentiator

Default. Outlined card variant. Action bar lives **inside** the preview pane's footer (single command surface tied to the artifact being sent).

## V2 — Three-Column Workbench

**Purpose.** Trade horizontal density for explicit pool visibility — better L2 → L3 nudge. Pool is permanently visible as a left sidebar.

### Layout

```
┌── Top bar · 44px (logo + flex spacer + ActionBar) ─────────────────────┐
├─────────────┬──────────────────────────────────────┬───────────────────┤
│ Sidebar 240 │ MIDDLE · editor (flex 1)             │ RIGHT preview 440 │
│ bg --pc-bg- │ padding: 24                          │ bg --pc-bg-subtle │
│   subtle    │ H1 "프롬프트 작성" 20/600            │ header strip 36   │
│             │ subtitle 12.5 secondary               │ "preview"  ~N tok │
│ ─Project    │ [SectionCard variant="filled"] × 5   │ <PreviewMarkdown  │
│ tree icon + │   gap 8                              │   dense />        │
│ path/fw/files                                       │                   │
│ ─ Card pool │                                       │                   │
│ allKnown[] full-width dashed buttons               │                   │
│   • [+] / [✓ in-use]                               │                   │
└─────────────┴──────────────────────────────────────┴───────────────────┘
```

### Numbers

| Region                  | Size                                      |
| ----------------------- | ----------------------------------------- |
| Sidebar                 | width `240px`, scroll                     |
| Middle editor           | `flex: 1`, `padding: 24`                  |
| Right preview           | width `440px`                             |
| Sidebar block padding   | `14px 14px 10px` + section `14px 14px`    |
| Pool button             | `padding 7px 10px`, `1px dashed --pc-border-strong`, radius `--pc-radius-sm` |
| Section card variant    | `filled`                                  |

### Differentiator

- ActionBar sits in **top bar** (not preview footer).
- Card pool is a **vertical list** with in-use disabled state — every pool card is discoverable at a glance.
- Section cards use `filled` variant (`--pc-bg-muted`) for distinct read-mode look.
- Adds 4 extra pool items beyond `POOL_CARDS`: `acceptance-criteria`, `related-code`, `example-io`, `review-focus`.

## V3 — Document-Centric (Notion / Craft hybrid)

**Purpose.** The prompt itself **is** the document. Section headers are editable inline. No separate preview — what you see is what gets sent. Right rail holds metadata + actions.

### Layout

```
┌─────┬─────────────────────────────────────────────────┬────────────────┐
│Left │  Center · scroll  (max-width 720 centered)      │ Right rail 280 │
│ 56  │  padding 40 56 80                                │ padding 20     │
│     │                                                  │ bg --pc-bg-    │
│ [▲] │  [bug 11] 에러 해결 · Next.js 14 · ~/work/acme   │   subtle       │
│ ───  │  ┌─ H1 serif 38/400 letter-spacing -0.8 ─┐    │ ── Context ──  │
│ tree │  │ Hydration mismatch *in Header.tsx*     │    │ Domain / FW /  │
│ icons│  └────────────────────────────────────────┘    │ Lang / Pkg     │
│ × 5  │  5 sections · ~N tokens · auto-saved             │                │
│ ───  │                                                  │ ── Stats ──    │
│ [⏱]  │  [block grip + H2 16/600 + remove ×]            │ 2×2 grid       │
│ [⚙]  │   <textarea or chip group>                       │   sections /   │
│      │   gap 22 between blocks                          │   tokens /     │
│      │                                                  │   empty /      │
│      │  [+ chip] × 5 (pool subset)                     │   mentions     │
│      │                                                  │ (spacer)       │
│      │                                                  │ ┌ 복사 button ┐│
│      │                                                  │ ├ Run Primary┤│
│      │                                                  │ │ Gemini / Copilot / Codex (3-up) │
└─────┴─────────────────────────────────────────────────┴────────────────┘
```

### Numbers

| Region                  | Size                                          |
| ----------------------- | --------------------------------------------- |
| Left icon rail          | width `56px`, padding `14px 0`, gap `6`       |
| Rail icon button        | `32 × 32`, transparent border, accent tint when active |
| Center max-width        | `720px`, padding `40 56 80`                   |
| H1 (document title)     | serif 38/400, `letter-spacing: -0.8`, `line-height: 1.15` |
| Document meta           | 11.5px mono muted                             |
| Block gap               | `22px`                                        |
| H2 (block label)        | 16/600 letter-spacing `-0.2`                  |
| Body left-pad           | `20px` (under grip alignment)                 |
| Right rail              | width `280px`, padding `20`                   |
| Stat tile               | padding `10px 12px`, border `1px solid --pc-border`, bg `--pc-bg`, radius `--pc-radius` |
| Stat number             | mono 18/600, letter-spacing `-0.5`            |
| Action buttons          | full-width, height `34`, justify `center`     |

### Differentiator

- Editorial: serif H1 + sans body.
- No preview pane — body **is** the preview.
- Stats tiles surface metrics other variants bury (sections/tokens/empty/mentions).
- Provider 3-up buttons replace dropdown.
- Per-block remove ×, no required-badge text (icon-only `lock` not used here; v3 just hides remove for required).

## V4 — Command Palette / Editor (Linear / Raycast hybrid)

**Purpose.** Dense, dark-leaning, keyboard-first. Cards as list rows; preview as terminal panel; command palette as primary interaction surface.

### Layout

```
┌── Status bar 32px (mono 11.5) ─────────────────────────────────────────┐
│ [spark] promptcraft · ~/work/acme-shop / error-solving    N active  ~T tok  [search] jump ⌘K │
├──────────────────────────────────────────────────────────┬─────────────┤
│ LEFT · rows (flex 1)                                     │ RIGHT 460   │
│ each row grid: 40px | 160px | 1fr | auto                 │ bg --pc-bg- │
│ ┌──────┬──────────────┬──────────────────────┬─────────┐ │   inset     │
│ │ 01   │ 역할         │ chips or textarea     │ ✓ N    │ │ header 28   │
│ │ mono │ id · type    │                       │         │ │ ~/.promptcraft/preview.md │
│ └──────┴──────────────┴──────────────────────┴─────────┘ │ ──────────  │
│  × 5 rows, divider `--pc-border-inset`                   │ <PreviewMarkdown dense /> │
│ ── + add card ── (CardPool dense)                         │ footer + <ActionBar/>    │
└──────────────────────────────────────────────────────────┴─────────────┘

+ overlay (paletteOpen)
   centered modal, width 540, padding-top 130
   bg rgba(0,0,0,0.4) backdrop-filter blur(4px)
   ┌─ palette card ─────────────────────────┐
   │ [search] Type a command or search…  esc │
   ├─────────────────────────────────────────│
   │ • Add card · 제약 조건       Cards   ⏎ │   ← highlighted
   │   Add card · 빌드 로그       Cards     │
   │   Add card · 응답 형식       Cards     │
   │ ▸ Run as Claude Code        Actions ⌘⇧⏎│
   │   Copy prompt                Actions ⌘⏎│
   │   Save as template           Actions ⌘S│
   ├─────────────────────────────────────────│
   │  ↑↓ navigate  ⏎ run  ⌘K toggle         │
   └─────────────────────────────────────────┘
```

### Numbers

| Region                  | Size                                              |
| ----------------------- | ------------------------------------------------- |
| Top status bar          | height `32px`, padding `0 12px`, gap `14`         |
| Row grid columns        | `40px | 160px | 1fr | auto`                       |
| Row padding             | `10px 14px`                                       |
| Row index               | mono 10.5, `--pc-fg-subtle`                       |
| Card id+type meta       | mono 10.5, `--pc-fg-muted`                        |
| Right pane              | width `460px`, bg `--pc-bg-inset`                 |
| Right header            | height `28px`, mono 10.5                          |
| Right footer            | padding `8px 12px`, justify flex-end              |
| Palette modal           | width `540`, radius `--pc-radius-lg`, shadow `--pc-shadow-pop` |
| Palette input row       | padding `14px 18px`, fontSize 14                  |
| Palette item            | padding `8px 12px`, radius `6`                    |
| Palette footer          | padding `8px 14px`, mono 10.5                     |

### Differentiator

- No card boxes — cards are **table rows**.
- Per-row status badge (`✓ {len} chars` vs `— empty`) replaces preview's empty-section pass-through.
- Backdrop-blur palette overlay always boots open (demo state).
- Preview filename styled as `~/.promptcraft/preview.md` — terminal idiom.

## V5 — Stage / Wizard (vertical pipeline)

**Purpose.** First-time onboarding. The 5-step flow itself is the UI. Preview is a slide-out panel.

### Layout

```
┌── Top bar 44px (logo + path + ~T tok + 미리보기 toggle + ActionBar) ──┐
├── Stage stepper · bg --pc-bg-subtle · padding 14px 20px ──────────────┤
│  ●—done─●—done─◍—active─○────○                                       │
│ Pre-scan  Tree   Sections     Review  Run                             │
│ 247files  에러   N/M · k empty 미리   fire-and-forget                  │
│ ·1.2s     해결                보기                                     │
├──────────────────────────────────────────────────────┬────────────────┤
│ MAIN · scroll · padding 24 32 · max-width 760        │ Preview 420 (if previewOpen) │
│  H1 22/600 "섹션 채우기"   "구체적일수록 ↑"          │ header 36 + close × │
│  ┌ section panel ─────────────────────────┐          │ <PreviewMarkdown dense /> │
│  │ header bg --pc-bg-subtle               │          │                 │
│  │  01  grip  Label  required             │          │                 │
│  │  ✓ {len} chars / — empty   ×           │          │                 │
│  ├────────────────────────────────────────│          │                 │
│  │ textarea or chip group                 │          │                 │
│  └────────────────────────────────────────┘          │                 │
│  × 5, gap 10                                          │                 │
│  ┌ dashed pool tile · 14px 16px ─────────┐          │                 │
│  │ 추천 카드 추가 · 도메인: web-frontend  │          │                 │
│  │ <CardPool/>                            │          │                 │
│  └────────────────────────────────────────┘          │                 │
└──────────────────────────────────────────────────────┴────────────────┘
```

### Stepper states

| State    | Circle border         | Circle bg            | Glyph                           | Label color           |
| -------- | --------------------- | -------------------- | ------------------------------- | --------------------- |
| `done`   | `1.5px --pc-fg`       | `--pc-fg`            | `check` 12px stroke 2.5         | `--pc-fg`             |
| `active` | `1.5px --pc-accent`   | `--pc-accent`        | tree icon                       | `--pc-fg`             |
| `next`   | `1.5px --pc-border-strong` | `--pc-bg`        | index number (mono 11/600)       | `--pc-fg-muted`       |

Connector line: `flex 1, height 1`, bg `--pc-fg` between done steps, `--pc-border-strong` after.

### Numbers

| Region                  | Size                                          |
| ----------------------- | --------------------------------------------- |
| Top bar                 | height `44px`, padding `0 20px`               |
| Stepper                 | padding `14px 20px`, circle `28 × 28` r 14    |
| Stepper connector       | margin `0 16px`, `min-width 24`               |
| Main column max-width   | `760px`, padding `24 32`                      |
| Section panel           | radius `--pc-radius-md`, border `1px --pc-border`, **left-border 3px `--pc-warning`** when active+empty |
| Section header          | padding `10px 14px`, bg `--pc-bg-subtle`      |
| Section body            | padding `10px 14px`                           |
| Pool tile               | dashed border `--pc-border-strong`, radius `--pc-radius-md`, padding `14px 16px` |
| Preview pane            | width `420px`                                 |
| Preview header          | height `36`, padding `0 16`                   |

### Differentiator

- Only variant with an **explicit progress stepper** (Pre-scan → Tree → Sections → Review → Run).
- Section panel has a **3px left rail** in warning color when active-but-empty (visual nudge).
- Per-section status string (`✓ {len} chars` / `— empty`) in the header (V4 also has this, but V4 puts it in a right-aligned cell; V5 puts it in the header).
- Preview pane is **dismissable** (`× close`) and re-openable via top-bar `미리보기` toggle.

## V6 — Tree-Select Entry Screen

**Purpose.** First-touch screen. Pick a workflow, point at a project, watch pre-scan, see suggested roles, proceed.

### Flow (UX phases)

| Phase                | UI                                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| 1. Path input        | Single `pc-input pc-mono` 40px tall with `folder` left-icon · default `~/work/acme-shop` + "폴더 찾기" button |
| 2. Pre-scan (auto)   | Triggers on path change, 800ms debounce (description) / 1100ms simulated timeout in code. Spinner appears. |
| 3. Scan banner       | `1px border, radius, --pc-bg-subtle`. On `scanning`: spinner + "스캔 중…" + `분석: 247 files`. On `scanned`: green dot + "스캔 완료" + chip rail (lang/framework/domain/pkg) + 재스캔 button |
| 4. Tree grid         | 5-up grid of workflow tiles, single-select                                                       |
| 5. Suggested roles   | Always visible below grid (updates based on `{domain} × {selected tree}`)                         |
| 6. CTA               | bottom-right `취소` + `계속하기` (`pc-btn-primary pc-btn-lg`, disabled until `scanned`)            |

### Layout

```
┌── Top bar 44 (logo + PromptCraft + v2.4 · localhost:3000) ────────────┐
│ scroll · padding 40 56 · max-width 880 centered                       │
│                                                                        │
│ STEP 01 · NEW PROMPT (mono 11.5 uppercase muted)                      │
│ H1 36/600 letter-spacing -0.8 "어떤 작업을 도와드릴까요?"              │
│ P 14 secondary max-width 580                                          │
│                                                                        │
│ ── 프로젝트 경로  · 입력 후 800ms 자동 스캔                            │
│ ┌ pc-input 40 + 폴더찾기 btn ──────────────────────┐                  │
│ │ [folder]  ~/work/acme-shop                       │                  │
│ └──────────────────────────────────────────────────┘                  │
│ ┌ scan banner 1px border --pc-bg-subtle ───────────┐                  │
│ │ ● 스캔 완료 · lang: TypeScript · framework: Next.js 14 · domain: web-frontend · pkg: bun · 재스캔 │
│ └──────────────────────────────────────────────────┘                  │
│                                                                        │
│ ── 상황 유형 선택                                                      │
│ ┌── 5-column grid · gap 10 ────────────────────────────────────────┐ │
│ │ [TILE] [TILE] [TILE] [TILE] [TILE]                              │ │
│ │ 142h ea, padding 14 14, radius --pc-radius-md                   │ │
│ │ selected: border --pc-fg, bg --pc-bg-muted, ring 3px --pc-bg-muted │
│ │           accent check chip top-right (16×16, --pc-accent)      │ │
│ │ each tile: 28×28 icon tile + label 13/600 + sub 11 muted +      │ │
│ │            "N cards" mono 10 uppercase                          │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ ┌ suggested roles tile · 14 16 · --pc-bg-subtle ───────────────────┐ │
│ │ 추천 역할 · web-frontend × error-solving                          │ │
│ │ [pill] [pill] [pill] [pill] [pill]   (5 chips, radius 999)        │ │
│ └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ flex-end:  [취소]   [계속하기 →]  (lg primary, disabled if !scanned)  │
└────────────────────────────────────────────────────────────────────────┘
```

### Numbers

| Region                  | Size                                          |
| ----------------------- | --------------------------------------------- |
| Top bar                 | height `44px`, padding `0 18px`               |
| Scroll padding          | `40px 56px`                                   |
| Content max-width       | `880px`                                       |
| H1                      | `36/600`, letter-spacing `-0.8`, line-height `1.1` |
| Subtitle paragraph      | `14`, max-width `580px`, margin-bottom `32px` |
| Path field row gap      | `8px`                                         |
| Path input              | `pc-input pc-mono`, height `40`, fontSize `13`, paddingLeft `34` |
| Scan banner             | padding `10px 14px`, gap `14`, fontSize `12`  |
| Tree grid               | `repeat(5, 1fr)`, gap `10`                    |
| Tree tile               | `padding: 14 14`, `min-height 142`, radius `--pc-radius-md` |
| Tree icon tile          | `28 × 28`, radius `6`                         |
| Selected indicator chip | `16 × 16`, radius `8`, top `10`, right `10`, bg `--pc-accent` |
| Suggested-role tile     | padding `14 16`, radius `--pc-radius-md`, border `1px --pc-border`, bg `--pc-bg-subtle` |
| Role pill               | padding `4 10`, border `1px --pc-border`, radius `999`, fontSize `11.5`, bg `--pc-bg` |
| CTA row                 | justify flex-end, gap `8`                     |

### Spinner

`12 × 12`, border `2px solid var(--pc-border)`, `border-top-color: var(--pc-accent)`, `animation: spin 0.8s linear infinite` (keyframes injected inline via `<style>{@keyframes spin {to{transform: rotate(360deg)}}}`).

### Default state in demo

- `path = '~/work/acme-shop'`
- `selected = 'error-solving'`
- `scanning = false; scanned = true` (initial render)
- `useEffect` on `path`: sets scanning, clears 1100ms later

## Cross-variation matrix

| Aspect                  | V1            | V2                  | V3                | V4                  | V5                  |
| ----------------------- | ------------- | ------------------- | ----------------- | ------------------- | ------------------- |
| Card form               | outlined card | filled card         | inline doc block  | table row           | outlined panel + 3px rail |
| Pool surface            | inline strip  | left sidebar list   | inline strip (5)  | inline strip dense  | dashed tile         |
| Preview                 | right pane 40%| right pane 440      | (absent — doc is) | terminal pane 460   | slide-out 420       |
| ActionBar               | preview footer| top bar             | right rail btns   | preview footer      | top bar             |
| Stepper / progress      | —             | —                   | —                 | —                   | top stepper · 5     |
| Command palette         | —             | —                   | —                 | ⌘K modal (open)     | —                   |
| Best for                | balanced edit | discoverability     | editorial focus   | power user / kb     | onboarding          |
