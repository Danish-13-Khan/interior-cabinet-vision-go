# Floor build, wall decoration and lighting — architecture assessment

Written 2026-09-30 before implementing the "Interior Design Tool — Features,
Improvements & Fixes" brief. Everything below reuses the existing
`InteriorProject` model; no second geometry system is introduced.

## 1. Current lighting: why it reads as a gimmick

The evidence lives in one place, §2 of
[`WALL_DECOR_LIGHTING_ROADMAP.md`](WALL_DECOR_LIGHTING_ROADMAP.md). In short:
area lights are never initialised (so every strip and cove emits nothing),
point / spot intensities predate three's physical units, the recipe rig is
hard-coded for the starter room, and fixtures cannot be selected. Fix order:
initialise area lights → physical-unit scale table → host attachments →
selection.

## 2. Where each feature integrates

| Feature | Existing anchor (reuse) | Integration point |
| --- | --- | --- |
| Floor thickness / flooring layer | `room.extensions` (kept verbatim by validation), `sceneCompilerSurfaces.ts` floor prism (today `12 mm` at `y=-6`, hard-coded) | New `interiorProject/floorBuild.ts` (`FloorBuild`, defaults, `resolveFloorBuild(room)`, `floorBottomMm`). Floor compiles as flooring layer + structural slab. **Finished floor level stays at `y = 0`**, so walls, skirting, cabinets, panels, drag plane and grid keep their existing elevation math. Room inspector gets two fields. |
| Wall editing / decoration window | §2.1 panel attachment (`panelAttachment.ts`: `wallId / alongMm / floorOffsetMm / wallSide / visible` in `object.extensions.wallAttachment`), `reflowPanelsForWalls`, `remapPanelsAfterWallSplit`, `removePanelsOnWall`, existing `OpeningEntity` kind `"opening"` | New `livingRoom/wallDecorations.ts` preset table + `addWallDecoration(project, wallId, presetId)` built on `addWallPanel`. New `WallEditingPanel.tsx` rendered inside the wall block of `PlanArchitectureInspector`. Cut / opening reuses `addLivingRoomOpening` with kind `"opening"`. Per-section material = the wall segment's own `materialId` after split + each panel's material slots. |
| Wall paneling & decorative systems | Catalog items with `category: "wall-panel"` are already recognised by `isWallPanelObject`; adapters in `sceneAdapters.ts` (`ADAPTERS`), two of them in `sceneAdaptersFeatureWalls.ts` | Five new catalog items in `catalogDecorItems.ts` (full / vertical / horizontal panel, wainscot, moulding strip, profile strip) + adapters in a new `sceneAdaptersWallDecor.ts` (the feature-walls module stays as is; more adapters would take it past the 200-line module habit). Slat panel, custom section and mirror reuse `living:feature-wall-fluted`, `living:decorative-panel` and `living:wall-mirror`; the mirror's reflective look already exists in `createPbrMaterial.ts`. Width/height/depth, position, material, rotation are edited by the existing object inspector + `PanelAttachmentInspector`. |
| Common light properties | `LightEntity { enabled, intensity, color, parameters }`, `parameters.colorTemperatureK` + `kelvinToHex` | New `livingRoom/lightFixtureTypes.ts`: `LightProperties`, `LightFixtureDefinition` registry of nine kinds (cove, rope, profile, panel, cob, track, plus the legacy downlight, pendant and under-cabinet presets; the legacy "cove" preset becomes the new cove kind). All types share one `LightEntity`; per-type extras live in `parameters` (scalar-only, already whitelisted by `parameterMap`). Base `LightKind` stays the 5 validated kinds, so old files load unchanged. |
| Cove / rope / profile lighting | `lightAttachments.ts` (`hostObjectId` cabinet attachment resolved at read time) | Extend attachment to `hostWallId + alongMm + centerHeightMm + wallSide + fitHostWidth` (panel vocabulary; `centerHeightMm` is new because `mountHeightMm` already means a bottom edge on objects) and `hostSurface: "ceiling"`. Resolution stays read-time in `resolveLightAttachment`, so wall moves and room height edits reflow automatically. Rendering in `rendering/lighting/fixtures/*` with `rectAreaLight` (cove aims at the ceiling for the indirect wash). |
| Ceiling lighting (panel / COB / track) | same fixture registry | Panel = flat emissive box + downward `rectAreaLight`; COB = recessed cylinder + `spotLight` with `beamAngleDeg`; track = rail + `headCount` spot heads with `aimAngleDeg`. Ceiling mount keeps `y` locked to `room.dimensions.heightMm`. |
| Light selection & properties | selection state in `LivingRoomPlanWorkspace.tsx`, `inspectPlanTarget`, `LivingRoomInspectorPanel` branches | Add `activeLightId` alongside `activeWallId`; 3D fixture meshes get pointer handlers; 2D gets a `PlanLightsLayer`; inspector gets a `LightFixtureInspector` branch. The Room lights popover stays for adding fixtures (e2e contract). |
| Persistence | additive convention: new data in `extensions` / `parameters`, `schemaVersion` stays 2 | No migration needed; missing values fall back to defaults in the resolvers. |

## 3. Constraints honoured

- Panels and lights never mutate wall geometry; they re-resolve from attachment data.
- No new wall / room representation; wall openings remain `OpeningEntity` on the wall graph.
- Recessed niches need CSG on the wall boxes, which the compiler does not do; the panel exposes a surface-mounted lit niche instead and says so.
- Catalog stays under the v1 cap of 50 curated items (32 before this work).
- Golden fixtures (`fixtures/golden-cabinet-run/v1.interior.json`) are byte-compared, so starters/presets are not changed; defaults only apply when a value is missing.
