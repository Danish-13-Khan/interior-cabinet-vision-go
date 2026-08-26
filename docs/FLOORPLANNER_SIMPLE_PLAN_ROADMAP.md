# Floorplanner-like Simple Plan UI — Gap Roadmap

**Status:** Planning only — do not implement until this roadmap is approved.  
**Reference:** Floorplanner Build UI screenshots (Aug 2026) — Draw Room / Draw Wall / Draw Surface / Place Doors / Place Windows / Place Structurals; selection inspector; 2D↔3D dollhouse.  
**Product rule:** Stay millwork-first. Copy Floorplanner’s *simple plan chrome*, not its full home-design catalog sprawl.

**Product threshold (real parity):** draw a multi-room footprint, place openings, place cabinets that snap and validate, then view the same plan in 3D.  
Phase A chrome is an early win — **not** Floorplanner parity.

---

## 1. What “like Floorplanner” means for us

Target Build experience from the reference:

```text
Icon rail → Build panel
  · Upload 2D floorplan
  · Draw Room
  · Draw Wall
  · Draw Surface
  · Place Doors  → opening catalog + dims
  · Place Windows → opening catalog + dims
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
| Room | Single **rectangle** `Size3Mm` box; 4 perimeter walls |
| Walls | `WallEntity` with `roomId` + `start`/`end`; select wall; add **partition** |
| Openings | Parametric on `wallId` + offset/W/H/sill (no `catalogItemId`) |
| Underlay | Import image + calibrate width |
| 2D↔3D | Live compile from one `InteriorProject`; orbit presets |
| Design | Cabinets / furniture libraries (separate from Build) |
| Units | Project geometry stored as **mm** (`InteriorUnits = "mm"`) |

**Gap summary:** We have a *form-based rectangular shell editor*. Floorplanner is a *tool-mode canvas author*. Closing that gap is primarily a **geometry + interaction-model** change, not a visual reskin.

Code anchors: `docs/FLOORPLANNER_SIMPLE_PLAN_ROADMAP.md`, `src/domain/interiorProject/types.ts` (room box, walls, openings).

---

## 3. Gap map (reference → us)

| Floorplanner reference | Us today | Gap size | Blocked by |
| --- | --- | --- | --- |
| Build tool list (Draw Room / Wall / Surface / Place…) | Build form (dimensions + wall tabs + openings) | **UI medium** | Needs shared tool/command state (D0 → A) |
| Draw Room on canvas | Numeric W×D only | **Large** | Room = box in schema |
| Draw Wall freeform / edit endpoints | Partition add only | **Large** | Shell-owned perimeter walls |
| Shared walls / multi-room adjacency | `WallEntity.roomId` singular | **Large** | Topology (D0 / D1) |
| Draw Surface (floor zones) | Single painted floor rect | **Large** | Surface = polygon + material (not pixels) |
| Place Doors catalog + preview | Parametric opening, no catalog | **Medium** | Opening catalog contract |
| Place Windows catalog | Same as doors | **Medium** | Same |
| Place Structurals | Partition only | **Large** | No structural entity types |
| Inner + outer auto dims | Outer W×D only | **Medium** | Plan view labeling |
| Selection panel (preview, W×H, materials) | Right inspector (numeric) | **Small–medium** | UI + catalog slots |
| Upload 2D floorplan | Have underlay | **Small** | Align/rotate polish |
| m / ft toggle | Display always mm | **Small–medium** | **Display preference only** — do not expand schema |
| 3D dollhouse + joystick | Orbit / presets | **Medium** | Camera UX, not geometry |
| Walkthrough | Missing | **Large** | Collision / FPS controls |
| Live 3D from plan | **Have** | — | Keep |

Hard domain blockers (must be designed in D0 before Draw Wall defines the room):

1. Room is `Size3Mm` box, not a polygon / wall-graph.  
2. `resizeLivingRoom` rebuilds only `back|right|front|left` walls.  
3. Floor / ceiling / bounds / snap assume a centered rectangle.  
4. Rectangular assumptions also touch **validation, snapping, cabinet constraints, technical plan output, scene compiler, and project-file migrations**.  
5. Openings already attach to arbitrary wall segments — keep that; closed-shell validity and shared walls do not exist yet.

---

## 4. Design contracts (locked before / during early phases)

### 4.1 Units

- **Store and compute geometry in mm only.**  
- Unit toggle (mm · cm · m · ft-in) is a **user/display preference**, not an `InteriorUnits` schema expansion.  
- Never persist mixed unit systems in the project file.

### 4.2 Opening catalog (not loose style fields)

Openings follow the same catalog pattern as objects. Do **not** grow unstructured “style” strings on `OpeningEntity`.

Minimum catalog item shape:

| Field | Role |
| --- | --- |
| `catalogItemId` | Stable id |
| Preview / 2D symbol | Library thumb + plan symbol |
| 3D generator or asset ref | Scene compile |
| Parameters | Default W/H/sill, swing, etc. |
| Material slots | e.g. frame / leaf / glass |

`OpeningEntity` holds instance data (`wallId`, offsets, dims, `catalogItemId`, slot overrides) — same spirit as `InteriorObjectEntity`.

Ship 2–3 procedural catalog items in Phase B; do not block on a marketplace asset pipeline.

### 4.3 Surfaces

Surface zones reference a **polygon/loop + materialId** (and optional room/loop association).  
Not painted pixels on the canvas. Full authoring waits for Phase E after topology exists.

### 4.4 Multi-room adjacency

- **Data model:** adjacency / shared walls are **non-optional** in the target topology (wall↔rooms or edge↔faces).  
- **Editor UX:** first freeform editor may still expose **one** room.  
- Do not ship a single-room-only wall ownership model that cannot later share walls.

### 4.5 Tool + command + undo model

Phase A introduces the interaction foundation used through D:

- `activeTool` state (draw room, draw wall, place door, …)
- Atomic undoable commands: **draft · commit · cancel · split · join · delete · place opening · move opening**
- Same command model for rectangular shims in A/B and freeform ops in D — so D does not force a UI rewrite

Undo/redo is a **Phase A foundation**, not a Phase G retrofit.

---

## 5. Phased roadmap (approve before coding)

Effort is rough relative size (S / M / L / XL), not calendar promises. Ship each phase behind V2; keep classic UI until acceptance.

### Phase D0 — Topology + migration design spike · M · before A implementation

**Goal:** Decide the target wall graph before any Build chrome lands.

Deliverables (design / types / spike — not full freeform editor):

- Target topology: nodes, wall edges, closed loops, holes  
- Shared walls / multi-room adjacency in the **model** (required)  
- Migration strategy from box rooms + four named sides → graph  
- Tool/command list contract used by A–D  
- Opening catalog type sketch + surface polygon sketch  
- Impact list: bounds, resize, validation, snap, cabinet constraints, technical plans, scene compiler, file migrations  

**Exit:** Written contract approved; A implements against it.  
**Does not include:** shipping freeform draw tools (that is D1–D4).

---

### Phase A — Build shell + tool/command state · S–M · after D0

**Goal:** Floorplanner-like tool chrome **and** the command/undo foundation — still rectangular geometry underneath.

- Replace Build form with tool list (Upload, Draw Room, Draw Wall, Draw Surface stub, Place Doors/Windows, Place Structurals stub)
- `activeTool` + undoable draft/commit/cancel wired for current rectangular ops
- Verb-first labels + active tool highlight
- Right inspector for selection; left panel switches when placing openings
- Floating canvas zoom if missing
- Map tools to existing box-room actions (Draw Room → dimension/box edit; Draw Wall → select / partition)

**Exit:** Chrome matches reference; tool/command state ready for B and D; room still rectangular.  
**Not parity.** Exit is “chrome + command foundation,” not Floorplanner-like.

---

### Phase B — Openings direct manipulation · M · ~2–3 weeks

**Goal:** Doors/windows feel placed; catalog is first-class.

- Click wall to place at cursor offset (snap to wall)
- Drag opening along wall; live width handle
- Opening catalog: 2–3 procedural items with preview, 2D symbol, parameters, material slots
- Selection panel: preview, W × H, sill, material slots
- Auto opening dimension label on plan
- All place/move/delete ops go through undoable commands from A

**Exit:** Place Doors / Place Windows match reference interaction quality on rectangular rooms.

---

### Phase C — Plan readability · M · ~1–2 weeks

**Goal:** Plan reads like the reference dimensioning.

- Inner clear + outer footprint dimension pairs
- Per-wall length labels (selected and/or always-on toggle)
- Unit **display** preference: mm · cm · m · ft-in (geometry remains mm)
- Underlay: opacity + simple pan/rotate handles
- Visual style toggles (line / fill) if cheap

**Exit:** Single-room plans look measured and exportable as plan images.

---

### Phase D — Freeform geometry · XL · multi-sprint

**Goal:** Real Draw Room / Draw Wall on the D0 topology.

| Slice | Work | Size |
| --- | --- | --- |
| D1 | Wall-graph domain + migration from box rooms (adjacency-capable) | L |
| D2 | Draw Room (click-drag rectangle + polygon close) | L |
| D3 | Draw Wall (segment, join, split, delete, thickness) | L |
| D4 | Floor / ceiling from closed loops; rewrite bounds / snap / compiler / validation / cabinet constraints / technical plans | L |

Multi-room **editing** ships when D1 adjacency is real; first UX may still focus one room.

**Exit:** Irregular (and multi-room-capable) footprints authorable in 2D and compile to 3D.

**Blast radius reminder:** rectangular assumptions are not limited to resize — plan for validation, snapping, millwork constraints, technical output, scene compile, and migrations in D4.

---

### Phase E — Surfaces & structurals · L · after D1+

- Draw Surface: zones as polygon/loop + material  
- Structurals MVP: column; optional simple stair stub  
- Partition walls as first-class tools on the graph  

**Exit:** Build tool list items enabled for MVP structural set.

---

### Phase F — 3D viewing parity · M–L · after B (can overlap C)

- Dollhouse camera preset + height / FOV panel  
- Clearer 3D nav affordances  
- Walkthrough (first-person) optional after dollhouse  
- Keep photoreal / schedule in **Render** mode  

**Exit:** 2D author → instant 3D dollhouse feels continuous.

---

### Phase G — Polish & cut scope · ongoing

- Cut from v1 parity: Styleboards, Autostyler, huge object marketplace, AI floor-plan CV  
- Keep millwork Design mode as the cabinet surface (differentiator)  
- Performance, open-graph validation, migration hardening  

---

## 6. Critical path

```text
D0  topology + migration + tool/command contract   ← design spike first
A   shell + tool state + undoable commands
B   openings direct manipulation (+ catalog)
C   dimensions / underlay / unit display preference
D1–D4  freeform single/multi-room geometry
E   surfaces + structurals
F   dollhouse, then optional walkthrough
```

**Early win (not parity):** D0 → A → B → C on a box room, with commands already matching freeform.  
**Real product threshold:** multi-room footprint + openings + cabinets snap/validate + same plan in 3D (after D + Design mode).

---

## 7. Effort reality check

| Bundle | Relative effort | User value |
| --- | --- | --- |
| D0 design spike | Medium | Prevents rewrite of A/B |
| A+B+C (chrome + openings + dims on box) | Medium | High early UX; **not** parity |
| F dollhouse | Medium | High perceived polish |
| D freeform + adjacency + blast-radius rewrites | Very high | Required for real plan product |
| E surfaces/structurals | High | After topology |
| Full Floorplanner clone | Out of product scope | Wrong goal |

Generated 3D already works for box rooms. The large investment is topology, freeform authoring, catalogized openings, and constraint/compiler rewrites — not inventing 3D from scratch.

---

## 8. Decision checklist (approve before coding)

- [ ] Approve **D0** spike before any Phase A implementation  
- [ ] Approve Phase A exit as chrome + tool/command/undo foundation (not parity)  
- [ ] Confirm target topology includes **shared walls / multi-room adjacency** in the model  
- [ ] Confirm units stay **mm in project**; toggle is display preference only  
- [ ] Confirm openings use a real **catalog** (`catalogItemId`, preview, 3D, parameters, material slots)  
- [ ] Confirm surfaces = polygon/loop + material (not paint pixels)  
- [ ] Confirm Structurals MVP = partition + column only  
- [ ] Confirm walkthrough is optional after dollhouse  
- [ ] Keep Design mode for cabinets (do not merge into Floorplanner Objects)  
- [ ] Confirm freeform (D1–D4) is in-scope for this product year, or defer explicitly  

---

## 9. Reference index

Screenshots captured locally (Aug 26, 2026):

- Build tool list + empty room dims  
- Place Doors library (Doors / Windows tabs, search, 2D/3D thumbs)  
- Door selection inspector (preview, materials)  
- 3D dollhouse + Camera panel (height, FOV, perspective)

Related canvases (workspace `canvases/`): `floorplanner-simple-plan-roadmap.canvas.tsx`, `planner-ui-tool-comparison.canvas.tsx`.
