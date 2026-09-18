# Import Walls — locked roadmap

**Branch:** `feat/import-walls-phase-01`  
**Role:** Product/engineering plan for floor-plan → editable room.  
**Not:** a replacement for [FLOORPLAN_EXTRACT_API_CONTRACT.md](./FLOORPLAN_EXTRACT_API_CONTRACT.md) (sidecar JSON/API).

## Promise

Upload a floor plan and get an **editable room draft in minutes**. Review measurements, then continue in 2D or 3D.

Do **not** sell: any file → finished 3D room.

**Win condition:** a salesperson with a clean axis-aligned DXF/SVG can review, Apply, and snap a cabinet to an imported wall. Photos, scanned PDFs, and magic GPT import are out of this bet.

## Architecture

```text
USER PLAN
    │
    ├── UNDERLAY          PNG / JPG / PDF → manual trace (no walls)
    └── IMPORT WALLS      DXF / SVG initially → sidecar
              │
              ↓
      ExtractionResult     DRAFT ONLY
              ↓
      Review + Calibrate
              ↓
      normalizeExtraction
              ↓
      applyFloorplanToInterior
              ↓
      InteriorProject      SOURCE OF TRUTH
              ↓
      2D + 3D (raised: true, Option B)
              ↓
      Cabinets / materials / quote / export
```

Detection has one job: fill `ExtractionResult`. Studio 3D compiles `InteriorProject`. Sidecar GLB is draft preview only.

## Invariants (non-negotiable)

1. **Option B — Instant 3D.** Studio-created and imported walls write `raised: true`. `raised === false` is an explicit plan trace. Missing `raised` stays 3D (templates). Do **not** change `useLivingRoomPlanEditor` to `raised: false` for this importer. Domain default `?? false` is a test/capability mismatch; document it, do not “fix” Draw Room here.

2. **Apply uses existing editor history.** Expose Undo in Phase 2. Do not add a second snapshot store unless Undo is proven broken.

3. **Scale trust lives on `ExtractionResult`:** `UNKNOWN` | `ASSUMED` | `CALIBRATED`. `InteriorProject` stays mm-only. Unknown scale **blocks Apply** (Phase 2). Do not silently use `pixel_scale = 0.001` as trusted millwork.

4. **Multi-room before Apply (Phase 3.5).** Detect rooms → user picks the working room → **filter the draft** → Apply. Do not import an apartment and only switch `activeRoomId`. Apply already replaces the whole shell and requires ≥1 matched room loop.

## Phases

| ID | Work | Status |
| --- | --- | --- |
| 0 | Split Underlay vs Import Walls (two actions, not two file-type silos). PNG may extract later; it must not today. | This slice |
| 1 | Golden axis-aligned **single-room kitchen DXF** → review → calibrate → Apply (`raised: true`) → walls in existing 2D and 3D → **cabinet snaps** to an imported wall. No Raise step. No doors, layers, apartments, raster. | This slice |
| 2 | Human review UX, scale status, confirm replace, visible Undo. Hide JSON patch from sales UI. | Next |
| 3 | Serious DXF/SVG importer **in the sidecar**. Rectangle → L → openings → T → shared wall. Cabinet only consumes `ExtractionResult`. | Later |
| 3.5 | Room detection → pick working room → filter draft → Apply. | After 3 |
| 4 | Clean PNG/JPG raster, same draft schema, mandatory scale if unknown. | After 3.5 |
| 5 | Harder raster. **No GPT on the active board** until failed imports prove a crop-assistant is needed. | Later |
| 6 | Diagonals, DWG, messy architect sets. | Later |

Phase 1 fixture is constrained (axis-aligned, known scale, one room). “Real architect DXF” is the north star, not the first CI test. v1 still blocks diagonal AABB rewrite.

## Out of scope

- A second FloorPlan JSON + Three.js house generator
- GPT on every upload / CubiCasa as the engine
- Sidecar GLB as the editable scene
- Changing Draw Room to traces-first as part of import
- Multi-floor import as the story

## Phase 1 definition of done

> Axis-aligned single-room kitchen DXF → Import walls → review → calibrate → Apply → walls correct in existing 2D and 3D → cabinet snaps to an imported wall.

Proof in this repo: `fixtures/floorplanExtract/kitchen.dxf` (paired extract JSON), domain snap in `goldenKitchenApply.test.ts`, UI journey in `tests/e2e/floorplan-import-feedback.spec.ts`. `/extract` is still mocked (sidecar lives outside Cabinet); the DXF file is the real upload payload.

Run Apply on an empty/drawn room: Apply **replaces the shell and clears objects**.
