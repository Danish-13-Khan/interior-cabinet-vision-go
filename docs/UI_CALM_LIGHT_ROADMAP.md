# Calm Light UI roadmap

**Status:** Proposed — 2026-09-28
**Scope:** Public website, sign-in, projects home, the Interiors editor
(Room → Cabinets → Materials → Review → Present) and Engineering Review.
**Relationship to other docs:** Carries forward the workflow in
[`UI_WORKFLOW_REDESIGN.md`](UI_WORKFLOW_REDESIGN.md) and does not change any
behaviour, command, or data contract listed in its preservation map. This
roadmap changes appearance, layout and one set of options (the Compact mode).

---

## 1. Decisions

| # | Decision | Consequence |
| --- | --- | --- |
| D1 | **One layout: Calm.** Compact is removed everywhere. | Delete the Calm/Compact switch from the website header, the hero, and the editor header. A stored `compact` preference silently becomes `calm`. |
| D2 | **One light theme** for website, auth, projects home, editor, and engineering. | No dark marketing pages and no dark projects home. The 3D stage is also light. |
| D3 | **The website hero is a 3D animation**, not a static picture. | The showroom plays automatically, shows a believable kitchen run assembling, and falls back to a still image when 3D is unavailable. |
| D4 | **Readable type.** Minimum on-screen text is 12px; controls 13px; body 14px. | The root font size moves from 11.5px to 16px and all `rem` sizes are re-based. |
| D5 | **One product name: Cabinet Studio.** | "Cabinet Planner" is removed from the website header, footer, page title, and loading text. |

## 2. Evidence from the 2026-09-28 review

- Editor text measured at **7px** for 42 of 72 visible labels. Cause: the root
  font is `11.5px` (`src/styles/tokens-shell.css:120`) and the most common rule is
  `font-size: 0.58rem` (64 uses), with many at `0.48–0.56rem`.
- Styling is spread over **101 CSS files** with **~1,060 distinct hex colours**
  and **95 `!important`** overrides. Several files exist only to patch earlier
  ones (`interiors-contrast-overflow.css`, `interiors-materials-contrast.css`,
  `cad-shell-compress.css`, `phase-*` files).
- Two themes co-exist: a dark marketing site (`src/marketing/marketing.css`) and a
  blue-gray CAD shell (`tokens-shell.css`), plus `planner-ui-v2-tokens.css`.
- Compact mode lives in `src/marketing/themes/compact/`,
  `src/marketing/lib/theme.tsx`, `InteriorsCompactProjectsHome.tsx`,
  `interiors-ui-modes-projects-compact.css`, and the `uiMode` prop in
  `LivingRoomPlanWorkspace.tsx` / `InteriorsWorkspaceHeader.tsx`.
- Projects home template names are `rgb(36,48,41)` on a dark card at 9px — invisible.
- 3D and Present open looking at the outside of a wall; the cabinet run is hidden.
- Mobile website nav overflows at 375px with no menu button.
- Pricing shows "Paid /mo" with no amount.

## 3. Calm Light design system

One token file, `src/styles/tokens.css`, is the only place colours, type,
spacing, radius and shadow are defined. Every other file uses `var(--…)`.

### 3.1 Colour

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#F7F6F2` | App and page background (warm paper) |
| `--surface` | `#FFFFFF` | Panels, cards, inspector |
| `--surface-2` | `#F1EFE9` | Toolbars, grouped rows, hover |
| `--border` | `#E3E0D8` | Dividers and card edges |
| `--border-strong` | `#CFCAC0` | Inputs, focused panels |
| `--ink` | `#1F2421` | Primary text |
| `--ink-muted` | `#5D655F` | Secondary text (≥ 5.5:1 on white) |
| `--ink-faint` | `#8A918B` | Placeholder, disabled (never for required info) |
| `--accent` | `#3F6B52` | Primary buttons, selection, links (sage) |
| `--accent-hover` | `#345A45` | Primary hover |
| `--accent-soft` | `#E4EEE7` | Selected rows, active tab fill |
| `--wood` | `#A0714B` | Brand warmth: logo mark, 3D highlight, illustrations |
| `--info` | `#2F6690` | Neutral notices, dimension lines |
| `--warning` | `#9A6212` / soft `#FBF1DE` | Review warnings |
| `--danger` | `#B3412E` / soft `#FBE7E3` | Blocking issues, delete |
| `--canvas` | `#FBFAF7` | 2D plan paper |
| `--stage` | `#EEF0EC` → `#FFFFFF` gradient | 3D viewport and website showroom background |
| `--focus` | `0 0 0 3px rgba(63,107,82,.35)` | Focus ring |

Contrast rule: text colours must reach 4.5:1 on the surface they sit on; this is
checked in CI (Phase 8).

### 3.2 Type

- Families: **IBM Plex Sans** (UI and website) and **IBM Plex Mono**
  (dimensions, prices, part codes). Remove Avenir Next.
- Root: `html { font-size: 16px }`.

| Token | Size / line | Use |
| --- | --- | --- |
| `--text-xs` | 12 / 16 | Captions, badges — the minimum |
| `--text-sm` | 13 / 18 | Buttons, inputs, inspector labels, toolbars |
| `--text-md` | 14 / 20 | Body, list rows |
| `--text-lg` | 16 / 24 | Panel titles |
| `--text-xl` | 20 / 28 | Workspace titles |
| `--text-2xl` | 28 / 34 | Website section headings |
| `--text-hero` | clamp(40px, 6vw, 64px) | Website hero only |

### 3.3 Space, shape, depth

- Spacing: `4, 8, 12, 16, 24, 32, 48, 64`.
- Radius: controls `8px`, cards and panels `12px`, dialogs `16px`, pills `999px`.
- Shadows: `--shadow-1` (cards) `0 1px 2px rgba(31,36,33,.06), 0 1px 1px rgba(31,36,33,.04)`;
  `--shadow-2` (menus, floating panels) `0 8px 24px rgba(31,36,33,.10)`.
- Control heights: 32px (default), 28px (dense toolbars), 40px (primary actions,
  website buttons). Hit area never below 28px.

### 3.4 Components (single implementation each)

Button (primary / secondary / ghost / danger), IconButton, SegmentedControl,
Tabs, Field (label + input + unit suffix + hint), NumberField with mm suffix,
Select, Card, Panel with collapsible sections, Badge, Toast, Dialog, Popover,
EmptyState, Tooltip. No third-party UI library (keeps the README stack contract).

## 4. Target layouts

### 4.1 Website (one page, light)

```text
┌ Header (sticky, white, blurred) ────────────────────────────────┐
│ ▮ Cabinet Studio   How it works  Features  Templates  Pricing   Log in [Start free] │
└─────────────────────────────────────────────────────────────────┘
│ Hero: headline + subline + [Start free] [Watch the run]   │  3D showroom (autoplay) │
│ How it works (4 steps, each with a small looping 3D/2D clip)                       │
│ Golden run (plan → 3D → proposal → shop, scroll-linked)                            │
│ Features (6 cards)                                                                 │
│ Templates (6 plan cards, click → register with template preselected)              │
│ Pricing (3 plans with real prices or "Talk to us")                                │
│ Final CTA band · Footer                                                            │
```

Phone (< 768px): header collapses to logo + menu button opening a sheet; the
showroom sits under the headline at 4:3; controls become a single row of icon
buttons.

### 4.2 App shell (every workspace)

```text
┌ Top bar 48px ─────────────────────────────────────────────────────────────┐
│ ▮ Cabinet Studio │ Job name · Rev A ▾ │ ①Room ②Cabinets ③Materials ④Review ⑤Present │ ↶ ↷ Saved ✓ [Present] │
├───────┬───────────────────────────────────────────────┬───────────────────┤
│ Tool  │ Canvas header: 2D | 3D | Split   · view tools │ Inspector 320px   │
│ rail  │                                               │ (collapsible)     │
│ 64px  │           Plan / 3D stage                     │                   │
│       │                                               │                   │
├───────┴───────────────────────────────────────────────┴───────────────────┤
│ Status bar 28px: units · snap · selection · validity                       │
└────────────────────────────────────────────────────────────────────────────┘
```

- Workflow steps live in the top bar as numbered steps with a done/active/blocked
  state; the separate second row of tabs is removed.
- Left rail content changes by step (Room: draw tools; Cabinets: library;
  Materials: finishes; Review: issue list; Present: client & price).
- One canvas header holds view switching and view tools. No toolbars float over
  the model except a small bottom-centre camera control.
- Inspector is always on the right, 320px, sections collapsed except the first.

## 5. Phases

Each phase ends with its exit gate. Phases 1 and 2 can run in parallel once
Phase 0 is merged.

### Phase 0 — Foundation (tokens, type, Compact removal)

1. Add `src/styles/tokens.css` (section 3) and import it first in `main.tsx`.
2. Set `html { font-size: 16px }`; convert fractional `rem` rules in
   `src/styles/**` and `src/App.css` to the type tokens (script-assisted:
   `0.48–0.62rem → --text-xs`, `0.64–0.78rem → --text-sm`, larger → nearest token).
3. Map legacy variables (`--ink`, `--panel-bg`, `--planner-v2-*`, …) to the new
   tokens in one alias block so existing files keep working during migration.
4. Remove Compact:
   - Delete `src/marketing/themes/compact/`, `CompactAppHome`, `CompactLanding`.
   - Reduce `ThemeId` to `'calm'`, drop `toggle`, and remove the theme switcher
     from header and hero (`marketing.css` `.theme-switcher*`).
   - Remove `uiMode` prop threading and `data-ui-mode` in
     `LivingRoomPlanWorkspace.tsx`, `InteriorsWorkspaceHeader.tsx`,
     `LivingRoomPlanHomeShell.tsx`, `PlannerV2ProjectHome.tsx`.
   - Delete `InteriorsCompactProjectsHome.tsx` and
     `interiors-ui-modes-projects-compact.css`; merge needed rules from
     `interiors-ui-modes*.css` into their component files.
   - Read-time migration: a stored `compact` value becomes `calm`.
5. Rename "Cabinet Planner" to "Cabinet Studio" (index.html title, router
   fallback text, marketing header/footer).
6. Add `scripts/ui-lint/check-styles.mjs` (run in `npm test`): fails on
   `font-size` below 12px, raw hex colours outside `tokens.css`, and new
   `!important`.

**Exit gate:** no 'compact' string in `src/` outside the migration; smallest
rendered text in the editor ≥ 12px; golden-run e2e still green; style lint in CI.

**Implementation notes (Phase 0):**
- The Compact *layout mode* is gone. Unrelated `compact` density props on
  individual widgets (render diagnostics, swatch grid, cabinet tree) remain.
- Stored `compact` values are rewritten at boot by
  `src/domain/desktopUx/layoutPreferenceMigration.ts`.
- Marketing palette variables are scoped to `.cs-marketing` (dark until Phase 1)
  so they cannot override `tokens.css`.
- SVG drawing text (rules that set `fill`/`stroke`) and `@media print` keep their
  sizes; the lint skips them.
- Raw hex and `!important` are ratcheted per file via
  `scripts/ui-lint/baseline.json`; lower it with `--write-baseline`, never raise it.
- `interiors-ui-modes*.css` were renamed (`interiors-workbar.css`,
  `interiors-authoring-surfaces.css`, `interiors-present-panel.css`) rather than
  merged, because the target component files already exceed 200 lines.
- Still open for later phases: the File menu "dark frame" appearance (conflicts
  with D2).

### Phase 1 — Website: light Calm + 3D hero animation

1. Rebuild `CalmLanding` on light tokens; drop the dark palette in `marketing.css`.
2. Sticky header with a phone menu sheet; fix the 375px overflow.
3. **3D showroom upgrade** (`src/marketing/showroom/`):
   - Scene: a straight 3.0m base + wall run with tall pantry, countertop,
     plinth, handles, backsplash, floor and a soft back wall; light stage
     background (`--stage`), warm key light, soft contact shadows.
   - Materials: reuse the product's procedural wood / painted / stone recipes so
     the site shows the real renderer, not boxes.
   - Timeline (≈ 8s, loops with a 3s hold): empty floor → carcasses rise in
     sequence → doors and drawer fronts slide on → countertop drops → one drawer
     opens → camera slow orbit 20°. Driven by `motion.ts` so it is testable.
   - Autoplay when in view on capable devices; pause when off screen or tab
     hidden; keep palette buttons (Oak · White · Walnut) and a single
     Replay button; drag to orbit.
   - Fallback: poster image rendered from the same scene at build time;
     `prefers-reduced-motion` shows the finished still with a play button.
   - Budget: 3D chunk ≤ 250 KB gzip, lazy after first paint, ≥ 50 fps on a 2020
     MacBook Air, LCP ≤ 2.5s (the headline is LCP, not the canvas).
4. Section motion: gentle fade/translate on scroll (CSS only, disabled for reduced
   motion); the Golden-run strip animates plan → 3D → proposal → shop as it scrolls.
5. Pricing shows real amounts or "Talk to us"; template cards open Register with
   the template preselected.
6. Login and Register pages on the same light layout.

**Exit gate:** Lighthouse ≥ 90 performance and accessibility on desktop and
mobile; no horizontal scroll at 360–1440px; animation verified in Chromium,
Safari and Tauri WebView; still fallback verified with WebGL disabled.

**Implementation notes (Phase 1):**
- `marketing.css` is now an `@import` barrel over `src/marketing/styles/*` (tokens
  only, zero raw hex); the only `!important`s left are the scroll unlock, which now
  uses `overflow-x: clip` on body/#root so the sticky header works.
- Landing lives in `src/marketing/landing/`; the old `themes/` folder, `AppTopbar`
  and `CalmAppHome` are deleted. Login and Register share `AuthLayout`.
- Showroom: `layout.ts` (part list), `motion.ts` (8 s build + 3 s hold, stages,
  camera sweep), `materials.ts` (product wood/paint recipes), `sceneBuild.ts`,
  `createScene.ts` (loop / once / still), `autoplay.ts` (start policy).
- Poster: `npm run poster:showroom` renders `public/marketing/showroom-poster.png`
  from `/?showroom=poster`; the page falls back to the L-kitchen thumbnail if missing.
- Pricing shows "Talk to us" until `pricingPlans.ts` has real amounts.
- Template cards link to `/register?template=<catalog id>`; the template id is not
  yet carried into project creation (registration is still "Coming soon").

### Phase 2 — App shell and projects home

1. Implement the shell in 4.2: single top bar with workflow steps, save state,
   undo/redo, Present.
2. Projects home on light surfaces: "Continue" list with thumbnails, a template
   grid with visible names (14px ink on white), "New job" as the primary action.
3. Consistent buttons in the top bar (one style, one height).
4. Remove the second tab row and move File / Project tools into the job menu ▾.

**Exit gate:** a first-time tester reaches the Room step from the projects home
without help; every top-bar control ≥ 32px high.

**Implementation notes (Phase 2):**
- The separate workflow tab row is gone; `InteriorsWorkflowNav` renders numbered
  steps inside the top bar. Step state (done / to do / blocked) comes from
  `domain/desktopUx/interiorsWorkflowSteps.ts`; navigation stays free.
- The File button became the job menu ▾ beside the job name (Project tools, Open,
  Save, Export JSON, Keyboard shortcuts). Project tools opens via
  `InteriorProjectToolsLauncher`.
- "Dark frame" canvas appearance is retired (D2); stored values read as light.
- Shell styling lives in `styles/app-shell.css` and `styles/app-shell-home.css`,
  scoped by the new `.app-shell` class so no `!important` is needed.
- The 2D / 3D switch stays in the top bar until Phase 3 builds the canvas header.

### Phase 3 — Room step (2D plan)

1. Canvas header: view switch, Measure, Calibrate, Layers, Units, Grid, Snap, Export
   sheet — same button component, same size; Export sheet becomes secondary.
2. Label collision avoidance for reference dimensions and cabinet tags
   (offset/stack along the wall; hide low-priority refs at low zoom).
3. Plan colours from tokens: paper `--canvas`, walls `--ink`, cabinets
   `--accent` outline with `--accent-soft` fill, selection `--info`.
4. Room & plan settings move into the inspector when nothing is selected.

**Exit gate:** golden-run plan at 100% zoom has zero overlapping labels
(automated bounding-box test).

**Implementation notes (Phase 3):**
- Label layout is pure domain code: `livingRoom/planLabelBoxes.ts` (text boxes,
  overlap count), `planLabelLayout.ts` (greedy placement by priority, hides
  labels with no clear spot or below a readable size at low zoom) and
  `planReferenceLabels.ts` (reference dims slide along / stack beside their line,
  cabinet tags are obstacles). `planReferenceLabels.test.ts` is the exit gate on
  the golden run; dims whose label is hidden are not drawn.
- `styles/app-canvas-header.css` gives every header control (tools, Layers,
  Export sheet, zoom, Grid, Snap, contextual commands) one secondary button at
  `--control-h`; Export sheet is secondary.
- `interiors-drafting-plan.css` now uses tokens only: paper `--canvas`, walls
  `--ink`, cabinets `--accent` on `--accent-soft`, selection `--info`.
- Room & plan settings portal into the inspector (`InspectorPlanSettingsSlot`)
  while it shows room essentials; with a selection they stay above the canvas.
- The 2D / 3D switch remains in the top bar; the canvas header keeps view tools.

### Phase 4 — 3D view and Present

1. **Default camera frames the cabinet run**: target = run bounds, camera from
   the room interior at 35° elevation; the wall in front of the camera is hidden
   or cut away (dollhouse cutaway on by default).
2. Present uses a dedicated "client" camera with all near walls hidden, light
   stage, and the run filling ~70% of the frame.
3. Overlay clean-up: view presets move into the canvas header; Paints/drawer
   controls into the inspector; the style picker into the Materials step; the
   onboarding "How would you like to explore?" shows once per install.
4. One small bottom-centre camera control (orbit / walk / reset).

**Exit gate:** on opening 3D and Present for the golden run, every cabinet in
the run is visible in the first frame (screen-space bounds test).

**Implementation notes (Phase 4):**
- Framing is pure domain code: `livingRoom/sceneNodeBounds.ts` (cabinet AABBs),
  `cameraScreenBounds.ts` (project a box to screen) and `cabinetRunFrame.ts`
  (camera from the room interior, 35° author / 22° client, distance refined to
  ~70% fill, cutaway sides). `cabinetRunFrame.test.ts` is the exit gate.
- `buildCameraRigGoal` takes `frameRun`: authors get the run frame on Dollhouse,
  Present and client capture always use it (walls away from the run hidden,
  ceiling off, light stage `MODEL_VIEW_STAGE_COLOR`). Dollhouse cutaway is on by
  default. Fit Room still fits the whole room.
- Chrome: view presets portal into the canvas header (`CanvasHeaderToolsSlot`),
  Fronts and the style picker portal into the inspector
  (`InspectorModelExtrasSlot`; the style picker only on the Materials step), the
  3D guide shows once per install, and `ModelViewCameraDock` is the bottom-centre
  Orbit / Walk / Reset control (Reset = fit mode `run`).
- `styles/app-stage.css`: full-height canvas host, `--stage` background, light
  readout and scene-health pill.
- `LivingRoomModelView.tsx` is still above 200 lines (pre-existing); Phase 8
  splits it.

### Phase 5 — Cabinets and Materials steps

1. Library cards with real thumbnails generated from the product renderer
   (extend `npm run catalog:generate`); no "No preview".
2. Inspector order: Identity → Size (W/H/D) → Position → Finishes → Construction
   → Run; only Size open by default.
3. Object list moves to a collapsible "Scene" section in the left rail.
4. Materials: swatch grid with names, applied state and a live 3D preview.

**Exit gate:** every catalogue item has a thumbnail; the inspector for a selected
cabinet fits 900px height with only Size expanded.

### Phase 6 — Review step

1. Group issues by cabinet and type ("3 cabinets: shelf span > 800mm").
2. Clicking an issue selects the cabinet and frames it in 2D/3D.
3. Summary bar: Blocking · Warnings · Ready, with the proposal gate as a single
   checklist.

**Exit gate:** golden-run review list ≤ 10 rows grouped; every row selects its object.

### Phase 7 — Engineering Review and production outputs

Apply the same shell, tokens and inspector patterns to
`EngineeringReviewWorkspace`, cutlist, drawing sheets and report center. Drawing
sheets and PDFs keep their print styles (black on white) — only the chrome changes.

**Exit gate:** engineering handoff e2e green; visual baseline approved.

### Phase 8 — CSS consolidation and quality gates

1. Collapse the 101 style files into: `tokens.css`, `base.css`, `components/*.css`
   (one per shared component) and one file per workspace. Delete `phase-*`,
   `*-contrast*`, `cad-shell-compress.css` after their rules are merged.
2. Zero `!important` except focus-visible.
3. Playwright visual baselines for: website (desktop, phone), projects home,
   each workflow step, Present, Engineering Review.
4. Automated axe contrast/a11y check on the same pages.
5. Update `README.md` and `UI_WORKFLOW_REDESIGN.md` to point here as the
   appearance source of truth.

**Exit gate:** `npm run release:check` green with style lint, visual baselines
and axe checks included.

## 6. Order and rough size

| Phase | Depends on | Size |
| --- | --- | --- |
| 0 Foundation | — | M |
| 1 Website + 3D hero | 0 | L |
| 2 App shell + projects home | 0 | M |
| 3 Room / 2D | 2 | M |
| 4 3D + Present | 2 | M |
| 5 Cabinets + Materials | 2 | M |
| 6 Review | 2 | S |
| 7 Engineering | 2 | M |
| 8 Consolidation + gates | 1–7 | M |

## 7. Not changing

- `InteriorProject` schema, commands, undo/redo, pricing and engineering data.
- Keyboard shortcuts and command palette entries.
- Print/PDF drawing styles.
- Offline-first behaviour; the website 3D uses local procedural assets only.
