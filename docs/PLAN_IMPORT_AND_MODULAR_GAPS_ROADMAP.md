# Plan import and modular gaps roadmap

**Status:** In progress — Phases 0–5 landed 2026-10-05 (gola sizes from the factory table; §6.2–3 still open).
**Source:** Factory QA questions from Ilyas (production manager), 2026-10-04:
plan rotation, raising walls, centre axis, erasing a plan, L / C gola,
arch / fillet shapes, importing sinks / profiles / doors.
**Scope:** The Interiors planner (plan underlay, object rotation, plan guides)
and the shared cabinet pipeline (fronts, hardware, 3D fronts, appliance
placement). Arch / fillet geometry is assessed and deliberately deferred.
**Relationship to other docs:** Extends
[`IMPORT_PLAN_ROADMAP.md`](IMPORT_PLAN_ROADMAP.md) (underlay) and
[`WALL_DECOR_LIGHTING_ROADMAP.md`](WALL_DECOR_LIGHTING_ROADMAP.md) (host /
attachment pattern, §3.3). It changes no wall-graph, room or opening contract.

---

## 1. What already answers the QA (no work needed)

| Question | Answer in the app today |
| --- | --- |
| Raise walls after import | **Calibrate underlay** → **Draw Wall / Draw Room** (traces are `raised: false`) → **Raise to 3D** / **Raise room to 3D**; height in **Height** / **Wall height · mm**. Raster / PDF: **Generate 3D from plan**. |
| Erase an imported plan | **Remove underlay** (unlock first); **Hide** keeps it. Objects: Delete / Backspace. |
| Rotate an object | **R** / **Shift+R**, toolbar **−90° / +90°**, rail **Rotate**, inspector **Rotation**. |
| Import sink / appliance model | **Import model + textures** (GLB, glTF, FBX, OBJ + MTL). |
| Import a material | **Import texture** on any unlocked surface; **Tile mm / Rotate ° / Offset U % / V %**. |

These go into the reply to Ilyas, not into phases.

## 2. Evidence (verified in code, 2026-10-05)

- **Underlay rotation is typed only.** `LivingRoomPlanUnderlay.rotationDeg`
  (`domain/livingRoom/planUnderlay.ts:5-23`) is edited by a number field in
  `PlanUnderlayControls.tsx:86-100`. The `<image>` has `pointerEvents="none"`
  (`PlanArchitectureLayer.tsx:41-43`), so it cannot be dragged. Pan is the
  **Pan X / Pan Y** fields only. Every field change is one undo snapshot
  (`finishCommands.ts:39-52` → `commitSnapshot`), with no coalescing.
- **Rotation is inconsistent.** `rotateLivingRoomObject`
  (`planCommands.ts:66-76`) snaps to **15°**, the inspector
  (`InspectorObjectSection.tsx:65-74`) offers only **45°** steps, and wall-snap
  placement writes arbitrary `atan2` angles (`wallSegmentPlacement.ts:29`,
  `cornerPlacement.ts:68`). A 15° or wall-normal angle has no matching
  dropdown option.
- **Cabinets cannot leave 90° for production.**
  `CabinetPlacement.rotation: 0 | 90 | 180 | 270`
  (`cabinetDimensions/types.ts:59`); `cabinetFromObject` rounds to 90
  (`cabinetAdapterCabinets.ts:190, 205`); handoff raises
  `unsupported-rotation` (`handoff/handoffLossy.ts:21-30`); runs are `x | z`
  only (`cabinetRuns/types.ts:4`).
- **The centre line is not a room axis.** `.lr-center-line`
  (`PlanArchitectureLayer.tsx:48-49`) is drawn through the centre of
  `planSiteBoundsForCanvas` (`planUnderlayBounds.ts:37-49`): the union of rooms
  **and** the underlay. It moves when the underlay moves. It is display-only.
- **Door style is stored, never drawn.** Inspector **Door style**
  (Slab / Shaker / Glass, `CabinetConstructionSection.tsx:24-30`) writes
  `parameters.doorStyle`; no scene, geometry or construction code reads it.
  **Door count** is also ignored for compiled cabinets. The number of leaves comes
  from width (`cabinetAdapterCabinets.ts:146-149, 180-184`).
- **Handles exist as data only.** `CabinetHardwareSpec.handleId`
  (`hardwareSystem/types.ts:34-47`; Bar / Knob / Cup) feeds costing, the
  **Hardware Schedule** and the production CSV (`resolve.ts:50, 96`), but no
  cabinet mesh draws a handle (only the TV unit, `sceneAdaptersMillwork.ts:69-74`).
- **No gola / handleless concept** anywhere (`grep -i gola|handleless` → 0).
- **Three independent front-gap rules** that a gola must change together:
  1. 3D `storageGeometry.ts:96` (3 mm) and `measurements.ts:51-57` (4 mm).
  2. Production `doorFrontSize` (`cabinetConstruction/helpers.ts:50-75`,
     `DOOR_GAP` in `cabinetConstructionSpec.ts:86-90`). It has **no top gap**.
  3. Legacy `cabinetGeometry/cutlist.ts:197-212` (via `manufacturing.ts:11`).
- **Interiors and classic share one cabinet pipeline.** Every Interiors commit
  rebuilds `CabinetProject.cabinets` through `cabinetProjectFromInteriorProject`
  (`context.ts:49`), and 3D cabinets are the classic `createCabinetGeometry`
  boxes (`sceneAdaptersCabinet.ts:36-48`). A front change made once shows in
  both editors and in production.
- **Geometry is rectangles and straight polygons only.** Panels and countertops
  are boxes. `CompiledPolygonPrismPrimitive` (`sceneTypes.ts:81-94`) extrudes
  straight `lineTo` outlines and is used only for floor / ceiling slabs. The
  cut list is `length × width × thickness`. **There is no DXF export**
  (`machineExport/adapters/index.ts:7`: "future format").
- **Appliances are not hosted.** Sinks and hobs are free objects positioned by
  hand (`straightKitchenRun.ts:67`). The engineering side has
  `insertKind: "sink-bowl" | "cooktop" | "dishwasher-gap"`
  (`hardwareSystem/types.ts:23-27`) with no link to a model. The only
  host relation in the data is lights (`hostObjectId`).

## 3. Decisions

| # | Decision | Consequence |
| --- | --- | --- |
| G1 | **Cabinets keep 90° steps; other objects get free rotation.** | Production, runs and handoff stay valid. Furniture, decor and imported models can turn to any angle (15° snap when stepping, exact when typed). The cabinet inspector says why. |
| G2 | **Underlay gestures commit once, on release.** | A drag or rotate is one undo step. It reuses the `usePlanObjectInteraction` preview → commit pattern; no history coalescing is needed. |
| G3 | **Guides are plan data, not underlay data.** `InteriorProject.extensions.planGuides`. | Guides survive **Replace file** / **Remove underlay**. The automatic centre line stays as a fallback when there are no guides. |
| G4 | **Gola is a front system on the cabinet, not a handle item.** It is `CabinetConstructionSpec.frontSystem`, and every gap rule reads it from one resolver. | The 3D view, production parts, elevation and the hardware schedule agree. A gola cabinet reports **no handle** and **N metres of gola profile** per run. |
| G5 | **One front-gap resolver before gola.** The three rules in §2 collapse into `resolveFrontGaps(cabinet)`. | This removes today's 3 mm vs 4 mm vs `DOOR_GAP` drift. **Visible change:** 3D fronts shift by ≤1 mm on existing projects. Cut-list sizes do not change (production rule wins). |
| G6 | **Door style is drawn or hidden, never silently ignored.** | Until Phase 6 lands, **Shaker** and **Glass** are labelled "(plan only)". |
| G7 | **Appliances attach to a cabinet host the way lights do** (`hostObjectId` + offsets, resolved at read time). | Moving or resizing a sink base carries its sink. Host deletion detaches with the same alert pattern as lights. |
| G8 | **Arch / fillet / radius is deferred** until a project needs it. | It needs arc outlines in the scene, non-rectangular cut-list parts and a CNC / DXF export that does not exist yet (§5, Phase 8). |
| G9 | **No partial erase of the underlay.** | **Crop selection** (PDF) and **DWG layers** cover the need. Revisit only if a raster plan really needs it. |

## 4. Contracts (lock before implementation)

### 4.1 Underlay gestures — no schema change

The data stays `xMm / zMm / rotationDeg` on `LivingRoomPlanUnderlay`. New UI:
- **Rotate −90° / +90°** buttons beside **Rotate** (normalised −180…180).
- **Move underlay** toggle: while it is on and the underlay is unlocked, the image
  takes pointer events and dragging pans it. Space-drag still pans the view.
- **Centre on origin** (pan → 0 / 0, keeps rotation and scale).

### 4.2 Plan guides — `extensions.planGuides`

| Property | Type | Purpose |
| --- | --- | --- |
| `id` | string | stable id |
| `axis` | `"x" \| "z"` | vertical (constant X) or horizontal (constant Z) line |
| `positionMm` | number | world coordinate of the line |
| `label` | string? | e.g. "A", "1", "CL" |
| `locked` | boolean? | prevents accidental drag, typed moves and the Delete key; the panel's explicit **Delete** button still removes it |

Defaults: none. `planSiteBoundsForCanvas` keeps drawing the automatic centre
line **only when the list is empty**, and gains a **Show centre line** toggle
in plan view settings. Drawing tools snap to guides with the existing
`planSnapping` tolerance.

### 4.3 Front system — `CabinetConstructionSpec.frontSystem`

```ts
type FrontSystem =
  | { kind: "handled" }                          // default; omitted from saved specs
  | { kind: "gola"; profiles: Record<"L" | "C" | "wall", { heightMm: number; depthMm: number }> };
```

Profile sizes (factory table, 2026-10-05). Each cabinet's sizes are editable
inside the standard range and clamped to it (one decimal).

| Profile | Height (default) | Depth (default) | Where |
| --- | --- | --- | --- |
| J / L | 56.5–68 (60) | 26–27.5 (27) | Under the countertop, top front of base / drawer / sink / corner units |
| C | 73–75 (74) | 26–27.2 (27) | Between stacked drawers and stacked openings (base family and tall) |
| Wall unit | 18.8–27.2 (23) | 18.8–27 (23) | Bottom edge of wall-unit fronts |

The profile **height is the band it takes out of the front face**; the depth
is the notch into the carcass sides and the 3D recess. Profile length is the
cabinet width (L / wall) or the opening width (C). Finish is not modelled yet.

Placement rule: **L** sits under the worktop on base and tall-top fronts.
**C** sits between stacked drawer fronts and between an oven and the drawer
below it. `resolveFrontGaps` subtracts the recess from the relevant fronts.
The carcass side parts get a **notch note** (machine op `"notch"`, scalar
size), because cut-list outlines stay rectangular (G8). The hardware line is
`gola-<profile>` in metres, summed per run. Handles drop only on fronts a
profile grips (`FrontLeaf.golaGrip`: L/C along the top, wall profile along the
bottom); any other front — e.g. a lone full-height tall door — keeps its handle
and is counted on the hardware list. Gola prices in the catalog are
placeholders (labelled "placeholder price") until supplier rates arrive.

### 4.4 Hosted appliance — object `parameters`

`hostCabinetId`, `offsetAlongMm`, `offsetDepthMm`, `cutoutWidthMm`,
`cutoutDepthMm`, `insertKind` (reuses `CabinetHardwareSpec.insertKind`
values). The resolver puts the model on the worktop top surface and writes
`insertKind` back to the host cabinet's hardware spec in the same commit.

## 5. Phases

### Phase 0 — Honest UI (small)

- **Door style:** add "(plan only)" to **Shaker** and **Glass** (G6). Hide **Door
  count** for compiled cabinets, or label it "auto from width".
- **Rotation dropdown:** replace the 45° `<select>` with a number field
  (step 15) plus ±90° buttons, so stored 15° / wall-normal angles display.
- **Cabinet rotation hint:** for cabinets, the field steps 90° with the hint
  "Cabinets rotate in 90° steps so production stays square to the run."

**Exit gate:** a sofa snapped to an angled wall shows its real angle in the
inspector; R on a cabinet still steps 90°; Shaker shows "(plan only)";
`tsc --noEmit` clean.

### Phase 1 — Underlay handling (answers Q1, Q3 partly)

- §4.1 buttons and **Move underlay** drag. Follow the
  `usePlanObjectInteraction` start / move / finish pattern, with local preview and
  one `setPlanUnderlay` on pointer-up (G2).
- Respect **Lock** (no drag, buttons disabled, same hint as today).
- **Centre on origin** button.

**Exit gate:** a sideways PDF can be turned upright with one click and dragged
over a drawn room. Each gesture is one Cmd/Ctrl+Z. A locked underlay
cannot be moved. A DWG underlay keeps its layers after rotation.

### Phase 2 — Free rotation for non-cabinet objects (answers Q1)

- `rotateLivingRoomObject` keeps the 15° snap for **stepping** (R, buttons). A new
  `setLivingRoomObjectRotation` stores the typed value exactly (normalised 0–360).
- Cabinet kinds route through a 90° rounding guard (G1). Handoff behaviour is unchanged.
- Check `planSnapping` edge snap for rotated objects. It is AABB-based today,
  so it is acceptable, but document it.
  **Documented (2026-10-05):** `snapLivingRoomObject` edge targets use
  `getObjectPlanBounds`, the axis-aligned box around the rotated footprint, so a
  37° chair snaps by its bounding box. Collision and room-fit checks
  (`planConstraints`, `objectFitsRoom`) use the true rotated corners
  (`getObjectPlanCorners`), so overlap warnings stay exact.

**Exit gate:** a chair typed to 37° saves, reopens at 37° and collides correctly
(OBB). A cabinet typed to 37° lands at 0° or 90° with the hint shown. No new
`unsupported-rotation` warning on the golden run.

### Phase 3 — Plan guides / centre axis (answers Q3)

- §4.2 data. Two toolbar tools, **Guide ↕** (X) and **Guide ↔** (Z), sit next to
  Measure / Calibrate: click to place, drag to move, Delete to remove. While a
  Guide tool is active the whole line is grabbable; in Select mode only the
  bubble is, so walls drawn on a guide stay clickable. Label, position, lock
  and delete live in the **Plan guides** list under Room & plan settings.
- Snap order: an existing wall node / DWG point wins over a guide, so new walls
  still join exactly.
- **Show centre line** toggle. Guides render with the existing dash-dot
  `.lr-center-line` style plus a bubble label.
- Wall and room drawing snaps to guides.

**Exit gate:** place guides A and 1 on the plan's grid lines, draw a wall
that snaps to them, replace the underlay file, and confirm the guides remain.
Save → reopen keeps them.

### Phase 4 — Front-gap resolver (prerequisite for gola)

- `resolveFrontGaps(cabinet)` in `cabinetConstruction/`. Used by
  `storageGeometry`, `measurements`, `doorFrontSize`, elevation `faceMetrics`.
  Retire the legacy `cutlist.ts` path or route it through the same resolver.
- Unit tests: for every `DoorMount`, the 3D front height equals the production
  part height.

**Exit gate:** 3D and cut list agree to the millimetre on the golden run. The
cut-list snapshot is unchanged and the 3D shift is ≤1 mm (G5).

**Landed (2026-10-05):** `resolveFrontGaps(config)` in
`cabinetConstruction/frontGaps.ts` returns every door / drawer-front leaf in
face coordinates. Production (`partsInterior`, `partsDrawers`), 3D
(`storageOpeningPanels`), the legacy cut list (`frontCutlist`) and elevation
gap constants (`faceMetrics` via `frontGapSpec`) all read it; the 3 mm / 4 mm
rules and `doorFrontSize` are gone. `frontGapSpec(mount).topMm` is 0 today;
Phase 5 subtracts the gola recess there.
**Correction to G5:** the 3D shift is larger than 1 mm for a cabinet whose face
is one door opening. Before, 3D drew those doors inside the clear opening
(between the carcass sides); production sizes overlay doors to the full carcass
width. A 600 mm base double door goes from about 277 mm to 296 mm per leaf in
3D, matching the cut list. Split faces and drawers move by a few mm. Cut-list
sizes are unchanged; visual snapshots of 3D cabinets need re-baselining.

### Phase 5 — Gola handleless system (answers Modular Q1)

- §4.3 contract. Add a catalog entry per profile (L, C), with a hardware kind
  `"profile"` in `hardwareSystem/catalog.ts`.
- Inspector: **Fronts** → **Handle** / **Gola L** / **Gola C**, at cabinet level
  and at run level ("apply to run").
- 3D: the profile is extruded with `polygonPrismPrimitive` (straight outlines suffice)
  along the run, recessed behind the fronts.
- Production: reduced fronts, notch op on the sides, metres of profile in the
  **Hardware Schedule** and costing.

**Exit gate:** a 3-cabinet base run set to Gola L shows a continuous profile
in 3D, fronts shortened by `recessHeightMm` in both 3D and cut list, 0 handles
and run-length metres of profile in the schedule. Switching back to Handle
restores the original part sizes exactly.

**Landed (2026-10-05):** `frontSystem/` (catalog, clamping, object-parameter
mapping). Interiors inspector **Construction → Fronts: Handles / Gola
handleless** with height / depth per profile. `resolveFrontGaps` applies the
bands and returns them as `profiles`; 3D draws each as a `"metal"` box recessed
into the carcass front; side parts carry a `Gola notch: …` note; hardware drops
handles and adds `gola-l` / `gola-c` / `gola-wall` lines in metres (kind
`"profile"`), summed per run by the schedule. Switching back to Handles gives
identical parts.

**Review fixes (2026-10-05):** fronts with no profile keep their handle and
the inspector + Review panel warn about them; a gola cabinet whose run
neighbours use other sizes (or handles, in the same band) warns, and **Match
run** copies its sizes to every run member; 2D elevation fronts now come from
`resolveFrontGaps` (sizes match the cut list for every cabinet, handles drop on
gripped fronts, profile bands drawn dashed); the notch note gives its span and
reference edges; 3D profile boxes stop inside the sides / under the top.
**Not yet:** the classic editor field, profile finish, vertical / push-to-open
options for tall units, and a real CNC notch op.

### Phase 6 — Handles and door styles in 3D (answers Modular Q3, partly)

- Handle meshes from `handleId` (bar / knob / cup), positioned per front from
  the leaf hinge side. None when `frontSystem.kind === "gola"`.
- **Shaker:** front frame from the existing stile / rail fields
  (`sectionsShop.ts:97-106`) as 4 rail boxes plus an inset panel. **Glass:** a frame
  plus a transmissive panel. Drop the "(plan only)" labels.
- Production: Shaker adds stile / rail / panel parts. If the factory buys
  shaker doors ready-made, keep one door part with a `style` note instead. **Ask
  Ilyas.**

**Exit gate:** a slab / shaker / glass cabinet side by side in Model View
reviewed; handle count in 3D equals `handleCount` in the schedule.

### Phase 7 — Hosted sink and hob (answers Modular Q3)

- §4.4 contract. **Place in cabinet** on an imported or catalog appliance:
  pick a base cabinet, centre on it, and write `insertKind` to the host.
- The host's hardware drops drawer slides for a sink bowl (already in `resolve.ts:87-95`).
  The worktop cut-out is listed in the report as a note.

**Exit gate:** move the sink base 600 mm and the sink follows in one undo
step. Delete the base and the sink detaches with an alert. The hardware schedule
reflects the insert.

### Phase 8 — Arch / fillet / radius (deferred, G8)

Prerequisites before this can start, each its own decision:
1. Arc segments in `CompiledPolygonPrismPrimitive.outlineMm` (and the geometry
   cache).
2. A non-rectangular part outline in `CabinetPart`.
3. A real CNC / DXF export adapter (none exists).
4. A scope answer from the factory: which parts take arches or radii?
   (Wall openings? Door tops? Worktop corners? Shelf ends?)

Start only when a signed project needs it.

## 6. Questions for Ilyas before Phase 5–6

1. ~~Gola profiles: supplier and the real profile section (recess height and depth)?~~
   Answered 2026-10-05 with standard ranges (§4.3); supplier still unknown.
2. Which cabinets get L vs C in your standard kitchen?
3. Do you notch the carcass sides on CNC, or use a profile that needs no notch?
4. Shaker doors: made in-house (frame parts on the cut list) or bought ready-made?
5. Arch / fillet: on what exactly? A photo or drawing of a recent job helps.

## 7. Suggested order

Phase 0 → 1 → 2 can ship together as a week-one patch (Q1, the sideways plan).
Phases 3–5 landed; confirm §6.2–3 (L vs C placement, CNC notch) with Ilyas. Phases 6 and 7 are
independent and can follow in either order. Phase 8 waits.
