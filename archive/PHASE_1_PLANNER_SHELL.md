# Phase 1 — Planner Shell

**Status:** Complete

## Outcome

The existing interiors workspace now presents a simpler planner shell for the wardrobe-wall MVP. This phase intentionally changes navigation and discovery, not room/cabinet geometry.

## Delivered

- Four primary modes in the top workflow navigation: **Project**, **Build**, **Design**, and **Render**.
- An always-visible **2D / 3D** switch, independent from the primary workflow mode.
- A compact left rail: **Build**, **Cabinets**, **Furniture**, **Materials**, and **Layers**.
- Contextual library panels:
  - Build exposes floor-plan import and calibration.
  - Cabinets filters the existing catalog to cabinet items.
  - Furniture filters the catalog to non-cabinet interior items.
  - Materials exposes the active project palette.
  - Layers preserves scene visibility and selection navigation.
- The existing properties inspector and plan/model rendering remain unchanged; they continue to operate on the canonical `InteriorProject` state.

## Deliberately not part of this phase

- New wardrobe cabinet geometry or configuration rules.
- New room drawing tools.
- Changes to the 2D-to-3D compiler.
- Rendering improvements.

## Verification

- `npm run build` completes successfully.
- TypeScript confirms the new planner and tool-panel types are internally consistent.
- The shell reuses existing project, undo/redo, save, catalog placement, inspector, and view-switch commands.

## Next phase

Phase 2 builds the 2D room authoring contract for the wardrobe-wall workflow: room dimensions, wall/opening controls, snapping, and an imported-plan underlay decision.
