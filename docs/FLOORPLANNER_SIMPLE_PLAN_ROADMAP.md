# Floorplanner-like Simple Plan UI — Gap Roadmap

**Status:** Planning only — do not implement until this roadmap is approved.  
**Reference:** Floorplanner Build UI screenshots (Aug 2026) — Draw Room / Draw Wall / Draw Surface / Place Doors / Place Windows / Place Structurals; selection inspector; 2D↔3D dollhouse.  
**Product rule:** Stay millwork-first. Copy Floorplanner’s *simple plan chrome*, not its full home-design catalog sprawl.

**Product agenda (unchanged — every phase serves this flow):**

```text
Menu / Project home
  → 2D creation (Build + Design on plan)
  → 3D review (same project, live compile)
  → Render
  → Export
```

Do not invent a parallel workflow. Floorplanner-like tools deepen **2D creation**; dollhouse deepens **3D**; presentation stays in **Render → Export**.

**Product threshold (real parity):** draw a multi-room footprint, place openings, place cabinets that snap and validate, then view the same plan in 3D and export.  
Phase A chrome is an early win — **not** Floorplanner parity.

---

## 1. What “like Floorplanner” means for us

Target **2D creation** experience inside the existing agenda:

```text
Menu / Project
  → Build (2D)
      Icon rail → Build panel
        · Upload 2D floorplan
        · Draw Room
        · Draw Wall
        · Draw Surface
        · Place Doors  → opening catalog + dims
        · Place Windows → opening catalog + dims
        · Place Structurals → columns / partitions (MVP subset)
      Canvas: grid, auto dims, snap, floating zoom
  → Design (2D): cabinets / furniture on the same plan
  → 3D: same project, live compile, dollhouse (later walkthrough)
  → Render: cameras / stills / schedule presentation
  → Export: images, schedule, project file
```

Out of scope for this roadmap (explicitly later / never as shell work):

- Styleboards, Autostyler, AI Studio moodboard canvas
- 260k furniture marketplace
- Multi-building / whole-house RE export packages
- Photoreal credit-based marketing renders as the Build goal (Render mode already owns presentation)
- Any flow that skips or replaces Menu → 2D → 3D → Render → Export

---

## 2. Current baseline (already shipped)

| Capability | Today |
| --- | --- |
| Product agenda | V2: Project → Build → Design → Render (+ 2D/3D toggle, export) |
| V2 shell | Mode rail, canvas, inspector, status bar |
| Room | Single **rectangle** `Size3Mm` box; 4 perimeter walls |
| Walls | `WallEntity` with single `roomId` + `start`/`end`; select wall; add **partition** |
| Openings | Parametric on `wallId` + offset/W/H/sill (no `catalogItemId`); validation ties `opening.roomId` to `wall.roomId` |
| Underlay | Import image + calibrate width |
| 2D↔3D | Live compile from one `InteriorProject`; orbit presets |
| Design | Cabinets / furniture libraries (separate from Build) |
| Schema | `INTERIOR_PROJECT_SCHEMA_VERSION = 1`; geometry stored as **mm** |

**Gap summary:** We have a *form-based rectangular shell editor* inside the right product agenda. Floorplanner-like work deepens **2D creation** (and then 3D viewing). Closing the gap is primarily a **geometry + interaction-model** change, not a visual reskin or a new end-to-end flow.

Code anchors: `src/domain/interiorProject/types.ts`, `src/domain/interiorProject/validation.ts` (schema v1, single `roomId` on walls/openings).

---

## 3. Gap map (reference → us)

| Floorplanner reference | Us today | Gap size | Blocked by |
| --- | --- | --- | --- |
| Build tool list (Draw Room / Wall / Surface / Place…) | Build form (dimensions + wall tabs + openings) | **UI medium** | Needs shared tool/command state (D0 → A) |
| Draw Room on canvas | Numeric W×D only | **Large** | Room = box in schema |
| Draw Wall freeform / edit endpoints | Partition add only | **Large** | Shell-owned perimeter walls |
| Shared walls / multi-room adjacency | Single `roomId` per wall/opening (v1 validation) | **Large** | Topology + **schema v2** (D0 / D1) |
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
| Render → Export | **Have** (keep) | — | Do not relocate into Build |

Hard domain blockers (must be designed in D0 before Draw Wall defines the room):

1. Room is `Size3Mm` box, not a polygon / wall-graph.  
2. `resizeLivingRoom` rebuilds only `back|right|front|left` walls.  
3. Floor / ceiling / bounds / snap assume a centered rectangle.  
4. Rectangular assumptions also touch **validation, snapping, cabinet constraints, technical plan output, scene compiler, and project-file migrations**.  
5. Openings already attach to arbitrary wall segments — keep that; closed-shell validity and shared walls conflict with **schema v1** single-`roomId` validation.

---

## 4. Design contracts (locked before / during early phases)

### 4.1 Product agenda

Phases A–G plug into the existing shell:

| Step | Mode / surface | This roadmap deepens |
| --- | --- | --- |
| Menu | Project home | Starters / open / import only |
| 2D creation | Build + Design | Tools, openings, freeform, cabinets |
| 3D | 2D↔3D toggle / model view | Dollhouse / nav (Phase F) |
| Render | Render mode | Unchanged ownership |
| Export | Save / schedule / image export | Unchanged ownership |

### 4.2 Units

- **Store and compute geometry in mm only.**  
- Unit toggle (mm · cm · m · ft-in) is a **user/display preference**, not an `InteriorUnits` schema expansion.  
- Never persist mixed unit systems in the project file.

### 4.3 Opening catalog (not loose style fields)

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

### 4.4 Surfaces

Surface zones reference a **polygon/loop + materialId** (and optional room/loop association).  
Not painted pixels on the canvas. Full authoring waits for Phase E after topology exists.

### 4.5 Multi-room adjacency

- **Data model:** adjacency / shared walls are **non-optional** in the target topology (wall↔rooms or edge↔faces). Schema v1’s single `roomId` cannot express this — **v2 required**.  
- **Editor UX:** first freeform editor may still expose **one** room.  
- Do not ship a single-room-only wall ownership model that cannot later share walls.

### 4.6 Tool + command + undo model

Phase A introduces the interaction foundation used through D:

- `activeTool` state (draw room, draw wall, place door, …)
- Atomic undoable commands: **draft · commit · cancel · split · join · delete · place opening · move opening**
- Same command model for rectangular shims in A/B and freeform ops in D — so D does not force a UI rewrite

Undo/redo is a **Phase A foundation**, not a Phase G retrofit.

---

## 5. Phased roadmap (approve before coding)

Effort is rough relative size (S / M / L / XL), not calendar promises. Ship each phase behind V2; keep classic UI until acceptance.  
All phases stay on: **Menu → 2D creation → 3D → Render → Export**.

### Phase D0 — Topology + migration design spike · M · before A implementation

**Goal:** Decide the target wall graph and **versioned schema contract** before any Build chrome lands.

**Why versioned:** current project is **schema v1**. Validation requires every wall and opening to have one `roomId` (and opening `roomId` must match its wall). That **conflicts with shared walls**. D0 must propose how v2 replaces that rule and how v1 files keep working.

#### D0 exit criteria (concrete — all required)

D0 is done only when all of the following exist and are reviewed:

1. **ADR + diagram** for graph ownership and room-face relationships (nodes, edges, closed loops, holes, shared walls).  
2. **Proposed schema v2** (types + validation rules), including how shared walls/openings relate to rooms without a single mandatory `roomId` ownership model that blocks adjacency.  
3. **v1 → v2 migration design** — how old box-room projects convert; `schemaVersion` bump rules.  
4. **Fixture projects** checked in (or specified with golden JSON):  
   - rectangle room (v1-equivalent)  
   - L-room (single freeform loop)  
   - two rooms sharing a wall  
5. **Migration / validation tests** proving **v1 projects open unchanged** (round-trip or load-with-repair with no user-visible geometry loss).  
6. **Tool/command list contract** used by A–D (so A implements against D0, not a slide deck).  
7. **Opening catalog + surface polygon type sketches** visible in the v2 proposal (so they do not drift from design locks).  
8. **Blast-radius checklist:** bounds, resize, validation, snap, cabinet constraints, technical plans, scene compiler, file migrations.

**Exit:** The above artifacts are approved; Phase D0.5 may begin only against this contract.
**Does not include:** shipping freeform draw tools (that is D1–D4).

---

### Phase D0.5 — Schema v2 foundation · M · after D0, before A / B

**Goal:** Land the approved schema-v2 contract without shipping freeform drawing, so early UI and opening work use the real document model rather than temporary v1 fields.

- Add approved v2 types, migration, validation, fixtures, and migration tests
- Preserve the rectangular room adapter, renderer, and existing v1-equivalent workflow during the transition
- Add catalog-ready opening instance fields (`catalogItemId`, slot overrides) to the v2 document model
- Do **not** ship freeform room/wall authoring yet; that remains D1–D4

**Exit:** Existing v1 projects migrate with no user-visible geometry loss; rectangular projects still work on v2; Phase A commands and Phase B catalogized openings target v2 directly.  
**Status:** Implemented on `floorplanner-schema-v2-foundation` (schema v2 types, migration, topology validation, loadable goldens, loop-aware selectors).

---

### Phase A — Build shell + tool/command state · S–M · after D0.5

**Goal:** Floorplanner-like **2D Build** tool chrome **and** the command/undo foundation — still rectangular geometry underneath. Still inside Menu → 2D → 3D → Render → Export.

- Replace Build form with tool list (Upload, Draw Room, Draw Wall, Draw Surface stub, Place Doors/Windows, Place Structurals stub)
- `activeTool` + undoable draft/commit/cancel wired for current rectangular ops
- Verb-first labels + active tool highlight
- Right inspector for selection; left panel switches when placing openings
- Floating canvas zoom if missing
- Map tools to existing box-room actions (Draw Room → dimension/box edit; Draw Wall → select / partition)

**Exit:** Chrome matches reference; tool/command state ready for B and D; room still rectangular.  
**Not parity.** Exit is “chrome + command foundation,” not Floorplanner-like.  
**Status:** Implemented — `BuildToolList`, `buildToolCommands` (draft/commit/cancel + rectangular adapters), armed place tools, Escape cancel, upload picker wiring.

---

### Phase B — Openings direct manipulation · M · ~2–3 weeks

**Goal:** Doors/windows feel placed on the **2D plan**; catalog is first-class.

- Click wall to place at cursor offset (snap to wall)
- Drag opening along wall; live width handle
- Opening catalog: 2–3 procedural items with preview, 2D symbol, parameters, material slots
- Selection panel: preview, W × H, sill, material slots
- Auto opening dimension label on plan
- All place/move/delete ops go through undoable commands from A

**Exit:** Place Doors / Place Windows match reference interaction quality on rectangular rooms; 3D still compiles from the same project.  
**Status:** Implemented — click-wall place with snap, drag along wall, dual width handles, opening catalog (2 doors + 2 windows), inspector W×H/sill/material slots wired into 3D compile, auto plan labels, and undoable place/move/resize/delete via Phase A commands.

---

### Phase C — Plan readability · M · ~1–2 weeks

**Goal:** 2D plan reads like the reference dimensioning.

- Inner clear + outer footprint dimension pairs
- Per-wall length labels (selected and/or always-on toggle)
- Unit **display** preference: mm · cm · m · ft-in (geometry remains mm)
- Underlay: opacity + simple pan/rotate handles
- Visual style toggles (line / fill) if cheap

**Exit:** Single-room plans look measured; export of plan images remains on the Export path.  
**Status:** Implemented — inner/outer dimension pairs, wall-length labels with toggle, display-unit toolbar (mm/cm/m/ft-in), underlay opacity + pan/rotate controls, and fill/line plan style.

---

### Phase D — Freeform geometry · XL · multi-sprint

**Goal:** Real Draw Room / Draw Wall on the D0 / schema v2 topology — still authoring in **2D**, compiling to **3D**.

| Slice | Work | Size |
| --- | --- | --- |
| D1 | Wall-graph domain + migration from box rooms (adjacency-capable data model) | L |
| D2 | Draw Room (click-drag rectangle + polygon close) | L |
| D3 | Draw Wall (segment, join, split, delete, thickness; shared-edge ops) | L |
| D4 | Floor / ceiling from closed loops; rewrite bounds / snap / compiler / validation / cabinet constraints / technical plans | L |

**D1 status:** Implemented — graph nodes are authoritative, wall coordinate caches synchronize from nodes, box shells migrate into deterministic loops, compatible coincident boundaries merge into one shared wall, hosted openings remap without geometry loss, and graph indexes expose node incidence for D2/D3. Freeform authoring remains intentionally deferred.

**D2 status:** Implemented — Build → Draw Room creates an undoable topology room face directly on the 2D plan: drag for a snapped rectangle or click points and close a polygon. Each result receives a closed loop and graph walls, becomes the active room, and continues through the same 3D compiler. Shared-edge editing remains D3.

**D3 status:** Implemented — Build → Draw Wall authors graph wall segments on the 2D plan with snapped endpoints, shared-edge reuse, split at midpoint, delete, thickness edit, and coincident-node join. Commands are undoable through the Build command layer.

**D4 status:** Implemented — valid closed room loops now generate synchronized floor/ceiling surface zones and polygon-prism 3D geometry. Room bounds, arbitrary-wall snapping, freeform containment and cabinet wall placement use topology; validation rejects crossing boundaries; thumbnails and technical-plan SVGs follow the actual outline. Focused verification tests are present and intentionally left unexecuted for the requested manual run.

**Multi-room editing:** D1 can make the data model adjacency-capable; multi-room editing **begins after D1** and **ships once D2/D3 support shared-edge/face operations** (plus loop/face resolution). First UX may still focus one room until those flows land.

**Exit:** Irregular footprints authorable in 2D and compile to 3D; multi-room editing available when D2/D3 shared-edge/face work is done.

**Blast radius reminder:** rectangular assumptions are not limited to resize — plan for validation, snapping, millwork constraints, technical output, scene compile, and migrations in D4.

---

### Phase E — Surfaces & structurals · L · after D1+

- Draw Surface: zones as polygon/loop + material (still 2D creation)  
- Structurals MVP: column; optional simple stair stub  
- Partition walls as first-class tools on the graph  

**E status:** Implemented — Build → Draw Surface authors in-room polygon floor zones with undoable material assignment; Draw Partition and Place Column use the same command layer as D3 walls. Surface zones render on the 2D plan and compile as thin polygon-prism overlays in 3D; partitions are tagged on the graph and columns use the structural catalog adapter.

**Exit:** Build tool list items enabled for MVP structural set.

---

### Phase F — 3D viewing parity · M–L · after B (can overlap C)

Deepens the **3D** step of the agenda (not a new product flow):

- Dollhouse camera preset + height / FOV panel  
- Clearer 3D nav affordances  
- Walkthrough (first-person) optional after dollhouse  
- Keep photoreal / schedule in **Render**; keep downloads on **Export**  

**Exit:** 2D author → instant 3D dollhouse feels continuous; Render → Export unchanged.

---

### Phase G — Polish & cut scope · ongoing

- Cut from v1 parity: Styleboards, Autostyler, huge object marketplace, AI floor-plan CV  
- Keep millwork Design mode as the cabinet surface (differentiator) on the 2D plan  
- Performance, open-graph validation, migration hardening  

---

## 6. Critical path

```text
Product agenda (fixed):
  Menu → 2D creation → 3D → Render → Export

Implementation order:
  D0  topology + schema v2 + migration + fixtures/tests + tool/command contract
  D0.5  schema v2 foundation (migration + validation + catalog-ready openings)
  A   2D Build shell + tool state + undoable commands
  B   2D openings direct manipulation (+ catalog)
  C   2D dimensions / underlay / unit display preference
  D1–D4  freeform geometry (2D author → 3D compile)
  E   surfaces + structurals (2D)
  F   3D dollhouse, then optional walkthrough
  (Render + Export remain existing modes — not re-homed)
```

**Early win (not parity):** D0 → D0.5 → A → B → C on a box room, with commands already matching freeform.
**Real product threshold:** multi-room footprint + openings + cabinets snap/validate + same plan in 3D + export (after D + Design + existing Render/Export).

---

## 7. Effort reality check

| Bundle | Relative effort | User value |
| --- | --- | --- |
| D0 design spike (ADR, v2, fixtures, tests) | Medium | Makes “A implements against D0” enforceable |
| A+B+C (chrome + openings + dims on box) | Medium | High early UX; **not** parity |
| F dollhouse | Medium | High perceived polish on 3D step |
| D freeform + adjacency + blast-radius rewrites | Very high | Required for real plan product |
| E surfaces/structurals | High | After topology |
| Full Floorplanner clone | Out of product scope | Wrong goal |

Generated 3D already works for box rooms. The large investment is topology, schema v2 migration, freeform authoring, catalogized openings, and constraint/compiler rewrites — not inventing 3D from scratch or changing the product agenda.

---

## 8. Decision checklist (approve before coding)

- [ ] Confirm product agenda stays **Menu → 2D creation → 3D → Render → Export**  
- [x] Approve **D0** with the concrete exit criteria (ADR, schema v2, fixtures, v1-open-unchanged tests) before Phase D0.5  
- [x] Approve **D0.5**: land schema v2, migration/validation, and catalog-ready opening fields before Phase A/B
- [x] Approve **D1**: wall-graph domain + box-room migration (adjacency-capable model); freeform Draw Room/Wall UI deferred to D2–D4
- [x] Approve **D2**: Draw Room on plan (rectangle drag + polygon close), undoable graph rooms; shared-edge Draw Wall deferred to D3
- [x] Approve **D3**: Draw Wall on plan (segment drag, split, delete, thickness, join coincident nodes), undoable graph walls
- [x] Approve **D4**: derive floor/ceiling and move bounds, snapping, compiler, validation, cabinet constraints, and technical plans onto closed-loop topology
- [ ] Approve Phase A exit as chrome + tool/command/undo foundation (not parity)
- [ ] Approve Phase B exit: openings direct manipulation + catalog + 3D compile parity
- [ ] Approve Phase C exit: measured 2D plan readability (dims, units, underlay, style)
- [ ] Confirm target topology includes **shared walls / multi-room adjacency** in the model (v2)  
- [ ] Confirm units stay **mm in project**; toggle is display preference only  
- [ ] Confirm openings use a real **catalog** (`catalogItemId`, preview, 3D, parameters, material slots)  
- [ ] Confirm surfaces = polygon/loop + material (not paint pixels)  
- [ ] Confirm multi-room **editing** ships only after D2/D3 shared-edge/face support (not at D1 alone)  
- [ ] Confirm Structurals MVP = partition + column only  
- [ ] Confirm walkthrough is optional after dollhouse  
- [ ] Keep Design mode for cabinets; keep Render/Export ownership unchanged  
- [ ] Confirm freeform (D1–D4) is in-scope for this product year, or defer explicitly  

---

## 9. Reference index

Screenshots captured locally (Aug 26, 2026):

- Build tool list + empty room dims  
- Place Doors library (Doors / Windows tabs, search, 2D/3D thumbs)  
- Door selection inspector (preview, materials)  
- 3D dollhouse + Camera panel (height, FOV, perspective)

Related canvases (workspace `canvases/`): `floorplanner-simple-plan-roadmap.canvas.tsx`, `planner-ui-tool-comparison.canvas.tsx`.
