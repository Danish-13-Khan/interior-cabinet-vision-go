# Floor build, wall decoration and lighting roadmap

**Status:** Proposed — 2026-09-30. No phase started.
**Scope:** The Interiors editor (Room → Cabinets → Materials → Review → Present):
floor thickness, a wall editing / decoration window, wall paneling systems,
cove / rope / profile lighting, ceiling lighting, a shared light model, and the
UI workflow that ties them together.
**Relationship to other docs:** Builds on the §2.1 panel attachment contract in
[`POST_ROOM_3D_EDITING_ROADMAP.md`](POST_ROOM_3D_EDITING_ROADMAP.md) and the
architecture map in
[`WALL_DECOR_AND_LIGHTING_ARCHITECTURE.md`](WALL_DECOR_AND_LIGHTING_ARCHITECTURE.md).
It changes no wall-graph, room, opening or cabinet contract.

---

## 1. Decisions

| # | Decision | Consequence |
| --- | --- | --- |
| D1 | **Finished floor level stays at `y = 0`.** Floor build-up grows downward. | Walls, skirting, cabinets, panels, openings, the drag plane and the grid keep their elevation math. Floor thickness only changes the floor geometry and scene bounds. |
| D2 | **One `LightEntity` for every light type.** New fixture types are `parameters.fixtureKind`; `LightKind` stays the five validated kinds. | Old files load unchanged. No new validation branch, no schema bump. Fixture-specific extras live in `parameters` (scalar only, already whitelisted). Popover groups are `wall` / `ceiling` / `cabinet` (Wall lighting, Ceiling lighting, Cabinet lighting), not ceiling / cove-strip / general; Phase 4 reads `LIGHT_FIXTURE_CATEGORY_LABELS` and each kind's `mounts`. |
| D3 | **Fixtures attach to hosts and resolve at read time** (wall, ceiling, cabinet), exactly like §2.1 panels. | Moving a wall, changing room height or resizing a cabinet reflows its lights in the same undo step. World XYZ is a cache, not the source of truth. |
| D4 | **Wall decorations are design objects on a wall**, using the existing §2.1 attachment (`wallId / alongMm / floorOffsetMm / wallSide / visible`). | No parallel wall model. Every decoration is editable with the existing object inspector plus the panel attachment fields. `reflowPanelsForWalls`, `remapPanelsAfterWallSplit`, `removePanelsOnWall` already keep them consistent. |
| D5 | **Cutting a wall = an `OpeningEntity` of kind `"opening"`.** Recessed niches are out of scope until the compiler can subtract from wall boxes. | The Wall window offers Cut opening and a surface-mounted lit niche, and says why a true recess is unavailable. |
| D6 | **Brightness is an authoring number (0–100); the renderer owns the physical-unit mapping** in one scale table. | three ≥ r155 candela / nits conversions never appear in components or presets. **Appearance of saved projects changes:** existing fixtures at brightness 3–5 become visibly brighter, and recipe area lights emit for the first time. Data needs no migration; the look does change, and Phase 0 owns re-tuning it. The `"YXZ"` Euler order in §3.3 only re-orients free fixtures that were saved with both a tilt and a non-zero yaw; none of the presets are. |
| D7 | **Lights become selectable in 2D and 3D** through the same selection state as walls and openings (`activeLightId`). | The Room lights popover remains for adding fixtures (e2e contract), the inspector edits the selected light. |
| D8 | **Starters, presets and golden fixtures are not changed by the new features.** New settings are optional with resolver defaults. | `livingRoom.test.ts` round-trip stays green. One exception, already made: Phase 0 re-tuned the recipe seed intensities, so the golden and phase-1 benchmark fixtures were regenerated once for that data change. |
| D9 | **Catalog additions stay under the v1 cap of 50 curated items** (32 today). | Five new wall-decoration items (→ 37); mirror, slat panel and custom section reuse existing items; further variants are parameters, not items. |

## 2. Evidence from the 2026-09-30 lighting review

Verified in code and in the running app:

- `RectAreaLightUniformsLib.init()` is never called (no hit under `src/`;
  three r185). In the live page `UniformsLib.LTC_FLOAT_1 === undefined`. Result:
  **every `kind: "area"` light emits nothing** — the cove and under-cabinet
  strips, and the recipe lights `tv-wall-cove`, `window`, `ceiling`,
  `window-fill`. A cove strip at brightness 100 placed against the back wall
  changed nothing on screen. Only the emissive fixture mesh glows, which is why
  strips read as a gimmick.
- Point and spot fixtures default to intensity 3–5. Since three r155 that is
  candela; 5 cd at 2.6 m is invisible against the HDRI + hemisphere fill.
- The recipe rig (`lighting.ts`) hard-codes positions for the 6.2 × 4.6 m
  starter room (`z: -2100`, `x: -2850`, …); drawn rooms get lights outside them.
- Fixtures are edited only through raw X/Y/Z and Euler fields in a popover, are
  not drawn in 2D, and cannot be clicked in 3D (`modelSelection.ts` has no
  light target).
- Five independent light sources stack (hemisphere, HDRI or Lightformers,
  window key, recipe rig, fixtures), each with its own per-mode scale
  (`hemisphereScale`, `intensityScale`, `projectLightScale`, `windowKeyScale`).
  Fixture contribution is always the smallest term.
- Floor: one hard-coded 12 mm slab at `y = -6 … 0`
  (`sceneCompilerSurfaces.ts:31`); ceiling 24 mm at `H … H+24`; no thickness
  setting anywhere.

## 3. Contracts (lock before implementation; do not invent synonyms)

### 3.1 Floor build — `room.extensions.floorBuild`

| Property | Type | Purpose |
| --- | --- | --- |
| `structuralThicknessMm` | number | Slab / joist zone below the flooring |
| `flooringThicknessMm` | number | Finish layer (tiles, timber, …) |

- Resolver: `resolveFloorBuild(room)` → both numbers, clamped, defaults
  `{ structuralThicknessMm: 12, flooringThicknessMm: 0 }` (matches today's
  render for files without the setting).
- Derived: `finishedFloorLevelMm = 0`, `flooringBottomMm = -flooring`,
  `floorBottomMm = -(structural + flooring)`.
- Ceiling slab thickness moves from the inline `24` to a named constant in the
  same module (`CEILING_SLAB_THICKNESS_MM`), so both shell thicknesses have one home.
- Materials: flooring layer uses the existing floor material resolution;
  structural slab uses a new built-in compiled material `compiled:floor-structure`.

### 3.2 Common light model — `LightEntity` + `parameters`

```ts
interface LightProperties {          // every light
  enabled: boolean;
  intensity: number;                 // 0–100 authoring brightness
  color?: string;
  colorTemperature?: number;         // Kelvin, stored as parameters.colorTemperatureK
}
```

| `parameters` key | Types using it | Meaning |
| --- | --- | --- |
| `fixtureKind` | all fixtures | `"cove" \| "rope" \| "profile" \| "panel" \| "cob" \| "track" \| "ceiling-downlight" \| "pendant" \| "under-cabinet"` |
| `widthMm` | all | length along the fixture (strip / track length, panel width) |
| `heightMm` | all | width across (strip width, panel depth, COB diameter) |
| `depthMm` | all | profile / housing thickness |
| `rangeMm` | point, spot | falloff distance |
| `beamAngleDeg` | cob, track, downlight | spot cone |
| `headCount`, `aimAngleDeg` | track | number of heads and their tilt |
| `profileFinish` | profile, track | `"aluminium" \| "black" \| "white"` |
| `orientation` | profile (wall) | `"horizontal" \| "vertical"` |

Base `LightKind` per fixture: cove / rope / profile / panel / under-cabinet →
`"area"`; cob / track / downlight → `"spot"`; pendant → `"point"`.

Key-name note (inherited, keep): `widthMm` is the length **along** the
fixture and `heightMm` is the width **across** it. These names come from the
existing strip fixtures and the e2e label "Strip length (mm)"; do not rename.

### 3.3 Light mounts — `parameters`, resolved by `resolveLightAttachment`

Names are shared with the §2.1 panel contract wherever the concept is the same.
Lights store flat scalar keys in `parameters` (that map only accepts
`string | number | boolean`), whereas panels store a nested
`extensions.wallAttachment` object; the vocabulary is the same.

| Mount | Keys | Pose rule |
| --- | --- | --- |
| object (exists) | `hostObjectId`, `offsetXmm/Ymm/Zmm`, `fitHostWidth` | unchanged |
| wall (new) | `hostWallId`, `alongMm` (centre, along the **oriented** wall, same as panels), `centerHeightMm`, `wallSide: "interior" \| "exterior"` (same values as `PanelWallSide`), `fitHostWidth` (stretch to the host wall, inset 20 mm at each end) | face point + normal × (thickness/2 + depth/2) |
| ceiling (new) | `hostSurface: "ceiling"`, `ceilingDropMm` | `y = room.dimensions.heightMm − drop`; x/z stay authored |
| free | none | authored position and full rotation |

`centerHeightMm` is the height of the fixture **centre** above the finished
floor. It gets its own name because both existing height keys name a bottom
edge: `floorOffsetMm` on panels, and `mountHeightMm` on objects (wall-cabinet
underside in `cabinetSceneMount.ts`, floating TV unit 360, wall mirror 850,
written by `wardrobePlacement.ts` and the object inspector). Reusing either
for a centre would silently mis-place things.

Orientation rule: every fixture body is authored in the same canonical frame
three.js uses for `RectAreaLight` and `SpotLight`, emitting along local `−Z`.
The saved `rotation` orients that frame **with Euler order `"YXZ"`** (tilt
about X first, yaw about Y last), passed explicitly to the group; three's
default `"XYZ"` applies the tilt about the world X axis after the yaw, so a
cove on a side wall (yaw 90°) would shine sideways instead of up. The same
order applies to track `aimAngleDeg`. For mounted fixtures the resolver writes
the full rotation (wall rope / profile: `−Z` = away from the wall; cove: that
yaw plus `x: 90` so it emits up; ceiling types: `x: −90` so they emit down).
Free fixtures keep whatever rotation the user saved, so a tilted spot aimed at
a picture keeps its tilt; today's presets (`x: 90` cove, `x: −90` others, yaw
0) already match this frame.

`fitHostWidth` shortens a strip to the host length minus 20 mm at each end
(`WALL_STRIP_END_MARGIN_MM`). That inset stays 20 mm; it is not 50 mm.

Each registry definition lists `mounts: readonly LightMountKind[]` (always
including `"free"`). `addRoomLightFixture` returns the project unchanged when
the requested mount is not in that list, so `addRoomLightFixture("cove", { kind: "ceiling" })`
does not add a light. Phase 4 buttons offer only those hosts.

### 3.4 Render scale (single table, `LIGHT_RENDER_SCALE`)

`areaNitsPerUnit`, `pointCandelaPerUnit`, `spotCandelaPerUnit`,
`emissivePerUnit`, `maxEmissive`, `coveWallShare`. Phase 0 reviewed values
10 / 8 / 10 / 0.22 / 4 / 0.35, measured by pixel readout on the release-demo
back wall: a 2000 cd downlight clipped the floor to white while 40–60 cd read
as a real downlight; a 1 m × 20 mm strip 130 mm from the wall lifts the wall
pixel from 231 to 243 at 18 nits and to 252 at 60 nits.

**How to judge lighting (lesson from Phase 0):** the default wall paint under
the HDRI already sits near white (≈231/255), so a wash saturates to 255
instead of standing out, and downscaled screenshots hide it completely. Judge
strips by pixel readout, on a mid-tone wall material, or in Walkthrough (the
only preset that shows the ceiling). Rect area lights behave correctly down
to at least 120 mm from the lit surface; no segmentation is needed.

**Recipe seeds are resolved at read time** (`resolveRecipeLightSeed` in the
scene compiler): saved files and drafts carry their own recipe lights, so a
seed retune would otherwise never reach them. Recipe lights are not
user-editable, so nothing authored is overwritten.

### 3.5 Wall decoration presets — catalog items, `category: "wall-panel"`

| Preset | Catalog id | Default size (W × H × D mm) | Adapter |
| --- | --- | --- | --- |
| Full-height panel | `living:wall-panel-full` | wall length ÷ 3 × wall height × 18 | plain face |
| Half-height panel / wainscot | `living:wainscot-panel` | 1200 × 900 × 22 | rails + stiles + recessed fields |
| Vertical panel | `living:wall-panel-vertical` | 600 × 2400 × 18 | plain face, grooves along height |
| Horizontal panel | `living:wall-panel-horizontal` | 2400 × 600 × 18 | plain face, grooves along width |
| Moulding / chair rail | `living:moulding-strip` | 2400 × 60 × 24 | stepped profile (2–3 boxes) |
| Decorative profile strip | `living:profile-strip` | 40 × 2400 × 18 | vertical strip |
| Fluted / slat panel | existing `living:feature-wall-fluted` | 3600 × 2200 × 62 | existing adapter |
| Mirror | existing `living:wall-mirror` (category `mirror`) | 900 × 1400 × 35 | existing `compileMirror`; its `"mirror"` primitive already gets the reflective treatment in `createPbrMaterial.ts` |
| Custom rectangular section | existing `living:decorative-panel` | 1200 × 2400 × 24 | existing adapter |

The five new items are `kind: "decor"`, `category: "wall-panel"`, so
`isWallPanelObject` recognises them by category (catalog goes from 32 to 37).
The mirror is not duplicated: the Wall window's "Add mirror" places the
existing `living:wall-mirror` through `addWallPanel` with that catalog id, and
`isWallPanelObject` additionally returns true for **any** object whose
`extensions.wallAttachment` carries `alongMm`. Mirrors placed the old way (no
attachment) keep their current placement, duplicate and drag behaviour;
`mirror` is **not** added to `PANEL_CATEGORIES`, because the panel duplicate /
drag paths return the project unchanged for objects without an attachment.
Editable after placement: width / height / depth (object inspector), along-wall
and floor offset (panel attachment), material slots, wall face, visible.

## 4. UI workflow

```text
Select Wall  ──▶  Wall inspector gains "Edit wall" window
                   ├── Cut / opening      (Cut opening · Split wall · Delete section)
                   ├── Mirror             (Add mirror panel)
                   ├── Wall panels        (Full · Half · Vertical · Horizontal)
                   ├── Moulding           (Chair rail · Profile strip · Wainscot)
                   ├── Decorative         (Slat / fluted · Custom section · Lit niche*)
                   ├── Lighting           (Cove · Rope · Profile on this wall)
                   └── Material           (existing swatches, per wall section)
                   * surface-mounted; true recess unsupported (D5)

Select Room (ceiling)  ──▶  Room inspector "Ceiling lighting"
                   ├── Panel light · COB downlight · Track light
                   └── Floor build (structural + flooring thickness)

Room lights popover (3D toolbar / Render Studio)  ──▶  add any fixture, list, jump to selection
                   grouped by the code categories (not ceiling / cove-strip / general):
                   ├── Wall lighting      (Cove · Rope · Profile)
                   ├── Ceiling lighting   (Downlight · Pendant · Panel · COB · Track)
                   └── Cabinet lighting   (Under-cabinet)

Select Light (2D glyph or 3D fixture)  ──▶  Light inspector
                   ├── Mount (Free · Wall · Ceiling · Cabinet) + along / height / face
                   ├── Size (length, width, depth) · heads · beam · aim
                   ├── Light (on/off, brightness, tone preset, Kelvin, colour)
                   └── Duplicate · Remove
```

The header of every section names the host ("Editing back wall", "Cove light on
left wall") so the user knows they are editing the selection, not creating an
unrelated object.

## 5. Phases

### Phase 0 — Make lights real

Fix the root cause before adding fixture types.

- Add `rendering/lighting/rectAreaLightSupport.ts` and call it once from
  `SceneProjectLights` (and any other canvas using `rectAreaLight`).
- Add `domain/livingRoom/lightFixtureTypes.ts` with `LightProperties`,
  `LIGHT_RENDER_SCALE`, `fixtureRenderIntensity`, `fixtureEmissiveIntensity`.
- Route fixture intensities in `RoomLightFixture.tsx` through the scale table.
- Remove the magic multipliers `0.58` / `0.86` in `SceneProjectLights` into
  named constants in the same table.
- **Re-tune the recipe rigs.** Their area lights have never emitted; once they
  do, `ceiling` (3.6 × 2.4 m at 2.1) and `tv-wall-cove` (2.8 m) will be far too
  strong in every Render Studio preset and exported still. Re-check all three
  recipes in Model View and Render Studio and adjust the seed intensities in
  `lighting.ts` (the seeds are data, not a contract).
- Check pixel-based outputs. `calm-light-visual.spec.ts` masks every canvas,
  so it is **not** affected; Render Studio stills, `phase-k3-render-honesty`,
  `render-qa-smoke` and the phase-1 / phase-2 proof fixtures may shift and need
  their reference images regenerated after the retune is approved.

- Resolve recipe seeds at read time in the scene compiler
  (`resolveRecipeLightSeed`), so saved files and drafts pick up the retune.

**Exit gate:** a downlight at default brightness shows a soft pool on the
floor without clipping; a cove strip at default brightness placed 130 mm from a
wall lifts the wall pixel measurably (§3.4 tells how to judge it); all three
recipes reviewed in Model View at standard quality; render-QA references
regenerated where they moved; `tsc --noEmit` clean;
`room-light-fixtures.spec.ts` unchanged and green (reported, not run by the
reviewer).

### Phase 1 — Shared light model, fixture registry, mounts

- Extend `lightFixtureTypes.ts` with `LightFixtureDefinition` registry for the
  nine kinds (§3.2), categories, defaults, free elevation / rotation.
- `roomLightFixtures.ts`: `ROOM_LIGHT_FIXTURES` derived from the registry;
  `addRoomLightFixture(project, kind, mount)`; `updateRoomLightFixture` validates
  the new numeric keys via `LIGHT_PARAMETER_LIMITS`; `duplicateRoomLightFixture`.
- `lightAttachments.ts`: `readLightMount`, wall and ceiling resolution,
  `attachLightToWall`, `attachLightToCeiling`, `updateLightMount`,
  `detachLight` clears every mount key.
- Unit tests: mount resolution follows a moved wall and a changed room height;
  save → reopen keeps every parameter; unknown `fixtureKind` in an old file is
  treated as a non-fixture light (no crash).

**Exit gate:** wall-mounted rope light follows its wall when a node is dragged
(one undo step); ceiling-mounted panel follows room height; existing
`roomLightFixtures.test.ts` cases still pass.

### Phase 2 — Fixture rendering

- Split `RoomLightFixture.tsx` into `rendering/lighting/fixtures/*`:
  `CoveFixture` (shelf + up-facing rect light + `coveWallShare` toward the wall
  band), `StripFixture` (rope / profile / under-cabinet: housing + diffuser +
  rect light, emission from mount), `PanelFixture` (thin box + down rect
  light), `CobFixture` (recessed cylinder + spot with `beamAngleDeg`),
  `TrackFixture` (rail + `headCount` heads, `aimAngleDeg`), `PendantFixture`.
- Selected state: outline colour from tokens; hover cursor.
- Pointer handlers call `onSelectLight(id)`; render-studio canvas passes none.
- Renderer limits, stated in the UI hint: `rectAreaLight` never casts shadows,
  so cove and panel fixtures light through furniture; the cove "indirect" wash
  is the ceiling receiving a real area light, not bounced light. Track heads
  are capped by `LIGHT_PARAMETER_LIMITS.headCount` (default 3, max 6) because
  each head is a separate spot light.
- One rect area light per strip; the cove's second light (`coveWallShare`)
  and each track head count as separate sources in the light budget.

**Exit gate:** each of the nine kinds renders a body and an illumination effect
in Model View; screenshots of cove, panel, COB and track attached to the
release-demo room reviewed and accepted.

### Phase 3 — Light selection in 2D / 3D and the Light inspector

- `activeLightId` in `LivingRoomPlanWorkspace.tsx`, pruned like walls; cleared
  by Escape and `inspectPlanTarget`; added to `workspaceBodyProps`,
  `planStageProps`, `LivingRoomModelView` → `ModelViewScene` →
  `CompiledSceneRenderer` → `RenderLightingRig` → `SceneProjectLights`.
- `PlanLightsLayer.tsx` in 2D: strips as rotated lines at `widthMm`, points and
  spots as circles, panels as rectangles; click selects; selected style.
- `LightFixtureInspector.tsx` (fields in §4) used by the inspector branch and by
  the Room lights popover (which keeps the labels "Strip length (mm)",
  "Height (mm)", "Brightness", "Light on", "Remove …" for the existing e2e).
- `interiorsSelectionTitle` / `hasInteriorsInspectorSelection` gain `light`.
- Multi-room rule: the compiler emits the active room's lights plus room-less
  global lights (`roomId === null`, `sceneCompiler.ts:114`); fixtures always
  carry a `roomId`, and the 2D layer draws only the active room, so a fixture
  can only ever be selected in its own room. `updateRoomLightFixture` keeps its
  active-room guard; no room switching on select.

**Exit gate:** click a fixture in 3D → inspector shows it → switch to 2D → same
light highlighted; Escape clears; deleting the light clears the selection;
`room-light-fixtures.spec.ts` still green.

### Phase 4 — Ceiling lighting and Cove / Rope / Profile entry points

- Room inspector "Ceiling lighting" section: add Panel / COB / Track mounted to
  the ceiling at the room centre, then select the new light.
- Wall inspector "Lighting" section: add Cove (fit to wall length, top of wall),
  Rope, Profile (horizontal / vertical) mounted to the selected wall.
- Room lights popover regrouped with `LIGHT_FIXTURE_CATEGORY_LABELS`
  (wall / ceiling / cabinet: Wall lighting, Ceiling lighting, Cabinet lighting),
  not ceiling / cove-strip / general. "Attach beneath" becomes "Mount", and
  each kind offers only the hosts in its `mounts` list.

**Exit gate:** from a fresh drawn L-room, the user can add a cove on each wall
and a track on the ceiling without typing a coordinate; all follow wall / room
edits; save → reopen preserves them.

### Phase 5 — Floor build

- `interiorProject/floorBuild.ts` (§3.1) + `CEILING_SLAB_THICKNESS_MM`.
- `sceneCompilerSurfaces.ts`: flooring prism (`-flooring … 0`) + structural
  prism below; `compiled:floor-structure` material in `compileMaterials`.
- Room inspector: "Floor build" fields (structural, flooring) with presets
  (screed 60, joists 220, tiles 12, timber 18, vinyl 4).
- Command `setLivingRoomFloorBuild` in `roomCommands.ts`.
- Fix the room-adapter handoff (`cabinetAdapter.ts:94-97`): it rebuilds rooms
  and copies back only `roomType` and `name`, dropping every room extension
  (today that already loses `floorMaterialId` / `ceilingMaterialId`). Carry
  over the whole previous `extensions` object, then apply the adapter's own
  `managedBy` key, so `floorBuild` and any future room-level extension survive.
- Other views: scene bounds `min.y` deepens, which `modelViewFitDistance`
  reads through the AABB corners, so Fit and Dollhouse frame very slightly
  wider (a few cm). Shadow frustums read only plan width / depth
  (`roomFitShadowFrustum.ts`) and are unaffected. Elevation and section views
  draw their floor line at finished floor level (`elevationGraphics.ts`) and
  are unaffected. Skirting stays at `y = 0`.
- Unit tests: default resolves to legacy 12 mm; bounds `min.y` equals
  `−(structural + flooring)`; opening sills and cabinets unchanged at `y = 0`;
  handoff round-trip keeps room extensions.

**Exit gate:** changing flooring thickness moves only the floor geometry; walls,
skirting and cabinets do not move; existing rooms render identically with the
setting absent; golden fixture byte-identical.

### Phase 6 — Wall decoration presets and adapters

- Catalog items in `catalogDecorItems.ts` (§3.5); adapters in a new
  `sceneAdaptersWallDecor.ts` registered in `ADAPTERS`. The existing
  `sceneAdaptersFeatureWalls.ts` keeps its two adapters; the six new ones would
  push that file past the repo's 200-line-per-module habit, so they get their
  own module next to it.
- Mirror: no new item and no new material. `createPbrMaterial.ts` already
  special-cases the `"mirror"` primitive of `living:wall-mirror` (roughness
  0.08, metalness 0.82, stronger environment reflection); it reflects the
  environment map, not the room. Phase 6 only makes that item attachable (§3.5).
- `wallDecorations.ts`: `WALL_DECORATION_PRESETS` (group, label, catalog id,
  size rule) and `addWallDecoration(project, wallId, presetId)` on top of
  `addWallPanel` (full-height presets read `wall.heightMm`).
- Command `addLivingRoomWallDecoration` next to `addLivingRoomWallPanel`;
  new decoration is selected after placement.
- Unit tests: every preset lands on the wall face, within the wall length, and
  survives `reflowPanelsForWalls` / split / delete.

**Exit gate:** 2D shows each decoration on its wall; 3D shows the intended
profile; resizing the host wall keeps decorations attached; catalog count ≤ 50.

### Phase 7 — Wall editing / decoration window

- `WallEditingPanel.tsx` inside the wall block of `PlanArchitectureInspector`
  (§4 tree), header "Editing <side> wall".
- Cut / opening: "Cut opening" calls `onAddOpening(wallId, "opening", offset)`
  and selects it; "Split wall" and "Delete section" reuse existing commands.
- Material: existing swatch grid; note that a split wall section keeps its own
  material.
- Contextual rail for `wall` gains `cut-opening` and `add-light`; `panel` kind
  unchanged.
- Existing `data-testid="add-wall-panel"` button and
  `panel-attachment-inspector` remain (phase-m5 e2e).

**Exit gate:** wall → Cut opening → 2D shows the gap, 3D shows the split
segments, room graph validation reports no new issue; `phase-m5-panels.spec.ts`
and `phase-h2-wall-edit.spec.ts` unchanged and green.

### Phase 8 — Validation and hardening

- Save / load round-trip test for a project using every new property.
- Old-file test: fixture with `parameters.fixtureKind` unknown, room without
  `floorBuild`, panel with legacy `{ wallId }` attachment.
- e2e: `wall-decor-and-lighting.spec.ts` covering §4 end to end
  (cove on wall → panel light on ceiling → wainscot → save → reopen → render).
- Performance check, static and dynamic: ≤ 12 light sources in Model View
  standard keeps frame time within the current budget (`modelViewPerf.ts`
  caps shadow casters; fixtures never cast shadows in draft). Count cove
  secondary lights and track heads as sources, not fixtures. Adding or
  removing a light changes the light count, and three.js keys its shader
  program cache on those counts (`WebGLPrograms.js` `numSpotLights`,
  `numRectAreaLights`, …), so every material recompiles once per add / remove.
  Measure the hitch for a track light (several spot heads) and for toggling
  `enabled`; editing brightness, colour or position must not recompile.
  Mitigation if needed: keep disabled fixtures mounted with intensity 0 rather
  than unmounting them, so toggling never changes the count.

**Exit gate:** `npm run release:check` green; the validation list in the brief
(§11) checked item by item in the PR description.

## 6. Order and rough size

| Phase | Depends on | Size |
| --- | --- | --- |
| 0 Make lights real | — | M (fix is small; recipe retune and reference images are the work) |
| 1 Model, registry, mounts | 0 | M |
| 2 Fixture rendering | 1 | M |
| 3 Selection + inspector | 2 | L (12-file plumbing) |
| 4 Ceiling / wall entry points | 3 | S |
| 5 Floor build | — (parallel with 1–4) | M |
| 6 Decoration presets | — (parallel with 1–4) | M |
| 7 Wall editing window | 4, 6 | M |
| 8 Validation | all | M |

## 7. Not changing

- Wall graph, loops, nodes, `WallEntity`, `OpeningEntity`, `SurfaceZoneEntity`.
- Cabinet adapters, cabinet runs, GLB import, DWG import, materials pipeline.
- The recipe / HDRI / window-key rig structure and its recipe ids. Recipe
  seed intensities are re-tuned in Phase 0 (their area lights start working
  there); that is a data change inside `lighting.ts`, not a contract change.
- `schemaVersion` (stays 2), starters, presets, golden fixtures.
