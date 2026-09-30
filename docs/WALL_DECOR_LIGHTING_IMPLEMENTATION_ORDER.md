# Implementation order — floor build, wall decoration, lighting

Companion checklist for [`WALL_DECOR_LIGHTING_ROADMAP.md`](WALL_DECOR_LIGHTING_ROADMAP.md).
Work top to bottom inside a phase; phases marked **parallel** can start on
their own branch at any time. Each step ends with a review checkpoint (⏸) —
stop there and ask for a review before moving on.

Branches: `feat/lighting-fixtures` (Phases 0–4), `feat/floor-build` (Phase 5),
`feat/wall-decoration` (Phases 6–7). Phase 8 lands on whichever merges last.

---

## Phase 0 — Make lights real (`feat/lighting-fixtures`)

1. **Initialise area lights.** New `src/rendering/lighting/rectAreaLightSupport.ts`
   exporting `ensureRectAreaLightSupport()` that calls
   `RectAreaLightUniformsLib.init()` from `three/examples/jsm/lights/RectAreaLightUniformsLib.js`
   once (module-level flag). Call it at the top of `SceneProjectLights` (it is
   the only consumer of `rectAreaLight` in both canvases). Do not call it at
   import time; unit tests import these modules without WebGL.
2. **Scale table.** New `src/domain/livingRoom/lightFixtureTypes.ts` with only
   `LightProperties`, `LIGHT_RENDER_SCALE`, `fixtureRenderIntensity(light, kind, scale)`
   and `fixtureEmissiveIntensity(light)`. Move the `0.58` and `0.86` multipliers
   from `SceneProjectLights.tsx` into named entries (`recipeAmbientScale`,
   `recipeDirectionalScale`).
3. **Use it.** `RoomLightFixture.tsx`: intensity and emissive come from the two
   helpers. Recipe lights in `SceneProjectLights` keep their authored values
   times the named constants.
4. **Verify in the browser, then re-tune.** Model View, release demo: add a
   Cove LED strip and a downlight from the Room lights popover; both must
   visibly light surfaces at default brightness. Dollhouse, Perspective and
   the orthographic presets hide the ceiling, so judge anything aimed upward
   in Walkthrough. Then cycle Soft Daylight / Warm Evening / Neutral Studio at
   standard quality and adjust the seed intensities in `lighting.ts`
   (`ceiling`, `tv-wall-cove`, `window`, `window-fill`, `display-niche`) until
   they look balanced. Seeds are resolved at read time in the compiler, so
   the demo draft shows the new values without being re-created. The default
   wall paint is already near white under the HDRI, so a strip wash saturates
   rather than contrasts: judge by pixel readout or on a mid-tone wall
   material, not from a downscaled screenshot (roadmap §3.4).
5. **Reference images.** Regenerate any render-QA reference that moved
   (`render-qa-smoke`, `phase-k3-render-honesty`, phase-1 / phase-2 proof
   fixtures). `calm-light-visual` masks canvases and needs nothing.
6. `tsc --noEmit` clean.

⏸ **Review 0:** screenshots of cove + downlight in Model View and the three
recipes in Render Studio; diff of `lighting.ts` seeds; list of regenerated
references.

## Phase 1 — Shared light model, registry, mounts

7. **Registry.** Extend `lightFixtureTypes.ts` with `LightFixtureKind` (nine
   ids), `LightFixtureCategory`, `LightMountKind`, `LightFixtureDefaults`,
   `LightFixtureDefinition`, `LIGHT_FIXTURE_DEFINITIONS`,
   `getLightFixtureDefinition`, `lightFixtureDefinitionFor(light)`,
   `isLightFixtureKind`, `listLightFixtureDefinitions(category)`,
   `LIGHT_FIXTURE_CATEGORY_LABELS`, `fixtureNumber(light, key, fallback)`,
   `readLightProperties`, `applyLightProperties`, `defaultFixtureColor`.
   Keys per roadmap §3.2; `widthMm` = length along, `heightMm` = across.
8. **Mounts.** Rewrite `lightAttachments.ts`: `LightMount` union
   (`free | object | wall | ceiling`), `readLightMount`, `resolveLightAttachment`
   dispatching to object (existing logic), wall (`orientWallForRoom` +
   `selectRoomWalls`, `alongMm` clamped to half length, `centerHeightMm`,
   `wallSide`, `fitHostWidth` → length − 2 × `WALL_STRIP_END_MARGIN_MM`;
   rotation yaw so local −Z points away from the wall, plus `x: 90` for cove),
   ceiling (`y = room.heightMm − ceilingDropMm`, rotation `x: −90`, keep yaw).
   Add `attachLightToWall`, `attachLightToCeiling`, `updateLightMount`;
   `detachLight` bakes the resolved pose and strips every mount key
   (object, wall, ceiling, `attachmentMissing`).
9. **Commands.** `roomLightFixtures.ts`: `ROOM_LIGHT_FIXTURES` derived from the
   registry (keep `{ id, name, kind }` shape, add `category`);
   `RoomLightMountTarget`; `addRoomLightFixture(project, kind, mount)` seeds
   `parameters` from the definition defaults and attaches when a mount is
   given (cove on a wall: `centerHeightMm = wall.heightMm − depthMm`,
   `fitHostWidth: true`); `LIGHT_PARAMETER_LIMITS` and `validParameters`;
   `updateRoomLightFixture` uses `applyLightProperties` then re-resolves the
   mount; `duplicateRoomLightFixture`.
10. **Barrel.** Export the new symbols from `src/domain/livingRoom/index.ts`.
11. **Unit tests** (`lightAttachments.test.ts`, extend
    `roomLightFixtures.test.ts`): wall-mounted light follows
    `movePlanNodeWithOpenings`; ceiling light follows `resizeLivingRoom`
    height; `serializeInteriorProjectFile` → `loadInteriorProjectFile` keeps
    every parameter; light with unknown `fixtureKind` is not a fixture and
    compiles without throwing; the three existing tests unchanged.

⏸ **Review 1:** domain diff + tests. No UI yet.

## Phase 2 — Fixture rendering

12. **Split the renderer.** `src/rendering/lighting/fixtures/`:
    `FixtureGroup.tsx` (position, `rotation` with order `"YXZ"`, selection
    outline, pointer handlers), `CoveFixture.tsx`, `StripFixture.tsx`
    (rope / profile / under-cabinet), `PanelFixture.tsx`, `CobFixture.tsx`
    (spot, `angle = beamAngleDeg / 2` in radians), `TrackFixture.tsx`
    (rail + `headCount` heads spaced along local X, each head tilted by
    `aimAngleDeg` about local X, own `spotLight` + target), `PendantFixture.tsx`.
    `RoomLightFixture.tsx` becomes the dispatcher on `fixtureKind`.
13. **Emission frame.** Every body emits along local −Z; do not read
    `rotation.x/z` inside the fixture, only the group applies rotation.
14. **Selected state.** Prop `selected: boolean` → outline mesh with the
    accent token colour; `onSelect?: (id) => void` on click
    (`event.stopPropagation()`); `cursor: pointer` on hover via
    `onPointerOver/Out` + `document.body.style.cursor`.
15. **Plumb read-only props.** `SceneProjectLights` accepts
    `selectedLightId?`, `onSelectLight?` and forwards them; `RenderLightingRig`
    forwards; `CompiledSceneRenderer` forwards from new props
    `selectedLightId`, `onSelectLight`. Render Studio passes neither.
16. **Head cap.** `LIGHT_PARAMETER_LIMITS.headCount.max = 6`.

⏸ **Review 2:** one screenshot per kind mounted on the release-demo room
(cove on back wall, panel + COB + track on ceiling, rope on a shelf, profile
vertical on a wall), plus a screenshot with a fixture selected.

## Phase 3 — Selection in 2D / 3D and the Light inspector

17. **State.** `LivingRoomPlanWorkspace.tsx`: `activeLightId` next to
    `activeWallId`; prune against `project.lights`; clear it in
    `onClearArchitecture`, in the `onSelect` wrapper, and when a wall /
    opening / surface becomes active (extend the existing effect).
18. **Props.** Add `activeLightId` / `setActiveLightId` to
    `workspaceBodyProps.ts`; `inspectPlanTarget` takes `lightId?` and always
    sets it (null clears). `planStageProps.ts` adds `activeLightId`,
    `onSelectLight`. `LivingRoomPlanStage` passes both to
    `LivingRoomPlanView` and `LivingRoomModelView`; `LivingRoomModelView` →
    `ModelViewScene` → `CompiledSceneRenderer` (`selectedLightId`,
    `onSelectLight`). Presentation mode passes no-ops like the other selects.
19. **2D.** New `components/livingRoomPlan/PlanLightsLayer.tsx` rendered after
    `PlanObjectsLayer`: active-room fixtures resolved through
    `resolveLightAttachment`; area kinds as a line of `widthMm` rotated by
    `rotation.y` (local +X direction is `(cos yaw, −sin yaw)` in plan), panel
    as a rectangle, spot / point as a circle; `data-light-id`; click →
    `onSelectLight`; selected class. Hidden when `activeBuildTool` is
    measure-like, like openings.
20. **Inspector.** New `components/livingRoomPlan/LightFixtureInspector.tsx`
    with sections Mount (Free / Wall `<select>` of room walls / Ceiling /
    Cabinet `<select>`; along-wall, centre height, wall face, fit to wall,
    ceiling drop), Size (length "Strip length (mm)" for area kinds, width,
    depth, heads, beam, aim, orientation, finish), Light (Light on,
    Brightness, tone preset, Kelvin, Colour), Position (X / Height (mm) / Z,
    Rotate (°), disabled when mounted), Duplicate, Remove `<name>`.
    Keep the exact labels "Strip length (mm)", "Height (mm)", "Brightness",
    "Light on", "Remove …".
21. **Wire it.** `LivingRoomInspectorPanel` gets `activeLight`,
    `onPatchDocument`, `onSelectLight`; renders the branch before the
    opening branch. `LivingRoomPlanWorkspaceInspector` passes them.
    `interiorsChrome.ts`: `interiorsSelectionTitle` takes `lightName`,
    `hasInteriorsInspectorSelection` takes `lightSelected`.
22. **Popover reuse.** `RoomLightFixturesPanel` renders the same
    `LightFixtureInspector` per light (so the e2e labels stay), grouped by
    `LIGHT_FIXTURE_CATEGORY_LABELS`, and each row has a "Select" button that
    calls `onSelectLight` when provided.
23. **Delete clears selection.** Removing the active light sets
    `activeLightId` to null (same pattern as `onDeleteWall`).

⏸ **Review 3:** click fixture in 3D → inspector → switch to 2D → same light
highlighted; Escape clears; `room-light-fixtures.spec.ts` reported green.

## Phase 4 — Entry points

24. **Room → Ceiling lighting.** `PlanArchitectureInspector` room block:
    section "Ceiling lighting" with Panel light / COB downlight / Track light
    buttons → `onAddLight(kind, { kind: "ceiling" })`, then select it.
25. **Wall → Lighting.** Wall block: section "Lighting on this wall" with Cove
    (fit to wall, top), Rope (centre height 120), Profile horizontal / vertical
    → `onAddLight(kind, { kind: "wall", wallId })`, then select.
26. **Command.** `hooks/livingRoomPlanEditor/lightCommands.ts` with
    `addLivingRoomLight(kind, mount)`, `updateLivingRoomLight`,
    `removeLivingRoomLight`, `duplicateLivingRoomLight`,
    `setLivingRoomLightMount`; spread into `useLivingRoomPlanEditor`; map in
    `App.tsx`; add to `workspaceProps.ts`. The inspector and popover call
    these instead of `onPatchDocument`.
27. **Contextual rail.** `contextualCommandRail.ts`: `wall` kind gains
    `add-light`; new kind `light` with `duplicate`, `delete`.

⏸ **Review 4:** from a fresh L-room starter, cove on each wall + track on the
ceiling without typing a coordinate; save → reopen; move a wall node.

## Phase 5 — Floor build (`feat/floor-build`, **parallel**)

28. `src/domain/interiorProject/floorBuild.ts`: `FloorBuild`,
    `DEFAULT_FLOOR_BUILD = { structuralThicknessMm: 12, flooringThicknessMm: 0 }`,
    `FLOOR_BUILD_LIMITS`, `resolveFloorBuild(room)`, `floorBottomMm(room)`,
    `flooringBottomMm(room)`, `writeFloorBuild(room, build)`,
    `CEILING_SLAB_THICKNESS_MM = 24`. Export from the interiorProject barrel.
29. `sceneCompilerSurfaces.ts`: floor node primitives = flooring prism
    (`flooringThicknessMm`, centre `−flooring/2`, floor material; skipped when
    0) + structural prism (centre `−flooring − structural/2`, material
    `compiled:floor-structure`). Ceiling uses the constant. Keep node id
    `room-floor:<roomId>` and `metadata.role: "floor"`.
30. `sceneCompiler.ts` `compileMaterials`: append `compiled:floor-structure`
    (kind `"stone"`, neutral grey, roughness 0.95).
31. `cabinetAdapter.ts:94-97`: carry over `previous.extensions` whole, then
    the adapter's `managedBy`.
32. Command `setLivingRoomFloorBuild(patch)` in `roomCommands.ts` → App →
    workspace props → inspector.
33. `PlanArchitectureInspector` room block: section "Floor build" with two
    `NumberField`s and a `HeightPresetRow` each (structural: 12 · 60 · 150 ·
    220; flooring: 0 · 4 · 12 · 18).
34. Tests: default resolves to legacy; `computeArchitectureBounds().min.y`
    equals `−(structural + flooring)`; openings / cabinets unchanged at 0;
    handoff keeps room extensions; golden fixture byte-identical.

⏸ **Review 5:** screenshot with flooring 18 + structural 220 in Dollhouse;
diff; test list.

## Phase 6 — Decoration presets (`feat/wall-decoration`, **parallel**)

35. `catalogDecorItems.ts`: `living:wall-panel-full`,
    `living:wall-panel-vertical`, `living:wall-panel-horizontal`,
    `living:wainscot-panel`, `living:moulding-strip`, `living:profile-strip`
    (all `kind: "decor"`, `category: "wall-panel"`, `placement: "wall"`).
36. `sceneAdaptersWallDecor.ts`: `compileGroovedPanel` (orientation param),
    `compileWainscot` (rails, stiles, recessed fields from `fieldCount`),
    `compileMouldingStrip` (2–3 stepped boxes), `compileProfileStrip`;
    register six entries in `ADAPTERS`.
37. `panelAttachment.ts`: `isWallPanelObject` also true when
    `readPanelAttachment(object)?.alongMm` is a number (makes an attached
    `living:wall-mirror` a panel without touching `PANEL_CATEGORIES`).
38. `wallDecorations.ts`: `WALL_DECORATION_PRESETS` (group, label, catalog id,
    `size(wall)` rule, `floorOffsetMm`), `addWallDecoration(project, wallId, presetId)`
    over `addWallPanel({ catalogItemId, dimensions, floorOffsetMm })`.
39. Command `addLivingRoomWallDecoration(wallId, presetId)` next to
    `addLivingRoomWallPanel` in `cabinetRuns.ts` (selects the new object).
40. Tests: every preset lands on the wall face within the wall length;
    survives `reflowPanelsForWalls`, `remapPanelsAfterWallSplit`,
    `removePanelsOnWall`; catalog length ≤ 50.

⏸ **Review 6:** 2D + 3D screenshots of each preset on one wall; resize the wall.

## Phase 7 — Wall editing window

41. `components/livingRoomPlan/WallEditingPanel.tsx`: header
    "Editing <side> wall"; sections Cut / opening (Cut opening → `onAddOpening(wallId, "opening", offset)`
    and select it; Split wall; Delete section), Mirror, Wall panels, Moulding,
    Decorative (slat / custom / "Lit niche" hint about recess), Lighting
    (Phase 4 buttons), Material (existing swatch grid moved here).
42. Mount it in the wall block of `PlanArchitectureInspector`; keep the
    `data-testid="add-wall-panel"` button and `PanelAttachmentInspector`.
43. `contextualCommandRail.ts` `wall`: add `cut-opening`.

⏸ **Review 7:** cut an opening → 2D gap, 3D split segments, validation clean;
`phase-m5-panels` and `phase-h2-wall-edit` reported green.

## Phase 8 — Validation

44. Round-trip test with every new property; old-file tests (unknown
    `fixtureKind`, room without `floorBuild`, legacy `{ wallId }` panel).
45. e2e `wall-decor-and-lighting.spec.ts` (§4 journey).
46. Performance: frame time with 12 lights; hitch on add / remove / toggle of
    a track light; apply the "intensity 0 instead of unmount" mitigation if
    the toggle hitch is visible.
47. PR description: tick the brief's §11 list item by item.

⏸ **Review 8:** full PR.
