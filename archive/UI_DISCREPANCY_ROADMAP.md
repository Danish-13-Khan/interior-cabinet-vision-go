# Interiors UI Discrepancy Roadmap

**Status:** Phase 0–2 complete  

**Branch:** `codex/planner-ui-v2`  
**Source:** Live UI audit (Home → Build → Design → Review) + CSS cascade review, Aug 26 2026  
**Related:** `docs/PHASE_7_V2_RESPONSIVE_HARDENING.md`, `docs/PLANNER_UI_V2_WORKFLOW.md`

## Verdict

The new `src/styles/planner-responsive.css` fights Build-mode layout rules in
`src/styles/planner-home.css`. Combined with leftover light-theme rem styles
from `interiors-product.css` / `living-room-plan.css`, Build is the weakest
surface: tiny labels, clipped inspector chrome, and a broken compact rail.

## Phases

### Phase 0 — Unblock (do first)

Stop visual breakage on the current branch.

| ID | Task | Primary files | Done |
| --- | --- | --- | --- |
| C1 | Deduplicate breakpoints into one source of truth (`planner-responsive.css`). Remove overlapping `@media` blocks from `planner-home.css`. | `src/styles/planner-responsive.css`, `src/styles/planner-home.css` | [x] |
| C2 | Fix Build icon-rail specificity war: at ≤1180px rail is 84px but Build button stays `font-size: 20px` / `min-height: 106px`. Compact/icon rules must also cover `.is-planner-build`. | `src/styles/planner-home.css`, `src/styles/planner-responsive.css` | [x] |
| C3 | Raise Build dimension labels (Width / Depth / Height) to readable V2 sizes (≥12–13px) with dark muted color. Today they compute to ~5.75px `#69717a`. | `src/styles/planner-home.css` (or V2 token overrides) | [x] |

**Exit criteria**

- [x] One responsive breakpoint ladder for V2 widths.
- [x] At 1100px Build rail, buttons are icon-sized (not overflowing).
- [x] Dimension labels are readable on the dark Build panel.

### Phase 1 — Consistency

One mode model and one type scale inside the V2 shell.

| ID | Task | Primary files | Done |
| --- | --- | --- | --- |
| C4 | Sync brand / project-home open with `plannerMode === "project"` (route through `changePlannerMode("project")`). Today brand opens home while step stays on Review. | `src/components/LivingRoomPlanWorkspace.tsx`, `src/components/livingRoomPlan/InteriorsProductHeader.tsx` | [x] |
| C5 | Fix inspector truncation (“0 sel…”). Cap V2 inspector header font; allow wrap/shrink; reserve space for selection count. | `src/styles/planner-ui-v2.css`, `src/styles/planner-home.css`, inspector header markup if needed | [x] |
| C6 | Quarantine light rem / white `inspector-header` leakage inside `.lr-product-shell-v2`. V2 must own catalog + inspector type and colors (including wall tabs). | `src/styles/planner-ui-v2.css`, `src/styles/interiors-product.css`, `src/styles/planner-home.css` | [x] |
| C7 | In Review/render mode, give 2D/3D an honest active state (map render → 3D, or add a third control). Restyle quality cards from blue active border to V2 green. | `src/components/livingRoomPlan/InteriorsProductHeader.tsx`, render settings CSS | [x] |

**Exit criteria**

- [x] Brand click highlights step 1 and sets `is-planner-project`.
- [x] Inspector selection text does not ellipsize at desktop widths ≥1280.
- [x] No white inspector chrome or sub-10px rem labels in V2 Build/Design panels.
- [x] Render mode shows a clear active view control; quality selection uses green.

### Phase 2 — Polish

Copy clarity and cross-shell decisions.

| ID | Task | Primary files | Done |
| --- | --- | --- | --- |
| C8 | Clarify object counts vs openings (“0 furniture objects”). Make Build empty state explicitly wall-scoped (“No doors or windows on selected wall”). | plan titlebar / catalog rail copy | [x] |
| C9 | Decide Cabinets CAD shell vs Interiors V2: keep intentional split, or share tokens for header density / save / view controls. Document in `docs/PRODUCT_DECISIONS.md`. | docs + optional shared tokens | [x] |
| C10 | Cabinet Library search placeholder should say “Search cabinets…” (not “Search furniture…”). | `src/components/livingRoomPlan/LivingRoomPlanCatalogRail.tsx` | [x] |

**Exit criteria**

- [x] Copy matches visible plan entities.
- [x] Product decision recorded for shell split.
- [x] Search placeholder matches active library panel.

## Breakpoint conflict matrix (current)

Import order: `planner-home.css` → … → `planner-responsive.css` (later wins equal specificity).

| Viewport | planner-home | planner-responsive | Actual winner today |
| --- | --- | --- | --- |
| ≥1500 | Build rail 190 / cat 310 / insp 350 (base) | rail 160–180 / cat 285 / insp 340 | responsive widths |
| ≤1499 | no rule until 1320 | rail 140 / cat 250 / insp 300 | responsive; Build buttons still 106px |
| ≤1320 | rail 170 / cat 260 / insp 310 | still ≤1499 rules | responsive (later import) |
| ≤1180 | inspector visible until 1050 | inspector hidden; rail 84 icon mode | responsive hide; Build icon mode broken |
| ≤1050 | inspector `display:none` | already none | redundant |
| ≤860 / 820 | home stacks @820 | studio hidden @860; plan `min-width: 520` | split / horizontal scroll risk |

## Suggested implementation order

1. Phase 0 CSS only (C1 → C2 → C3) — shippable visual fix, low behavior risk.
2. Phase 1 mode + type (C4 → C6 → C5 → C7).
3. Phase 2 copy/product (C10 → C8 → C9).

## Verification checklist

- [x] Home: create/open project; brand returns to step 1 with mode synced.
- [x] Build @ 1920 / 1440 / 1280 / 1100 / 860: rails, labels, inspector behavior match the single breakpoint ladder.
- [x] Design: cabinets/furniture libraries; correct search placeholder.
- [x] Review: active view control, green quality selection, no mode desync after brand → home → return.
- [ ] `npm test` and production `npm run build` pass after each phase.

## Notes for development

- Prefer editing `planner-responsive.css` + thin V2 overrides in `planner-home.css`; avoid growing `planner-ui-v2.css` / `planner-reference.css` further.
- Do not reintroduce classic light rem sizes under `.lr-product-shell-v2`.
- Classic Cabinets workspace stays unchanged per C9 (intentional chrome split).
