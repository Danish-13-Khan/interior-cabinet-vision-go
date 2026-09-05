# 2D Interior & Cabinet Planning — Consolidated Product Roadmap

**Document role:** Active roadmap for Interiors 2D plan authoring  
**Product relationship:** Companion to [Cabinet Studio Product and Development Book](./CABINET_STUDIO_PRODUCT_BOOK.md) §15 and the measure → room → run → proposal buyer workflow  
**Baseline date:** 2026-09-05  
**Revised:** 2026-09-05 (consolidated product review)  
**Branch:** Prefer a single epic branch `feat/2d-plan-layer` for Phases 0–4  
**Constraint:** `STR-004` — do not claim category parity with Floorplanner, Planner 5D, or RoomSketcher  

Status vocabulary: `CURRENT` · `NEXT` · `LATER` · `EXCLUDED` · `Implemented`

---

## 1. Product purpose

The 2D editor should **not** become another general-purpose Floorplanner, RoomSketcher, Planner 5D, or CAD application.

Its primary job is to help a cabinet/interior salesperson move quickly and reliably through:

```text
Measure → Recreate Room → Validate → Place Openings → Design Cabinet Run → Validate Fit → 3D → Proposal
```

The larger product eventually becomes:

```text
Measure → Design → Visualize → Sell → Engineer → Manufacture
```

The 2D layer is therefore the **source of dimensional truth** for everything downstream.

---

## 2. North star

A salesperson can enter a measured room quickly, create a credible cabinet run, and trust the resulting plan without fighting navigation, dimensions, snapping, or underlays.

### Primary success metric

**New Job → Room + Door/Window + First Cabinet Run < 10 minutes** for a normal straight kitchen.

### Secondary target

Once the room exists: **Completed Room → Credible First Cabinet Run < 3 minutes**.

### UX test

A salesperson unfamiliar with the product should be able to create:

**Room → Door → Window → Base Cabinet Run**

without asking:

- How do I zoom?
- How do I pan?
- How do I change this measurement?
- Why won't this cabinet snap?
- Which wall moved?
- How do I undo this?
- Does this cabinet actually fit?

---

## 3. Core product principle

**2D is not just drawing.**

Everything placed on the plan should represent meaningful project data.

A cabinet is not simply “rectangle 600 × 560”. It represents base/wall/tall type, W/H/D, carcass, shutters, material, finish, hardware, toe kick, run membership, and more.

The same `InteriorProject` data should ultimately drive:

**2D + 3D + Pricing + Proposal + BOM + Cut List + Production**

Do not maintain separate project representations for these workflows.

---

## 4. What already exists — don't rebuild (`CURRENT`)

| Area | Notes |
| --- | --- |
| Rooms | Rectangle + polygon |
| Walls | Topology, split/join |
| Openings | Doors/windows attached to walls |
| Millwork | Placement, snap, runs, fillers, corners, validation |
| Chrome | Units, grid, starters, basic underlay |
| Export | SVG/PDF plan generation |

The geometry foundation is already substantial.

**Next investment:** Feel + Measure + Trust + Present — not rebuilding geometry.

---

## 5. Phase 0 — Stabilize

**Estimate:** 1–2 weeks  
**Status:** `Implemented` (2026-09-05 on `feat/2d-plan-layer`) — **0.1 follow-up fixed** (e2e shell entry standardized via `createShellPlan` across suites; ConfirmDialog testIds; merge-block UX; CAB-046; golden path + production editor-history delete/merge undo coverage; room rename uses in-app PromptDialog)

Before adding major UX capabilities, remove reliability issues from the Golden Cabinet Run.

| ID | Item | Notes |
| --- | --- | --- |
| 0.1 | Multi-room / hole-room handling | Clear actionable error instead of dead-end; `explainInteriorRoomMergeBlock` + merge blocked UI (**follow-up:** all adjacent block reasons; e2e shell entry via `createShellPlan` across suites) |
| 0.2 | Replace browser dialogs | `window.confirm` delete/merge → in-app `ConfirmDialog`; cabinets room rename → `PromptDialog` (no `window.prompt` on that path) |
| 0.3 | Golden Kitchen regression | Vitest path: draw → openings → cabinet run → fine-grained undo + serialize/reparse (`goldenKitchenPlanPath.test.ts`) |
| 0.4 | Label overlap | Declutter plan object labels at dense layouts (`CAB-046`); dense non-selected cabinets prefer `name` over blank runs |
| 0.5 | Undo/Redo reliability | Foundational; geometry, cabinets, openings, move, delete/merge stay predictable — **harden continuously** (not fully done); production `editorHistoryCore` / `useEditorHistory` covers delete/merge undo (plus domain-only granularity in `roomOperations.test.ts`); extend as Phases 1–3 land |

### Phase 0 exit

The Golden Cabinet Run workflow should be **boringly reliable**. Continuous undo hardening remains in progress beyond the Phase 0.1 follow-up. Playwright suites enter the wardrobe shell through `createShellPlan` (`tests/e2e/plannerStart.ts`), which expands More room starters / Quick start templates before clicking Wardrobe wall.

---

## 6. Phase 1 — Precision Canvas ★

**Estimate:** 3–5 weeks  
**Status:** `Mostly implemented` (2026-09-05 on `feat/2d-plan-layer`) — core navigation, selection, measure, typed wall length, driving/reference dims, labelled snap guides shipped. Pointer/coords follow-ups landed (floor marquee, measure-vs-drag, CTM mapping, on-demand grid, room-scoped snaps); polish remaining (pinch feel, more reference dim kinds, room overall typed dims)

Make the 2D canvas feel like a professional planning tool.

### 6.1 Navigation — `Implemented`

- Mouse-wheel zoom toward cursor (`usePlanCanvasNavigation` + viewBox)
- Trackpad pinch zoom via `ctrl+wheel`
- Space + drag pan, middle-mouse pan
- Zoom-to-fit / Zoom-to-selection (toolbar + Draw Room titlebar Fit / Fit sel; shortcuts `F` / `Shift+F`, `Cmd/Ctrl+0`)
- Persist view while editing; re-fit on project/room `fitKey` change

### 6.2 Selection — `Implemented`

- Click → select; Shift/Cmd/Ctrl-click → multi-select
- Drag on paper or empty room floor → marquee select (`onSelectMany`); click floor without drag → select room
- Esc → deselect + cancel tool (returns to Select; clears measure)
- Delete/Backspace remove (modal gate preserved)
- Cmd/Ctrl+D duplicate
- Selection chrome already emphasized; marquee overlay added

### 6.3 Keyboard workflow — `Implemented`

Delete, Escape, Duplicate, Undo/Redo (modal gate), 90° rotate (`R` / `Shift+R`), Fit plan / Fit selection.

### 6.4 Measurement system — `Implemented`

Build tool `measure`: click A→B… running segments with mm labels; snaps to wall ends/corners, opening edges, cabinet edges/centres; grid rounded on demand (no lattice). Pointer capture prevents cabinet/opening drag from stealing measure clicks. Esc clears/exits via cancel tool.

### 6.5 Typed dimensions — `Implemented` (walls)

Click wall length label → edit mm. Applies via `setTypedWallLength` / `setPlanWallLength` with explicit **start** anchor (keeps start fixed · moves end) — never uniform room scale. Inspector Length field shows the same anchor hint. Remaining polish: typed overall room pair dims.

### 6.6 Driving vs reference dimensions — `Implemented` (MVP)

Wall lengths + room clear/overall pairs marked driving; reference dims for cabinet→opening and cabinet→wall offsets (`collectReferenceDimensions`) update as geometry moves.

### 6.7 Snapping & alignment — `Implemented`

Guides include wall / wall-centre / centre / object / opening / run / grid with **labels** showing what is snapped to (openings/walls room-scoped).

### Phase 1 exit

A user who has used a floor-planning app before can operate the plan without training.

**Test:** Give them a measured kitchen to reproduce — Room → Exact dimensions → Door → Window → Cabinet without assistance.

**Shipped verification:** unit tests for view transform (meet letterboxing), measure (semantic snaps + on-demand grid), typed wall anchor, snap guide pick, reference dims; Playwright `phase-1-precision-canvas.spec.ts` covers measure-vs-drag, floor marquee, and CTM round-trip.

---

## 7. Phase 2 — Measured room workflow

**Estimate:** 2–4 weeks  
**Status:** `Implemented` (2026-09-05 on `feat/2d-plan-layer`) — underlay lock/hide/calibrated flags; calibrate-underlay tool + known-distance PromptDialog; site measure checklist; clearer door swings / window rails + width/offset labels; base/wall/tall/appliance/filler plan footprints. PDF import remains Phase 5.1.

Connect the app to actual site measurements.

### 7.1 Underlay import

JPG / PNG / WebP (shipped). PDF import is deferred to Phase 5.1.

```text
Import → Position → Rotate → Calibrate → Adjust Opacity → Lock → Trace
```

### 7.2 Calibration wizard

User marks a known distance: Point A ——— Point B = `3200 mm`. App computes scale.

### 7.3 Underlay controls

Opacity, scale, rotation, X/Y nudge, lock/unlock, hide/show, reset. Locked underlay cannot be edited by accident.

### 7.4 Site measure panel (optional)

Checklist for walls, ceiling height, door/window sizes and offsets — helpful, not mandatory bureaucracy.

### 7.5 Opening representation

Clearer doors, swings, windows, width, offset — readable at normal zoom and on export.

### 7.6 Cabinet footprints

Visually distinct: base, wall, tall, appliances, fillers.

### Phase 2 exit

Salesperson can: **Import plan → Calibrate → Trace walls → Add openings → Start cabinet run** without another app.

**AI is deliberately not required here.**

---

## 8. Phase 3 — Cabinet plan excellence ★

**Estimate:** 3–5 weeks  
**Status:** `NEXT` after Phase 2 (can partially parallel Phase 4)

This is where the product should become meaningfully different from generic floor planners.

Question is not “can we draw cabinets?” but “can we help a salesperson build a run that **actually fits**?”

| Theme | Capability |
| --- | --- |
| Run-aware placement | Preview remaining wall width, fillers, gaps, openings, corners |
| Complete wall run | Obvious “Complete Run” with suggested fillers / sizes; user accepts/edits |
| Inline cabinet dims | Canvas `W 600 × D 560`; click to edit without inspector-only flow |
| Pre-drop validation | Fits / opening conflict / overlap / filler / outside room **before** drop |
| Active run hierarchy | Active run highlighted; other cabinetry quieter; room as context |
| Plan marks | Optional labels (`B600`, `F50`, …); toggle by audience |

### Phase 3 exit

Straight kitchen feels **guided**, not CAD homework. Target: completed room → credible run **< 3 minutes**.

---

## 9. Phase 4 — Presentation & export

**Estimate:** 2–3 weeks  
**Status:** `LATER` / after Phase 3 start

Same `InteriorProject` → different representations. Do not fork separate drawings.

| View | Audience | Content |
| --- | --- | --- |
| **Sales** | Customer | Room, layout, key dims, openings, clean labels, job name, optional materials/branding |
| **Technical** | Engineering | Wall/cabinet/opening IDs & dims, offsets, fillers, run dims, reference dims |

### Export

PDF / PNG / SVG where useful — project name, customer/job, scale + scale bar, date, company, optional logo.

### Print controls

Show/hide dims, labels, furniture, openings, grid, marks, reference dims, underlay. Presets: **Sales** / **Technical**.

### Phase 4 exit

One click → plan a salesperson is comfortable attaching to a proposal.

---

## 10. Phase 5 — Import accelerators

**Status:** `LATER` / research — only after core 2D workflow is excellent

| ID | Item | Risk |
| --- | --- | --- |
| 5.1 | Better PDF import (multi-page, crop, calibrate) | Low |
| 5.2 | AI floor-plan detection → review → correct → accept into normal geometry | High; no separate AI model of truth |
| 5.3 | DWG/DXF when customers demand it | Expensive; don’t delay salesperson workflow |

---

## 11. Explicitly out of scope (`EXCLUDED`)

- Huge furniture marketplace  
- General architecture CAD  
- Multi-building / real-estate floor planning  
- Social interior-design features / styleboards / massive decor catalog  
- Perfect CAD topology before salesperson workflow is smooth  
- Floorplanner / RoomSketcher / Planner 5D parity claims  
- AI-first room generation  
- Complex DWG workflows as a near-term blocker  

---

## 12. Recommended execution order

```text
PHASE 0  Reliability                    [Implemented]
    ↓
PHASE 1 ★ Precision Canvas              [Implemented — polish open]
         Pan / Zoom / Measure / Dimensions / Snap / Keyboard / Undo
    ↓
PHASE 2  Measured Room                    [Implemented]
         Underlay / Calibration / Openings polish
    ↓
PHASE 3 ★ Cabinet Intelligence
         Runs / Fit / Fillers / Inline Editing
    ↓
PHASE 4  Presentation
         Sales Plan / Technical Plan / Export
    ↓
──────── 2D MATURITY GATE ────────
    ↓
Return investment to: 3D / Render / Pricing / Engineering
    ↓
PHASE 5  AI / DWG / Advanced Imports — only when justified
```

---

## 13. When to stop expanding 2D

Do **not** continuously add CAD features because competitors have them.

2D is mature enough when users can reliably perform:

```text
Measured Room → Exact Walls → Doors + Windows → Cabinet Runs → Fit Validation → Professional Plan
```

Then shift investment **downstream**.

---

## 14. Downstream product architecture

```text
                    MEASURE
                       │
                       ▼
                ┌───────────────┐
                │      2D       │
                │ Room + Layout │
                └───────┬───────┘
                        │
                 InteriorProject
                        │
      ┌─────────────────┼──────────────────┐
      ▼                 ▼                  ▼
     3D              PRICING          ENGINEERING
      │                 │                  ├── BOM
 MATERIALS          QUOTE                 ├── Cut list
      │                 │                  ├── Hardware
   RENDER           PROPOSAL              └── Drawings
      │                 │
      └────────┬────────┘
               ▼
        CLIENT APPROVAL → PRODUCTION
```

Same project drives every branch.

---

## 15. Product moat

Not: “better rectangles” or “more furniture than Floorplanner.”

**Moat:** We understand cabinetry and the complete cabinet **sales-to-production** workflow.

Generic tools help users draw a room. This product should answer:

> What cabinetry fits this measured room, what will it look like, what will it cost, and how do we manufacture it?

---

## 16. Final product journey

```text
MEASURE → DESIGN → VALIDATE → VISUALIZE → PRICE → SELL → ENGINEER → MANUFACTURE
```

**Immediate priority:** Phase 1 — Precision Canvas  
Get pan, zoom, fit, selection, measure, typed dimensions, snapping, keyboard, undo/redo exceptionally reliable — then measured-room workflow — then exceptional cabinet runs — then presentation-ready plans — then **stop chasing generic 2D** and move downstream.

---

## 17. Relationship to other docs

| Doc | Relationship |
| --- | --- |
| [CABINET_STUDIO_PRODUCT_BOOK.md](./CABINET_STUDIO_PRODUCT_BOOK.md) | STR rules, §15 plan requirements, Golden Cabinet Run, P0 cabinet program |
| [INTERIOR_DESIGN_TOOL_ROADMAP.md](./INTERIOR_DESIGN_TOOL_ROADMAP.md) | Historical H–L interiors; this doc is the **active** 2D follow-on |
| [FLOORPLANNER_D0_TOPOLOGY_ADR.md](./FLOORPLANNER_D0_TOPOLOGY_ADR.md) | Topology rules remain binding |
| [PRODUCT_DECISIONS.md](./PRODUCT_DECISIONS.md) | Interiors vs Cabinets chrome decisions stand |

---

## 18. Change log

| Date | Change |
| --- | --- |
| 2026-09-05 | Initial roadmap from competitive 2D audit + Product Book §15 |
| 2026-09-05 | Phase 0 implemented (merge UX, dialogs, golden path, labels) |
| 2026-09-05 | Replaced with consolidated product roadmap (review): precision canvas, driving/reference dims, maturity gate, moat, downstream architecture |
| 2026-09-05 | Phase 1 Precision Canvas implemented on `feat/2d-plan-layer` (pan/zoom/fit, marquee, measure, typed wall length, reference dims, labelled snaps) |
| 2026-09-05 | Phase 1 review fixes: floor marquee, measure capture before drag, inverse-CTM / meet-aware mapping, on-demand measure grid, room-scoped opening snaps + reference dims |
