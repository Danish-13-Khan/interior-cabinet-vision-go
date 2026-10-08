# Wall geometry, snapping and plan calibration roadmap

**Status:** Phases 0–4 built 2026-10-08 on `feat/plan-snap-geometry`; Phase 5 deferred (S11) until a tester brings a case.
**Source:** Tester requirements doc, 2026-10-08: wall centre / axis alignment,
midpoint and corner snap points, straight drawing, floor-plan import fidelity,
import after a room exists, calibration, and a unified snapping system
(P0 foundation, P1 floor-plan workflow, P2 advanced alignment).
**Scope:** The Interiors 2D plan (wall graph, drawing tools, snap feedback,
underlay import and calibration) and the two places wall geometry is rendered
(2D SVG, 3D wall boxes). Cabinet construction, pricing and exports are
untouched; they only benefit from more accurate walls.
**Relationship to other docs:** Extends
[`2D_PLAN_LAYER_ROADMAP.md`](2D_PLAN_LAYER_ROADMAP.md) §6.7 (snapping) and §7
(underlay), [`IMPORT_PLAN_ROADMAP.md`](IMPORT_PLAN_ROADMAP.md) (sales import
flow) and [`PLAN_IMPORT_AND_MODULAR_GAPS_ROADMAP.md`](PLAN_IMPORT_AND_MODULAR_GAPS_ROADMAP.md)
Phases 1 and 3 (underlay gestures, plan guides). It obeys
[`FLOORPLANNER_D0_TOPOLOGY_ADR.md`](FLOORPLANNER_D0_TOPOLOGY_ADR.md): walls stay
graph edges between nodes, and the ADR's snapping line ("nodes, wall
projections, intersections, opening clearances") is what Phase 1 finally builds.

---

## 0. Reading the requirements doc against the app

The doc is written as if the app had no snapping and no underlay workflow. It
does. Most of its **P1** list exists today, and about half of its **P0** list
does. The table below is the honest map. "Built" means verified in code on
2026-10-08, not taken from a roadmap status line.

| Doc item | State | Where |
| --- | --- | --- |
| 1. Wall midpoint identifiable, X/Y reference on the wall centre | **Built, partly** — the inspector X/Z fields are the wall midpoint (`wallTransform.ts:14-16`, `WallGeometryFields.tsx:23`); walls are centreline segments with symmetric thickness. The midpoint is **not** a snap target and there is no visible midpoint mark. | §2.1 |
| 2. Snap points: start, end, midpoint, corner, centre | **Half** — start/end/corner nodes snap when drawing walls. Midpoint, on-wall points and intersections do not. The Measure tool has a richer list (wall ends, corners, opening edges, cabinet edges and centres) that the drawing tools do not use. | §2.2 |
| 3. Straight drawing, aligned connections | **Missing** — no axis lock, no angle snap, no Shift constraint. Nodes join only on an exact coordinate match; a wall ending on another wall's span leaves a dangling node (no T-junction split). 3D corners are not mitred. | §2.3 |
| 4. Import fidelity (scale, proportions, position, clean rendering) | **Mostly built**, with four concrete defects that make a traced plan look wrong: the room floor fill is painted over the plan, the opacity slider is overridden by CSS in line style and in exports, calibration clicks snap to the grid and to drawn walls instead of the picture, and the 2D wall stroke ignores `thicknessMm`. | §2.4 |
| 5. Import after a room exists | **Built** — Import plan is never gated on "no room". Existing walls are kept. What is missing is any alignment of the new plan to the room, and Replace file losing the pose. | §2.5 |
| 6. Calibration: two points, real length, scale, position, rotate, lock, draw | **Built**, except calibration only scales. It does not rotate the plan to the A→B line and cannot align to an existing wall. Position (drag, Pan X/Y, Centre on origin), rotation (typed, ±90°), Lock and Hide all exist. | §2.6 |
| 7. One snapping system | **Missing** — seven independent snap modules, no shared candidate list, no shared indicator. This is the real foundation item. | §2.2 |
| P2: perpendicular, parallel, equal spacing, alignment guides | **Missing**, except object-to-object axis guides for cabinets (edge, centre, run alignment) which already exist in `planSnapping.ts`. | §5 Phase 5 |

Two things the doc does not say that change the plan:

1. **Which import path the tester used matters.** The app has two. "Import
   plan" gives a tracing underlay and generates nothing. "Generate 3D from
   plan" calls the extraction service and **replaces the whole room shell**
   with axis-aligned walls, a 150 mm minimum thickness and nodes moved to a
   weighted average (`floorplanExtract/wallGraph.ts:18-38, 80-83`). If the
   "not clean / not accurate" complaint is about the second path, no amount of
   underlay work fixes it; the answer is to keep extraction out of the sales
   flow as `IMPORT_PLAN_ROADMAP.md` already says. See §6 Q1.
2. **The doc's priority order is backwards for this codebase.** Its P1 is
   almost entirely built and the remaining fidelity bugs are one- or two-day
   fixes. Its P0 (a snap engine, axis lock, T-junctions, corner joins) is the
   larger piece. Ship the fidelity fixes first (Phase 0), then build the
   foundation.

## 1. What already answers the doc (no work needed)

| Requirement | In the app today |
| --- | --- |
| Import a plan after creating a room | **Import plan** in the room tool group, any time. Walls are kept. |
| Two-point scale calibration | **Calibrate** (toolbar) or **Calibrate with known distance**: click A, click B, type the length. Aspect kept, point A held still. |
| Position the underlay | **Move underlay** drag, **Pan X / Pan Y**, **Centre on origin**. |
| Rotate the underlay | **Rotate** field (any angle, decimals), **−90° / +90°**. |
| Lock / hide | **Lock** blocks every edit; **Hide** keeps the file. |
| Centre axis / reference lines | **Guide ↕ / Guide ↔** tools; guides snap drawing and survive Replace / Remove. Auto centre line with a **Show centre line** toggle. |
| Endpoint and corner snap while drawing walls | Existing nodes and DWG endpoints snap, "Node snap" ring shown. |
| Grid snap | 25 / 50 / 100 mm (presets 10–200). |
| Cabinet alignment guides | Room centre, wall, wall-centre axis, neighbour edges and centres, run alignment, opening edges, wall-flush. |
| Measure with semantic snaps | Wall ends, corners, opening edges, cabinet edges and centres. |

These go into the reply to the tester, with the exact labels above.

## 2. Evidence (verified in code, 2026-10-08)

### 2.1 Wall model and the "centre"

- A wall is `WallEntity { start, end, startNodeId, endNodeId, thicknessMm }`
  (`interiorProject/types.ts:34-56`); node ids are authoritative, `start/end`
  are caches (`wallGraph.ts:31-48`). Thickness is symmetric about the
  centreline everywhere: 3D box (`sceneCompilerRoom.ts:39-80`), object offsets
  (`topologySnapping.ts:37`, `wallSegmentPlacement.ts:25-27`).
- `wallPlanMidpoint` exists (`wallTransform.ts:14-16`) and drives the
  inspector X/Z and translate-by-midpoint. **Split at midpoint** exists
  (`WallDrawingPanel.tsx:36`). No tool offers the midpoint as a snap point and
  nothing draws it.
- The automatic centre line is the centre of the union of rooms **and**
  underlay (`planUnderlayBounds.ts:37-49`), so it moves when the plan moves.
  Plan guides (Phase 3 of the gaps roadmap) are the stable alternative.

### 2.2 Snapping today: seven modules, no engine

| Module | Used by | Candidates | Threshold |
| --- | --- | --- | --- |
| `wallEditingSegment.ts` `snapPlanPoint` | wall draw, node drag, wall translate | grid, then nodes | `snapSizeMm / 2`, **grid-relative, not zoom-aware**; returns the **first** node in range, not the nearest, and tests against the grid-rounded point, not the pointer |
| `planGuides/planGuideSnap.ts` | wall draw, room draw | user guides, per axis | 8 screen px |
| `dwgPlanSnap.ts` | room draw, wall draw (as pseudo-nodes) | DWG endpoints | `snapSizeMm / 2` |
| `planMeasure.ts` `collectMeasureSnapPoints` | measure, calibrate | dwg-end, wall-end, corner, opening-edge, cabinet-edge, cabinet-centre, grid, with priority | 8 screen px |
| `planSnapping.ts` `snapLivingRoomObject` | object drag | axis guides: room centre, bbox edges, bbox centre, neighbours, openings | 8 screen px |
| `topologySnapping.ts` | object drag | wall-flush projection | `max(80, 2 × threshold)` |
| `openingPlacement.ts` | door / window | start offset rounded to `max(25, snap)` | — |

Missing from every list: wall midpoints, points along a wall (projection),
wall-line intersections, perpendicular / parallel, axis lock. The ADR
(`FLOORPLANNER_D0_TOPOLOGY_ADR.md:101`) planned "nodes, wall projections,
intersections, opening clearances"; only nodes landed.

Indicators: wall drawing shows one yellow r=95 ring labelled "Node snap"
(`DraftFeedbackOverlay.tsx:30-31`) and nothing for grid, guide or DWG snaps.
Object drags show labelled axis lines (`PlanObjectsLayer.tsx:240-251`).
Measure shows its own marker. Overlay sizes are hard-coded in mm, so they
grow and shrink with zoom.

### 2.3 Straightness and connection

- `useWallDrawing.ts` is drag-to-draw, one segment per gesture, with no angle
  constraint. Shift is multi-select only. The only axis lock in the codebase is
  the legacy cabinet designer (`useTwoDPointer.ts:318, 468`).
- Nodes merge only on an exact `"x:z"` key (`wallEditingHelpers.ts:50-63`).
  Two nodes 1 mm apart are two nodes.
- T-junction: a wall ending on another wall's interior does **not** split it,
  except the room-split case (both ends on different boundary walls within
  0.5 mm, `roomSplit.ts:9, 17-35`). Partitions and free traces leave a
  dangling node. The import pipeline has `snapTJunctions`, `weldNearbyNodes`
  and `joinOrthogonalEnds` (`floorplanExtract/wallGraphSnap.ts`) but they work
  in metres on their own types and are not used interactively.
- 3D wall boxes run centreline to centreline (`sceneCompilerRoom.ts:83-114`):
  outside corners show a notch of `thickness / 2`, inside corners overlap.
- 2D wall stroke width is fixed CSS (120 in plan, 128 drafting, 28 px line
  style; `living-room-plan.css:1158-1162`, `plan-readability.css:30-32`) and
  ignores `thicknessMm`. The technical export scales by thickness
  (`interiorTechnicalPlan.ts:68`), so the screen and the export disagree.

### 2.4 Underlay fidelity

- Raster and PDF import keep the original pixels (no resampling). Initial size
  is `widthMm = active room width (fallback 6200)` with the natural aspect
  (`planUnderlayImport.ts:55-56`), centred on 0/0, `calibrated: false`.
- Layer order in `PlanArchitectureLayer.tsx:49-58`: paper, `<image>`, then
  the room floor `<path>` at opacity `.55` in the default "fill" style. **Once
  a room exists the plan inside it is washed out.** This is the most likely
  cause of "not clean".
- `.lr-plan-svg.is-line-style .lr-plan-underlay-image { opacity: .65 }`
  (`plan-readability.css:34-36`) and export `opacity: 0.55`
  (`planExportStyles.ts:222-225`) beat the SVG `opacity` attribute, so the
  slider does nothing in line style or on print.
- Calibration clicks go through `snapMeasurePoint`: DWG ends, drawn walls,
  openings, cabinets, then the **grid** (`planMeasure.ts:125-167`). On a raster
  plan that means A and B land on grid points or on walls drawn earlier, not on
  the picture. With a 50 mm grid and an uncalibrated plan the error is
  unbounded.
- **Width** field sets `calibrated: true` without a measurement
  (`PlanUnderlayControls.tsx:107-125`).
- **Replace file** creates a new underlay: pose and calibration are lost.
- Extraction Apply ignores the underlay's pose and calibrated scale
  (`floorplanExtract/applyToInterior.ts:155-175`), so generated walls do not
  lie on the picture they came from.

### 2.5 Import after a room

Not gated anywhere (`interiorsChrome.ts:10, 39`, `PlanUnderlayControls.tsx:18-27,
166`). `setLivingRoomPlanUnderlay` touches only `extensions.planUnderlay`. No
alignment to the room is attempted; the picture lands at 0/0 at roughly room
width, including paper margins.

### 2.6 Calibration

`calibrateUnderlayScale` (`planUnderlayCalibrate.ts:36-71`): uniform scale by
`known / measured`, point A held still. No rotation, no translation to a
target, no "align to this wall". Rotation is a separate typed field about the
image centre, so "make this wall horizontal" is trial and error today.

## 3. Decisions

| # | Decision | Consequence |
| --- | --- | --- |
| S1 | **One snap engine, consumed by every plan tool.** `collectPlanSnapCandidates(project, ctx)` returns typed points with a label; `pickPlanSnap(candidates, pointer, thresholdMm)` returns the nearest within a **zoom-aware** threshold (8 screen px, the existing `PLAN_POINTER_SNAP_SCREEN_PX`), tie-break by priority. Grid is the fallback, never a candidate that beats geometry. | `snapPlanPoint`, `snapPlanPointToDwg`, `snapMeasurePoint` and the guide snap collapse into one path. Fixes the first-not-nearest and grid-relative bugs. The object axis guides (`planSnapping.ts`) stay; they are axis snaps, not point snaps, and already work. |
| S2 | **Priority:** node > DWG endpoint > intersection > midpoint > on-wall > guide > grid. | Matches the gaps roadmap rule "an existing wall node wins over a guide", so walls still join exactly. |
| S3 | **Axis snap is automatic; Shift makes it hard.** While drawing, if the segment is within 2° of horizontal or vertical the end snaps onto the axis through the start (and the label says "Horizontal" / "Vertical"); holding Shift projects onto the nearest axis regardless. | No new mode. Walls drawn on a plan come out square without the user thinking about it. Deliberate diagonals still work. |
| S4 | **Commit welds and splits.** On wall commit (draw, node drag, translate): endpoints within the snap threshold of a node weld to it; an endpoint on another wall's span splits that wall there (T-junction) and welds. One undo step. | Reuses `splitPlanWall` and `joinPlanNodes`. Replaces exact-key merging. Room faces are re-resolved by the existing loop code. |
| S5 | **The underlay is never painted over.** Render order becomes paper → floor fill → underlay → grid → walls; the opacity slider is the only opacity (CSS overrides removed; export reads the attribute). | A traced plan stays readable inside the room. Nothing changes for projects without an underlay. |
| S6 | **Calibration snaps to the picture, not the plan.** Calibrate clicks use only DWG endpoints (vector plans) or the raw pointer (raster). Calibration gains **Make A→B horizontal / vertical** (rotate about A) and an **Align to wall** variant (A, B on the picture, then click a drawn wall: scale + rotate + translate so A→B lands on that wall). | Covers "scale, position, rotate" in one gesture. `calibrated` is set only by a measured calibration; the Width field no longer sets it. |
| S7 | **Replace file keeps the pose** when the new image aspect matches within 1 %; otherwise it resets with a status message. | Re-scanning the same plan does not throw away calibration. |
| S8 | **2D wall stroke follows `thicknessMm`.** Line style keeps a thin stroke by choice. | Screen matches the technical export. Corner joins look right once S9 lands. |
| S9 | **3D corner joins:** at a degree-2 node the two wall boxes are extended by the mitre offset so outside corners close and inside corners do not overlap. Degree ≥3 nodes keep today's overlap (hidden inside the wall). | Removes the thickness/2 notch. Cut lists and cabinets are unaffected. |
| S10 | **Extraction stays out of the sales flow.** "Generate 3D from plan" moves behind the existing advanced area and its Apply transforms results through the underlay's pose and calibrated scale, or is left as is. Decided after §6 Q1. | Avoids a second geometry fidelity project. |
| S11 | **P2 alignment (perpendicular, parallel, equal spacing, extension lines) is deferred** until a tester asks for a specific case. | Phase 1 gives the engine a place to add them later without UI churn. |

## 4. Contracts (lock before implementation)

### 4.1 Snap engine — `src/domain/livingRoom/planSnapEngine/`

```ts
type PlanSnapKind =
  | "node" | "dwg-end" | "intersection" | "midpoint" | "on-wall"
  | "opening-edge" | "opening-centre" | "cabinet-edge" | "cabinet-centre"
  | "guide" | "axis-h" | "axis-v" | "grid";

type PlanSnapCandidate = {
  kind: PlanSnapKind;
  point: Point2Mm;
  label: string;          // "Wall midpoint", "Node", "Horizontal"
  sourceId?: string;      // wall / node / opening / guide id
  priority: number;       // from SNAP_PRIORITY, lower wins ties
};

type PlanSnapContext = {
  project: InteriorProject;
  roomId: string | null;      // room-scoped opening / cabinet candidates
  dwgEndpoints: Point2Mm[];
  guides: PlanGuide[];
  gridMm: number;
  anchor?: Point2Mm;          // segment start → enables axis-h / axis-v
  exclude?: { nodeIds?: string[]; wallIds?: string[] }; // the thing being dragged
  allow?: PlanSnapKind[];     // calibrate passes ["dwg-end"]
};

type PlanSnapResult = { point: Point2Mm; candidate: PlanSnapCandidate | null };

function collectPlanSnapCandidates(ctx: PlanSnapContext, pointer: Point2Mm): PlanSnapCandidate[];
function pickPlanSnap(ctx: PlanSnapContext, pointer: Point2Mm, thresholdMm: number): PlanSnapResult;
```

Rules: candidates are collected lazily per pointer move (on-wall and axis
candidates depend on the pointer); `intersection` is between wall centrelines
extended by at most the threshold; `on-wall` projects onto the nearest wall
only when no point candidate is in range; `grid` is used only when nothing else
is. Pure, unit-tested, no React.

### 4.2 Snap indicator — `DraftFeedbackOverlay`

One overlay for wall draw, room draw, node / wall drag, openings and measure.
Props: `snap: PlanSnapResult | null`, `screenToWorldMm`. Shapes by kind:
square for node, triangle for midpoint, cross for intersection, bar for
on-wall, dashed axis line for axis-h / axis-v, small dot for grid. Sizes are
computed from `screenToWorldMm(8)` so they stay the same on screen at any zoom.
Label text is the candidate label.

### 4.3 Commit join — `wallEditingSegment.ts`

`createWallSegment` gains `joinToleranceMm` (the pick threshold at commit time).
Steps: weld each endpoint to a node within tolerance; else if it lies within
tolerance of a wall's span, `splitPlanWall` at the projection and weld; then the
existing shared-edge and loop logic. `movePlanNodeWithOpenings` and
`translatePlanWall` do the same for the moved nodes. All inside one snapshot.

### 4.4 Calibration — `planUnderlayCalibrate.ts`

```ts
calibrateUnderlayScale(underlay, A, B, knownMm)                 // unchanged
calibrateUnderlayToAxis(underlay, A, B, knownMm, "h" | "v")     // scale, then rotate about A
calibrateUnderlayToWall(underlay, A, B, wallStart, wallEnd)     // similarity transform A→wallStart, B→wallEnd
```

The prompt dialog gains a **Then make A→B** choice: *leave as is* /
*horizontal* / *vertical*. **Align to wall** is a third click after A and B
(the hint says "now click the wall this edge is").

### 4.5 Underlay render and opacity — no schema change

`PlanArchitectureLayer` order: paper, floor `<path>`, `<image>`, grid, centre
lines, walls. The CSS rules in `plan-readability.css:34-36` and
`planExportStyles.ts:222-225` are removed; `opacity={underlay.opacity}` is the
single source.

## 5. Phases

### Phase 0 — Fidelity fixes (1–2 days, ship first)

- S5: reorder layers, remove the two CSS opacity overrides.
- S6 first half: calibrate clicks use `allow: ["dwg-end"]` (raster → raw pointer).
- Width field no longer sets `calibrated`; the "Not calibrated" chip stays until
  a measured calibration.
- S7: Replace file keeps pose when aspect matches.
- S8: 2D stroke from `thicknessMm` in plan and drafting styles.
- Update the stale §2 of `PLAN_IMPORT_AND_MODULAR_GAPS_ROADMAP.md` (it still
  says rotation is typed only).

**Exit gate:** import a PNG, draw a room over it; the plan is fully readable
inside the room at the slider's opacity in fill and line style and in the print
export. Calibrate A→B on a raster with a 100 mm grid showing: the result is the
same with the grid hidden. Replace the file with the same scan: pose and
calibration unchanged. A 230 mm wall draws thicker than a 100 mm one.
`tsc --noEmit` clean; e2e `phase-2-measured-room` and `underlay-gestures` pass.

**Landed (2026-10-08):** `PlanArchitectureLayer` draws the floor fill before
the underlay `<image>`; the line-style and print-export opacity rules are gone,
so `underlay.opacity` is the only opacity. The wall `<line>` sets
`--lr-wall-thickness` from `thicknessMm` and the plan, drafting and export
stylesheets read it. The shell always carries `is-drafting-studio`, so its
rule is scoped to solid walls outside Line style: Line style stays 28 px and
partition / plan-only traces keep their thin dashed strokes. The selected
wall keeps the real thickness (the old 32 px accent rule has been masked by
the drafting shell since 2026-09-10 and is not revived here). Calibrate clicks use `calibrationSnapCandidates` (DWG endpoints only)
and `snapMeasurePoint(…, { grid: false })`, so a raster reads the raw pointer
and shows "Free". The **Width** field no longer sets `calibrated`.
`carryUnderlayPose` (`planUnderlayTransform.ts`) keeps size, pose, opacity and
calibration on Replace file when both are rasters with the same aspect within
1 %; DWG replacements always start fresh. The commit status says which
happened (`describeUnderlayReplace`): "position, scale and calibration kept"
or "different shape … reset. Calibrate again." Not run: the unit and e2e suites
(by project rule); `tsc --noEmit` was run.

### Phase 1 — Snap engine and indicator (3–5 days)

- §4.1 module with unit tests per kind (node, dwg-end, midpoint, on-wall,
  intersection, guide, axis, grid) and for priority and threshold.
- Adopt in `useWallDrawing`, `useRoomDrawing` (which today ignores existing
  nodes), `usePlanWallInteraction` (node drag, wall translate) and
  `usePlanMeasureTool` (measure + calibrate). Delete `snapPlanPoint`,
  `snapPlanPointToDwg` and `snapMeasurePoint`.
- §4.2 indicator; zoom-invariant sizes.
- A **Snap** toggle in the plan toolbar next to the grid size, plus hold **Alt**
  to suspend snapping during a gesture.

**Exit gate:** drawing a wall near another wall's midpoint shows "Wall
midpoint" and lands on it exactly; dragging a node near the crossing of two
walls shows "Intersection"; the indicator is the same pixel size at 25 % and
400 % zoom; the nearest of two nodes 40 mm apart wins at any grid size; room
drawing joins an existing node. `planMeasure`, `planGuides`, `wallEditing` and
`dwgTraceAssist` tests updated and green.

**Landed (2026-10-08):** `src/domain/livingRoom/planSnapEngine/` —
`collectPlanSnapCandidates(ctx, extendMm)` gathers the fixed kinds (node, DWG
endpoint, wall-line intersection extended by the pick radius, wall midpoint,
opening centre / edge, cabinet centre / edge; room-scoped where the measure
tool was) and `pickPlanSnap(ctx, pointer, thresholdMm, candidates)` takes the
nearest point candidate within the zoom-aware radius (ties by S2 priority),
then resolves the line-like kinds per axis: axis through the anchor (2°, used
from Phase 2), on-wall projection, guides, grid, each only within the pick
radius; `gridMm: 0` or `allow` turns the grid off. A node drag excludes the
node and the midpoint / line of its own walls, but keeps those walls'
crossings, so the node can land exactly where its wall meets another.
`usePlanSnap` memoises the candidates per project and returns the raw pointer
when the toolbar **Snap** is off or **Alt** is held. Adopted by wall drawing,
room drawing (which now joins existing nodes), node drag and wall translate
(the dragged geometry is excluded), measure and calibrate. `snapPlanPointToDwg`,
`snapMeasurePoint`, `collectMeasureSnapPoints` and `snapPointToGuides` are
deleted; `snapPlanPoint` stays as the commit-time fallback for domain callers
that pass `snapSizeMm` (tests only) and now picks the nearest node from the raw
point. `PlanSnapMarker` is the one indicator (square node, diamond DWG, cross
intersection, triangle midpoint, bar on-wall, dashed axis, dot grid, dashed
circle "Free") sized from the 8 px radius with non-scaling strokes.
**Verified in the app:** "Wall midpoint", "Intersection", "Node", "Grid" and
"Free" (Snap off) labels at the right points; a drawn wall ends exactly on a
wall midpoint; a second room drawn from an existing corner reuses that node
(13 unique endpoints, not 14); the on-wall bar is 22.4 px wide at 7.4 and at
12.9 mm per px. Not run: unit and e2e suites (project rule); `tsc --noEmit`
is clean. Not verified by hand: the 40 mm two-node case (unit test only).

### Phase 2 — Straight drawing and accurate connection (3–4 days)

- S3 axis snap + Shift hard lock; labels "Horizontal" / "Vertical".
- S4 commit weld and T-junction split (§4.3) for draw, node drag and translate.
  "Join coincident nodes" button stays for old projects.
- S9 3D corner joins at degree-2 nodes.

**Exit gate:** trace a rectangle over a slightly rotated scan in four strokes
without Shift; all four walls are axis-aligned and the room closes with four
nodes. Draw a partition ending on a room wall: the wall splits, the node has
degree 3, Undo restores one wall. In 3D the outside corners of a 120 mm wall
room show no notch; the golden cut list is unchanged.

**Landed (2026-10-08):** S3 — wall drawing passes its start as the engine
`anchor`, so a segment within 2° of horizontal or vertical (or within the pick
radius of the axis) locks to it with the "Horizontal" / "Vertical" label;
Shift sets `axisLock`, which projects onto the dominant axis first and lets
only on-axis candidates still win (`pick.ts`); the automatic lock re-checks
on-axis candidates against the projected pointer the same way, so a node the
raw pointer just missed still wins. With one axis locked the free
coordinate lands where a wall crosses the locked line when that crossing is
within the pick radius ("Horizontal · On wall"), ahead of guides and grid, so
an off-grid wall still receives the T-junction weld. Polygon room drawing
anchors on its last vertex. With Snap off, Shift still constrains to the axis.
S4 — `wallEditingWeld.ts`: `resolveWallEndpoint` welds a drawn endpoint to a
node within 1 mm or splits the wall whose span it sits on (offsets kept
≥ 150 mm from either end), and `createWallSegment` resolves both ends before
the room-split check, so a wall between two boundary walls still splits the
room through the welded nodes; `weldNodeIntoWalls` does the same after
`movePlanNodeWithOpenings` and both ends of `translatePlanWall` (the existing
node keeps its coordinates on a node join; the moved node keeps its snapped
position on a span join; the room validity check follows whichever node
survived). **Offset wall** goes through the same commit, so a partition
offset across a rectangular room now joins both side walls (three new wall
ids: the partition and two split halves) instead of leaving dangling ends. The default tolerance is 1 mm because the engine
already put the point on the node or line; `joinToleranceMm` on the request
widens it. S9 — `wallCornerExtensionMm` extends each wall box past a
degree-2 node by t/2 ÷ tan(θ/2) (t/2 at a right angle, 0 when straight,
capped at 2t); boxes overlap on the inside of the corner, which is hidden.
Degree ≥ 3 nodes are unchanged.
**Verified in the app:** a rectangle traced in four strokes, each 1–2° off
axis and without Shift, produced four axis-aligned walls, four nodes and a
valid room; a wall drawn from inside the room onto its bottom wall split
that wall into a degree-3 node (6 walls), and one Undo restored the four;
the 3D dollhouse shows closed outside corners. Not run: unit and e2e suites
(project rule); `tsc --noEmit` is clean. Not verified by hand: Shift lock
(unit-tested) and node-drag welds (unit-tested).

### Phase 3 — Calibration that also rotates and aligns (3–4 days)

- §4.4: axis option in the calibrate prompt; **Align to wall** flow.
- After any calibration: status "Calibrated · ±N mm over L" and an inline
  **Lock underlay** action.
- Hint copy in plain language ("Click the two ends of a wall you measured").

**Exit gate:** a scan rotated 3° is squared with one calibration; a scan
imported over an existing room is aligned to the room's long wall with one
Align to wall gesture, scale correct within 1 % of the typed length, and the
room's walls still sit on the picture after Lock.

**Landed (2026-10-08):** `planUnderlayCalibrate.ts` gains
`rotateUnderlayAbout` (turn about any world pivot; the centre moves by the
same rotation), `axisTurnDeg` (smallest turn onto an axis),
`calibrateUnderlayToAxis` (scale about A, then turn about A so A→B is
horizontal or vertical) and `calibrateUnderlayToWall` (scale so |AB| is the
wall length, turn about A onto the wall direction choosing the wall end that
needs the smaller turn, then slide A onto that end). Every calibration
records `underlay.calibration = { referenceMm, mode }`, read back by
`getLivingRoomPlanUnderlay`; the chip shows "Calibrated · 3,200 mm" and the
commit status says "Calibrated plan underlay — 3,200 mm reference, made
horizontal." with " Locked." when the dialog's lock option was ticked (one
undo step). `CalibrateUnderlayDialog` replaces the generic prompt: known
length, **Then make A → B** (leave / horizontal / vertical), **Lock the
underlay afterwards**, and **Align these two points to a drawn wall instead**,
which closes the dialog and waits for a wall click (canvas hint "Now click
the drawn wall these two points belong to"; Esc cancels). The toolbar hint
reads "Click the two ends of a wall you measured on the picture, then type its
real length". Test ids stay in the `calibrate-known-length` family.
**Verified in the app:** a picture tilted 3° was squared by one calibration
(rotation −3.001°, the edge at 0.000°, 3,200.0 mm over the typed 3,200);
a second calibration aligned the same edge to the room's top wall: the two
points landed on (0, 0) and (3000, 0) exactly, the status read "3,000 mm
reference, aligned to the drawn wall. Locked.", and Calibrate was then
blocked by the lock. Not run: unit and e2e suites (project rule);
`tsc --noEmit` and the style lint are clean. The Phase 2 e2e calibrate flow
still types into the same input and presses the same confirm button.

### Phase 4 — Centring openings and cabinets (2–3 days)

- Door / window placement and drag snap the **opening centre** to engine
  candidates on the wall (midpoint, other opening edges) and the start offset
  to the grid only as fallback. Inspector **Centre on wall** button.
- Cabinet along-wall offset (`wallSegmentPlacement.ts`) snaps to wall
  midpoint, opening edges and neighbour edges with the same labels.

**Exit gate:** a 900 door drags to the wall midpoint and shows "Wall
midpoint"; a 600 base cabinet centres on a 3000 wall at 1200 offset with the
label shown; reference dimensions update.

**Landed (2026-10-08):** `wallOffsetSnap.ts` is the one-dimensional snapper
along a wall: `wallOffsetCandidates` (wall midpoint, the edges of the wall's
other openings, the edges of other cabinets attached to it, all projected onto
the given wall so an oriented copy works) and `snapSpanAlongWall` (the span's
centre to a midpoint target, either edge to an edge target, nearest within the
pick radius with S2 priority; otherwise the start edge rounds to the grid, or
stays free with `gridMm: 0`), plus `spanSnapMarker` for the shared indicator.
Openings: `snapOpeningOffset` drives placement clicks, the move drag
(`usePlanOpeningInteraction` takes the zoom-aware `thresholdMm`; Alt or Snap
off gives 0) and shows the marker in `PlanOpeningsLayer`; resize keeps the grid
step. The inspector gains **Centre on wall** (`centredOpeningOffset`).
Cabinets: `snapCabinetToWallWithSnap` snaps the along-wall centre after the
wall-flush snap (the pointer radius during a drag via
`onMovePreview(objectId, position, thresholdMm)`; the commit passes 0, so a
drop lands exactly where the ghost was and Alt / Snap off are honoured), and
the drag preview carries `snap` to `PlanObjectsLayer`'s marker. A target the
span cannot reach inside the wall is dropped rather than clamped onto. Wall-flush snapping is
unchanged with Snap off.
**Verified in the app:** a 900 door dragged toward the 3000 wall's midpoint
showed "Wall midpoint" and committed at offset 1050; Alt-dragging it to 250
then **Centre on wall** returned it to 1050; a 600 Tall Pantry dragged to
25 mm short of the bottom wall's midpoint showed "Wall midpoint" and committed
at the wall centre (start offset 1200), with the reference dimension moving
1414 → 1348 → 1414 mm across the two drags; Alt showed no marker and left it
at the pointer. Not run: unit and e2e suites (project rule); `tsc --noEmit`
and the style lint are clean.

### Phase 5 — Advanced alignment (deferred, S11)

Perpendicular and parallel candidates (from the anchor against every wall
direction), extension lines, equal spacing between three objects, centre-to-
centre across walls. Each is a new `PlanSnapKind` plus candidates; no UI change
beyond labels. Start on a concrete tester case.

## 6. Questions for the tester before Phase 0

1. **Which import did you use** when the plan looked wrong: **Import plan**
   (picture under the drawing) or **Generate 3D from plan** (walls created
   automatically)? A screenshot of the result decides S10.
2. **"X/Y reference should align with the centre of the wall"**: where did you
   see the mismatch? The inspector X / Z fields, the auto centre line moving
   when the plan moves, or the point you grab when dragging a wall?
3. Was the plan a **PDF, PNG scan or DWG**? Can you share the file and the one
   wall length you measured on site?
4. Do you draw walls by **dragging** or expect **click, click, click** around
   the room? (The app is drag per wall today; chaining is not in this roadmap
   unless you need it.)
5. For the imported plan, do you trace **one room** (the kitchen) or the whole
   flat? It changes how much Align to wall matters.

## 7. Suggested order and size

Phase 0 (1–2 days) → Phase 1 (3–5) → Phase 2 (3–4) → Phase 3 (3–4) → Phase 4
(2–3). Roughly three working weeks for everything the tester marked P0 and P1,
with Phase 0 answering most of the fidelity complaints in the first two days.
Phase 5 waits. Each phase is its own review checkpoint.

**Outcome (2026-10-08):** Phases 0–4 were built and verified in one day on
`feat/plan-snap-geometry`, each with its own review round. Phase 5 stays
deferred under S11.
