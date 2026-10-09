# Ceiling cutouts, two-sided box editing and COB shades roadmap

**Status:** Phases 0–2 built 2026-10-09 on `feat/ceiling-cutouts` (Phase 0: Ceiling plan layer, 3D Ceiling toggle; Phase 1: `draw-ceiling-cutout` tool, `room.extensions.ceilingCutouts`, slab holes, inspector list; Phase 2: `hostCutoutId` on the ceiling mount, COB / panel in a cutout, Fit, cutout drag on the plan). Item 2 of the brief (a room face "missing" in 3D) was fixed on `main` the same day and is not a phase (see §0). Phase 3 built 2026-10-09 on `feat/resize-anchors` (`resizeAlongAxis` + anchors on room, cabinet and cutout resizes, inspector anchor segments, 2D cutout edge handles, 3D wall face and end handles). Phase 4 remains proposed.
**Source:** Tester feedback, 2026-10-09, four items with screenshots: a plain
ceiling drawn from rectangles with cutouts for light fixtures; a room face that
renders hollow after manual room creation; rectangular model creation with
"bi-directional" adjustment from both sides; realistic lighting effects and COB
shade options.
**Scope:** The Interiors ceiling (2D plan layer, 3D surface, cutouts), resize
handles on semantic objects in 2D and 3D, and the COB / downlight fixture family
(shade variants, beam preview, render parity). Cabinet construction, pricing and
exports are untouched.
**Relationship to other docs:** Extends
[`WALL_DECOR_LIGHTING_ROADMAP.md`](WALL_DECOR_LIGHTING_ROADMAP.md) §3.2 (light
model) and Phase 4 (ceiling lighting entry points), and
[`POST_ROOM_3D_EDITING_ROADMAP.md`](POST_ROOM_3D_EDITING_ROADMAP.md) §4.4
("Scale / Resize" is P1) and §4.5 (no generic push/pull). It obeys
[`FLOORPLANNER_D0_TOPOLOGY_ADR.md`](FLOORPLANNER_D0_TOPOLOGY_ADR.md): the ceiling
stays a surface derived from the room loop; cutouts are data on the room, not
edits to a mesh.

---

## 0. Reading the brief against the app

"Built" means verified in code on 2026-10-09, not taken from a status line.

| Brief item | State | Where |
| --- | --- | --- |
| 1. Plain ceiling generated via rectangles, with cutouts for light fixtures | **Half.** Every closed room already has a flat ceiling slab compiled from its loop (`sceneCompilerSurfaces.ts:46-56`), and the prism builder already takes holes (`polygonPrismPrimitive(..., holes)`), but holes are only fed from room hole loops. There is no way to draw a cutout, and the ceiling is hidden in every exterior 3D preset (`modelViewHidesCeiling`), so the tester has most likely never seen one. Surface zones exist for floors (`createSurfaceZone`, drawn with the same rectangle/polygon tool) and the entity type already allows `kind: "ceiling"`, but zones compile 6 mm above the floor regardless of kind. | §2.1, Phases 0–2 |
| 2. One face renders hollow / missing after manual room creation | **Fixed 2026-10-09.** It was not geometry. The dollhouse **Cutaway** toggle is on by default and removed the wall nearest the camera (and its openings) from the scene (`filterModelReviewNodes`), so a fresh room looked like a box with a missing side, and orbiting moved the hole. Cut walls are now drawn as translucent, non-pickable ghosts (`modelCutawayNodeIds`, `CompiledPrimitiveView` ghost branch); the room reads as a closed shell, the toggle still lets you see in, clicks still pass through to the interior, and captures/exports keep removing the wall as before. | `modelReviewNodes.ts`, `CompiledSceneRenderer.tsx` |
| 3. Rectangular model creation with adjustment controls from both sides | **Partly.** Room Width / Depth fields scale the loop about its centre (`roomResize.ts:30-33`), so both sides move but you cannot choose which. Typed wall length has a start / end anchor (`typedWallLength.ts`). The 3D gizmo only translates (`ModelMoveGizmo.tsx`, one handle per axis); there are no resize handles in 3D. Cabinets resize from inspector W / H / D only. There is no generic rectangular "block" object. | §2.3, Phase 3 |
| 4. Realistic lighting effects and COB shade options | **Mostly built, one gap.** Nine fixture kinds exist including COB (`lightFixtureRegistry.ts:115`), each with a real three.js light: COB is a `spotLight` with beam angle, penumbra, range, shadows, brightness and colour temperature, and the Cycles still bundle mirrors it (`cyclesLights.ts:220`). What is missing is any **shade / trim choice**: the housing is always one cylinder in one body colour, there is no baffle, pinhole, gimbal or surface-cylinder variant, and no beam preview. "Realistic effects" beyond that (bloom, volumetrics, IES profiles) are not in the viewport and would cost a post-processing dependency and the honesty badge rules. | §2.4, Phase 4 |

Two things the brief does not say that change the plan:

1. **The ceiling is hidden by design in 3D.** Dollhouse, Perspective, Front,
   Side and Top all drop the ceiling so the shell is open; only Walkthrough
   keeps it. A cutout feature is invisible until there is a way to show the
   ceiling in the review views. That is Phase 0 and it is small.
2. **"Bi-directional" is an anchor problem, not a modelling-tool problem.** The
   tester wants to pull either side of a rectangle. The app already has the
   semantics for walls (anchor start / end) and for rooms (centre). The missing
   piece is handles in 2D and 3D and an anchor choice on typed fields. Generic
   push/pull stays excluded (`POST_ROOM_3D_EDITING_ROADMAP.md` §4.5).

## 1. What already answers the brief (no work needed)

| Requirement | In the app today |
| --- | --- |
| Ceiling exists, takes a material | `room.extensions.ceilingMaterialId`, generated `ceiling` surface zone, Surface paint panel |
| Ceiling-mounted COB / panel / track in one click | Room inspector "Ceiling lighting" (`CeilingLightingSection.tsx`) |
| COB emits real light with shadows and beam angle | `CobFixture.tsx` spotLight, `LightSizeSection` Beam (°), `LightToneSection` Kelvin |
| Lights follow room / wall edits, survive save → reopen | Lighting roadmap Phase 4 exit gate |
| Room rectangle and polygon drawing | Room tool, `drawRoomFromPoints` |
| Both sides of a room move on a typed size | `resizeRoomPlanGeometry` scales about the centre |
| Wall length from either end | `setTypedWallLength(anchor)` |
| Closed 3D shell after drawing a room | Cutaway ghosting (fixed 2026-10-09) |

## 2. Assessment

### 2.1 Ceiling

The ceiling is derived: `synchronizeRoomSurfaceZones` regenerates a
`kind: "ceiling"` zone from the outer loop on every edit, and the compiler
extrudes it `CEILING_SLAB_THICKNESS_MM` thick at `room.dimensions.heightMm`.
That is the right model and should not change. "Generated via rectangles"
should mean: the ceiling comes from the room (which the tester draws as a
rectangle), and rectangles drawn **on the ceiling layer** become cutouts.

Cutouts need: a plan layer to draw them on, an entity, validation (inside the
room polygon, no overlap, minimum size), the compile step (holes in the prism),
2D rendering, an inspector list with delete, and visibility in 3D.

### 2.2 Why not a ceiling surface zone for cutouts

`SurfaceZoneEntity` carries a `materialId` and compiles as a thin painted
patch. A cutout is the absence of ceiling; overloading the zone with a
"cutout" flag would push `null` materials through the paint panel, the
estimate reconcile (`interiorEstimate/surfaceKind.ts`) and the catalog
material snapshots. Keep cutouts as their own small record on the room.

### 2.3 Two-sided adjustment

Three objects need it and each already has a domain op:

| Object | Existing op | Missing |
| --- | --- | --- |
| Room rectangle | `resizeRoomPlanGeometry` (centre) | anchor choice; edge handles in 2D; face handles in 3D |
| Wall | `setPlanWallLength(anchor)` | 3D end handles; 2D end-drag already exists on nodes |
| Cutout (new) | — | edge handles in 2D, typed W / D with anchor |
| Cabinet | inspector W / H / D | anchor choice (keep left / centre / right) |

A single `ResizeAnchor = "min" | "centre" | "max"` per axis, applied by one
helper, covers all four. Handles are a UI layer over the same helper, so 2D
and 3D stay in parity (`DUAL_DOCUMENT_RULE.md`).

### 2.4 COB shades and lighting effects

The light model (`LightEntity.parameters`) is open, so shade variants are new
parameter values, not new fixture kinds. That keeps mounts, the inspector, the
plan glyph, the fixture budget and the Cycles bundle unchanged. The render
side is `CobFixture.tsx` (viewport) and `cyclesLights.ts` (stills); both must
read the same variant table.

"Realistic lighting effects" in the draft viewport is bounded by the
performance work already done (demand frameloop, caster budgets, draft quality
caps). A selected-fixture beam cone and a correct shade body are cheap. Bloom
or volumetrics are not and would need `@react-three/postprocessing`, which is
not a dependency today. They are listed as a decision, not a phase.

## 3. Decisions

- **D1 Ceiling stays derived from the room loop.** No free-drawn ceiling. Rectangles / polygons drawn on the Ceiling layer are cutouts.
- **D2 Cutouts live on the room**, `room.extensions.ceilingCutouts`, so no new top-level collection, no schema migration, and templates / older files parse unchanged.
- **D3 Cutouts are holes, not dropped panels.** A false-ceiling panel or cove step is a different feature (lighting roadmap cove entry points); not here.
- **D4 Resize handles only on semantic objects** (room, wall, cutout, cabinet). Never mesh faces. One anchor helper shared by typed fields and handles.
- **D5 Shades are variants of the existing COB / downlight kinds**, stored in `parameters`, rendered by the same two fixture files. No new `LightFixtureKind`.
- **D6 No post-processing in the draft viewport.** Bloom / glow, if wanted, goes to Render Studio behind the honesty badge and is its own decision (§6 Q4).

## 4. Contracts (lock before implementation)

### 4.1 Ceiling cutout — `room.extensions.ceilingCutouts`

```ts
type CeilingCutout = {
  id: string;                 // "cutout-1", unique within the room
  polygon: Point2Mm[];        // plan mm, world frame, ≥ 3 points, CCW
  purpose?: "light" | "service" | "feature";
  label?: string;
};
```

Rules: polygon must satisfy `roomPolygonIsValid` as a hole of the room polygon
(inside, no self-intersection, no overlap with other cutouts, area ≥ 10 000 mm²).
Compile: `ceiling` prism holes = `polygon.holes ∪ cutouts.map(polygon)`.
2D: drawn on the Ceiling layer as a dashed outline with a hatch; hidden when
the layer is off. Export: holes reach GLB and the Cycles bundle through the
existing prism primitive; no extra work.

### 4.2 Resize anchor

```ts
type ResizeAnchor = "min" | "centre" | "max";   // per axis
resizeAlongAxis(minMm, maxMm, nextSizeMm, anchor) => { minMm, maxMm }
```

`resizeRoomPlanGeometry` gains `anchors?: { x?: ResizeAnchor; z?: ResizeAnchor }`
(default `"centre"`, today's behaviour). Handles call the same function with
`anchor` set to the opposite side of the handle being dragged; Alt while
dragging switches to `"centre"`.

### 4.3 COB shade — `parameters` on `cob` and `ceiling-downlight`

| key | values | effect |
| --- | --- | --- |
| `shade` | `"open" \| "baffle" \| "pinhole" \| "gimbal" \| "surface"` | housing geometry; `pinhole` narrows the glow disc; `surface` adds a visible cylinder below the ceiling; `gimbal` enables aim |
| `trimFinish` | `"white" \| "black" \| "brass" \| "aluminium"` | body colour / metalness (reuse `LightProfileFinish` values plus brass) |
| `aimAngleDeg`, `aimRotationDeg` | 0–45, 0–359 | gimbal only; `aimAngleDeg` already exists for track |
| `lensDiffusion` | 0–1 | maps to spotLight `penumbra` (0.35–0.9), stills: spot blend |

Defaults: `shade: "open"`, `trimFinish: "white"`, `lensDiffusion: 0.5`. The
Cycles bundle reads the same table (`cyclesLights.ts` cob branch).

## 5. Phases

### Phase 0 — Show the ceiling (small)

- Plan **Layers** menu gains **Ceiling** (off by default): draws the ceiling
  outline and, later, cutouts.
- 3D toolbar gains a **Ceiling** toggle next to Cutaway (off by default in
  Dollhouse / Perspective / orthographic, on in Walkthrough, as today). When on,
  the ceiling slab renders; the cutaway ghost treatment is not applied to it.
- `modelViewHidesCeiling` becomes `(preset, override)`.

**Exit gate:** fresh rectangle room → 3D → Ceiling on shows a lit slab at wall
height from Dollhouse; Walkthrough unchanged; save → reopen keeps the toggle
off (view state, not document state). Covered by
`tests/e2e/phase-ceiling-0-layer-and-toggle.spec.ts`.

Known Phase 0 limits: the plan draws the ceiling for the active room only
(3D compiles one per raised room); the 3D toggle is component state and resets
when the model view unmounts; with the slab held open from above it lets rays
through (`pickThroughIds`) so cabinets stay clickable until Phase 1's holes
make the view useful.

### Phase 1 — Ceiling cutouts

- Ceiling and cutouts move out of `PlanArchitectureLayer` into their own
  `PlanCeilingLayer` drawn **above** the object layers, so a cutout under a
  cabinet glyph stays visible and editable. Phase 0 draws the slab beneath
  objects, which is fine for an outline but not for editing.
- A dedicated **Ceiling cutout** build tool (`draw-ceiling-cutout`, beside
  Partition / Surface / Column in Room & plan settings) reuses the Room tool's
  rectangle / polygon gesture. Built this way rather than overloading the Room
  tool when the layer is on: a layer toggle must not change what a gesture
  creates, and a user with the layer on still needs to draw rooms. Arming the
  tool shows the ceiling layer even when Layers → Ceiling is off.
- `addCeilingCutout`, `deleteCeilingCutout`, `moveCeilingCutout` on the room;
  validation per §4.1 with the existing plan status chip ("Cutout outside room").
- Compiler feeds cutouts as prism holes; skirting and fixtures unaffected.
- Room inspector "Ceiling" section lists cutouts (label, size, Delete).
- Undo / redo via the existing `commitDocument`.

**Exit gate:** fresh room → two rectangular cutouts → 3D with Ceiling on shows
two holes with the floor visible through them → GLB export has the holes →
save → reopen preserves them. Covered by `tests/e2e/phase-ceiling-1-cutouts.spec.ts`
and the unit tests in `ceilingCutouts.test.ts` / `ceilingCutoutsCompile.test.ts`;
the GLB criterion is covered only indirectly (the export reads the slab
geometry the unit test checks), not asserted on an exported file.

Known Phase 1 limits: cutouts are fixed plan coordinates and do not follow
room edits (Width / Depth, node drags, wall moves). A cutout the room shrinks
away from is left out of the slab by `compiledCeilingCutouts` and flagged by
validation until moved or deleted; moving or scaling them with the room is
Phase 3's anchor work. `moveCeilingCutout` exists in the domain only; the plan
layer does not take the pointer yet.

### Phase 2 — Fixtures in cutouts

- The ceiling mount gains `hostCutoutId` (`CeilingLightMount`); the resolver
  puts x/z at the cutout's centre at read time, so moving the cutout moves the
  fixture with no light edit. Moving a cutout also carries its lights' stored
  positions; deleting one detaches them at its last centre
  (`deleteCeilingCutoutAndDetach`); cutout ids are never reused, so a later cutout cannot inherit a light. A cutout the room
  has shrunk away from is not followed (`hostableCeilingCutout`); a 3D drag
  of the light leaves the cutout.
- Room inspector cutout rows: **COB** and **Panel** drop a fixture in flush
  (`flushCeilingDropMm`: 0 for recessed spots, half the depth for a panel),
  **Fit** resizes the cutout to the fixture's footprint plus 10 mm clearance
  (`fitCeilingCutoutToLight`; refused through a wall). The light inspector's
  Mount select lists "Ceiling cutout …" and shows Fit when hosted.
- The plan ceiling layer drags a cutout in Select mode (snapped, refused
  moves not recorded); Phase 3's handles will resize it.

**Exit gate:** a 600 × 600 cutout with a panel reads flush in Walkthrough; a
90 mm COB in a 100 mm cutout; moving the cutout moves the fixture. Covered by
`lightCutoutMount.test.ts` (resolved poses, fit sizes, fallbacks, reopen) and
`tests/e2e/phase-ceiling-2-fixtures.spec.ts`; "reads flush in Walkthrough" is
checked by the resolved y in the unit test, not by pixels.

Known Phase 2 limits: the hosted light's glyph only jumps to the new spot on
drop (the drag preview translates the cutout alone); with the ceiling layer
on, a cutout over a cabinet glyph takes the pointer, since showing the layer
means editing the ceiling; Fit sizes to the first hosted light when the Mount
select has put two in one cutout; stranded cutouts draw as a red dashed
outline ("not in ceiling") that can be dragged back in or deleted.

### Phase 3 — Two-sided adjustment

- Shared `resizeAlongAxis` + `ResizeAnchor` (§4.2); `resizeRoomPlanGeometry`
  takes anchors; Room inspector Width / Depth get an anchor segment
  (Left · Centre · Right, Front · Centre · Back).
- 2D: edge handles on the active room rectangle and on cutouts (drag an edge,
  the opposite edge stays; Alt = centre). A one-sided cutout resize moves its
  centre, so it must carry hosted lights the way `moveCeilingCutoutWithLights`
  does; `setCeilingCutoutPolygon` alone does not touch lights.
- 3D: `ModelMoveGizmo` gains face handles for the active room (four wall faces),
  the selected wall (two ends, reusing `setPlanWallLength`) and cutouts. Same
  snap step as move.
- Cabinets: inspector W gets the same anchor segment (keep left / centre /
  right edge); reflow via existing `reflowCabinetRunsForWalls`.

**Exit gate:** drag the right face of a room in 3D; the left wall does not
move; openings on the moved wall stay inside it; cabinets reflow; 2D shows the
same geometry. Covered by `tests/e2e/phase-resize-3-wall-handles.spec.ts`
(face drag, left wall fixed, Width field agrees) and the unit tests
`resizeAnchor.test.ts`, `roomResizeAnchors.test.ts`, `objectResizeAnchor.test.ts`,
`wallResizeHandles.test.ts` and the cutout case in `lightCutoutMount.test.ts`.
The face drag commits through the existing wall-translate command, which
already keeps openings inside and reflows cabinet runs and panels.

Built as: the 3D face handle moves the wall along its outward normal
(`translatePlanWall`), so the opposite wall stays; the end handles on the
selected wall drive `setPlanWallLength` with the other end anchored. The 2D
room already had this through wall and node drags, so only cutouts gained
edge handles there. Known Phase 3 limits: 3D geometry updates on release with
a live readout, not a live mesh preview; cutouts have no 3D selection, so they
resize in 2D only; a cabinet's width anchor is applied after the run reflow
and a run-managed cabinet is placed by its run.

### Phase 4 — COB shades and lighting preview

- Registry defaults and inspector **Shade** / **Trim** selects (§4.3); gimbal
  exposes Aim / Rotation.
- `CobFixture.tsx`: five shade bodies; `cyclesLights.ts` parity.
- Selected COB / downlight / track shows a translucent beam cone in the
  viewport (editor-only, `EXCLUDE_FROM_EXPORT`), so beam angle edits are
  visible without a render.
- Render QA references regenerated for the fixtures that changed.

**Exit gate:** each shade reads distinct at Dollhouse zoom; a Cycles still of
the same room matches the viewport body and beam; perf: no new continuous
frameloop, caster budget unchanged.

## 6. Open questions

- **Q1** Did the tester mean drawing the ceiling itself from rectangles (a
  false-ceiling layout with steps and coves) or only the cutouts? This roadmap
  assumes cutouts; a false-ceiling layout is a separate roadmap.
- **Q2** "Rectangular model": the room rectangle, or a generic box object (a
  bulkhead, a platform)? Phase 3 covers rooms, walls, cutouts and cabinets. A
  generic box would be a new catalog object kind.
- **Q3** Which COB shades are in the sales catalogue? The five in §4.3 are a
  guess; get the SKU list from Ilyas before Phase 4.
- **Q4** Is "realistic lighting" about the draft viewport or Render Studio
  stills? Stills already carry real spot lights through Cycles. Bloom in the
  viewport is a post-processing dependency and a performance decision (§3 D6).

## 7. Order and rough size

| Phase | Depends on | Size |
| --- | --- | --- |
| 0 Show the ceiling | — | ½ day |
| 1 Cutouts | 0 | 2 days |
| 2 Fixtures in cutouts | 1 | 1 day |
| 3 Two-sided adjustment | — (parallel) | 3 days |
| 4 COB shades | Q3 | 2 days |

## 8. Not changing

- Room topology (walls as graph edges), `synchronizeRoomSurfaceZones`.
- Fixture kinds, mounts, the light inspector layout, `LIGHT_RENDER_SCALE`.
- Cutaway behaviour beyond today's ghosting fix; captures and exports still
  drop the near wall.
- Any post-processing in the draft viewport (D6).
