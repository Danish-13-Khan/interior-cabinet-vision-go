# Floorplanner-like Simple Plan UI — Gap Roadmap

**Status:** Planning only — do not implement until this roadmap is approved.  
**Reference:** Floorplanner Build UI screenshots (Aug 2026) — Draw Room / Draw Wall / Draw Surface / Place Doors / Place Windows / Place Structurals; selection inspector; 2D↔3D dollhouse.  
**Product rule:** Stay millwork-first. Copy Floorplanner’s *simple plan chrome*, not its full home-design catalog sprawl.

---

## 1. What “like Floorplanner” means for us

Target Build experience from the reference:

```text
Icon rail → Build panel
  · Upload 2D floorplan
  · Draw Room
  · Draw Wall
  · Draw Surface
  · Place Doors  → style library + dims
  · Place Windows → style library + dims
  · Place Structurals → columns / partitions (MVP subset)

Canvas
  · Grid + auto inner/outer dimensions
  · Click-to-draw / place with snap
  · Floating zoom

Top / view
  · 2D | 3D toggle
  · Undo / redo / save / export

3D
  · Same project, live compile
  · Dollhouse (and later walkthrough)
```

Out of scope for this roadmap (explicitly later / never as shell work):

- Styleboards, Autostyler, AI Studio moodboard canvas
- 260k furniture marketplace
- Multi-building / whole-house RE export packages
- Photoreal credit-based marketing renders as the Build goal (Render mode already owns presentation)

---

## 2. Current baseline (already shipped)

| Capability | Today |
| --- | --- |
| V2 shell | Project / Build / Design / Render rail, canvas, inspector, status bar |
| Room | Single **rectangle** W×D×H (mm), 4 perimeter walls |
| Walls | Select wall; add **partition** segment |
| Openings | Add door/window on wall; edit offset, W, H, sill |
| Underlay | Import image + calibrate width |
| 2D↔3D | Live compile from one `InteriorProject`; orbit presets |
| Design | Cabinets / furniture libraries (separate from Build) |
| Units | **mm only** |

**Gap summary:** We have a *form-based rectangular shell editor*. Floorplanner is a *tool-mode canvas author*. Closing that gap is mostly domain + interaction work, not CSS.

---

## 3. Gap map (reference → us)

| Floorplanner reference | Us today | Gap size | Blocked by |
| --- | --- | --- | --- |
| Build tool list (Draw Room / Wall / Surface / Place…) | Build form (dimensions + wall tabs + openings) | **UI medium** | Easy once tools exist |
| Draw Room on canvas | Numeric W×D only | **Large** | Room = box in schema |
| Draw Wall freeform / edit endpoints | Partition add only | **Large** | Shell-owned perimeter walls |
| Draw Surface (floor zones) | Single painted floor rect | **Large** | No surface polygons |
| Place Doors library + preview | Parametric opening, no style library | **Medium** | Catalog + materials on openings |
| Place Windows library | Same as doors | **Medium** | Same |
| Place Structurals | Partition only | **Large** | No structural entity types |
| Inner + outer auto dims | Outer W×D only | **Medium** | Plan view labeling |
| Selection panel (preview, W×H, materials) | Right inspector (numeric) | **Small–medium** | Mostly UI |
| Upload 2D floorplan | Have underlay | **Small** | Align/rotate polish |
| m / ft toggle | mm only | **Medium** | `InteriorUnits` + display layer |
| 3D dollhouse + joystick | Orbit / presets | **Medium** | Camera UX, not geometry |
| Walkthrough | Missing | **Large** | Collision / FPS controls |
| Live 3D from plan | **Have** | — | Keep |

Hard domain blockers (must come before “Draw Wall defines the room”):

1. Room is `Size3Mm` box, not a polygon / wall-graph.  
2. `resizeLivingRoom` rebuilds only `back|right|front|left` walls.  
3. Floor / ceiling / bounds / snap assume a centered rectangle.  
4. Openings work on arbitrary segments already — good — but closed-shell validity does not.

---

## 4. Phased roadmap (approve before coding)

Effort is rough relative size (S / M / L / XL), not calendar promises. Ship each phase behind V2; keep classic UI until acceptance.

### Phase A — Simple Build chrome (UI only) · S · ~1 week

**Goal:** Look and navigate like the reference without new geometry.

- Replace Build form with Floorplanner-style tool list:
  - Upload 2D floorplan
  - Draw Room *(initially: activates dimension / box-edit mode)*
  - Draw Wall *(initially: select / add partition)*
  - Draw Surface *(disabled or “coming soon” until Phase D)*
  - Place Doors / Place Windows *(opens library or current add flow)*
  - Place Structurals *(partition only at first)*
- Verb-first labels + active tool highlight
- Keep right inspector for selection; left panel switches to door/window list when placing
- Floating canvas zoom controls if missing

**Exit:** Build mode *looks* like the reference; room still rectangular.

**Does not include:** freeform drawing, door product library, dollhouse.

---

### Phase B — Canvas place & edit openings · M · ~2–3 weeks

**Goal:** Doors/windows feel placed, not only form-filled.

- Click wall to place door/window at cursor offset (snap to wall)
- Drag opening along wall; live width handle
- Door/window **style presets** (few procedural styles: slab, glass, panel) — not a marketplace
- Selection panel: preview thumb, W × H, sill, material slots (frame / leaf / glass)
- Auto opening dimension label on plan

**Exit:** Place Doors / Place Windows match reference interaction quality on rectangular rooms.

**Depends on:** Phase A chrome.

---

### Phase C — Plan readability · M · ~1–2 weeks

**Goal:** Plan reads like the reference dimensioning.

- Inner clear + outer footprint dimension pairs
- Per-wall length labels when wall selected / always-on toggle
- Unit display toggle: mm · cm · m · ft-in (store mm; convert for display)
- Underlay: opacity + simple pan/rotate handles
- Visual style toggles (line / fill) if cheap

**Exit:** Single-room plans look “measured” and exportable as plan images.

---

### Phase D — Freeform room geometry · XL · multi-sprint

**Goal:** Real Draw Room / Draw Wall.

This is the largest body of work. Split internally:

| D1 | Wall-graph / polygon room model in domain + migration from box rooms | L |
| D2 | Draw Room (click-drag rectangle + later polygon close) | L |
| D3 | Draw Wall (segment, join, split, delete, thickness) | L |
| D4 | Floor / ceiling mesh from closed loops; bounds / snap rewrite | L |
| D5 | Multi-room adjacency (optional after single freeform room works) | XL |

**Exit:** Irregular footprints authorable in 2D and compile to 3D.

**Do not start D until A–C are accepted** — otherwise UI chrome and geometry rewrite collide.

---

### Phase E — Surfaces & structurals · L · after D1 at least

- Draw Surface: floor zones / material regions
- Structurals MVP: column, optional simple stair stub
- Partition walls become first-class structural/wall tools on the graph

**Exit:** Build tool list items are all enabled for MVP structural set.

---

### Phase F — 3D viewing parity · M–L · can parallelize after B

- Dollhouse camera preset + height / FOV panel (reference Camera tab)
- Orbit joystick / clearer 3D nav affordances
- Walkthrough (first-person) as stretch — schedule after dollhouse
- Keep photoreal / schedule in **Render** mode (do not overload Build)

**Exit:** 2D author → instant 3D dollhouse feels continuous.

---

### Phase G — Polish & cut scope · ongoing

- Explicitly **cut** from v1 parity: Styleboards, Autostyler, huge object marketplace, AI floor-plan CV
- Keep millwork Design mode as the furniture/cabinet surface (our differentiator)
- Performance, undo granularity for draw ops, validation for open wall graphs

---

## 5. Suggested sequence (critical path)

```text
A  Simple Build chrome          ← start here after approval
B  Place doors/windows canvas
C  Dims + units + underlay
F' Dollhouse 3D nav (parallel with C)
D  Freeform geometry            ← biggest investment
E  Surfaces + structurals
F  Walkthrough (optional)
```

**Fastest user-visible win:** A → B → C (still rectangular room, but “feels like Floorplanner Build”).  
**True Draw Wall parity:** only after D.

---

## 6. Effort reality check

| Bundle | Relative effort | User value |
| --- | --- | --- |
| A+B+C (simple plan UI on box room) | Medium | High — matches reference chrome + place openings |
| F dollhouse | Medium | High perceived polish |
| D freeform geometry | Very high | Required for “draw any plan” |
| E surfaces/structurals | High | Medium until freeform exists |
| Full Floorplanner clone | Out of product scope | Wrong goal |

Generated 3D is **already** on the critical path for box rooms. The “huge development” part is freeform walls + libraries + walkthrough — not inventing 3D from scratch.

---

## 7. Decision checklist (approve before coding)

- [ ] Approve Phase A chrome (tool list) as first implementation slice  
- [ ] Confirm freeform (Phase D) is in-scope for this product year, or defer and stay rectangular  
- [ ] Confirm door/window library = small procedural presets (not marketplace)  
- [ ] Confirm Structurals MVP = partition + column only  
- [ ] Confirm walkthrough is optional after dollhouse  
- [ ] Keep Design mode for cabinets (do not merge into Floorplanner Objects)

---

## 8. Reference index

Screenshots captured locally (Aug 26, 2026):

- Build tool list + empty room dims  
- Place Doors library (Doors / Windows tabs, search, 2D/3D thumbs)  
- Door selection inspector (preview, materials)  
- 3D dollhouse + Camera panel (height, FOV, perspective)

Living comparison canvas: `canvases/planner-ui-tool-comparison.canvas.tsx` (workspace canvases folder).
