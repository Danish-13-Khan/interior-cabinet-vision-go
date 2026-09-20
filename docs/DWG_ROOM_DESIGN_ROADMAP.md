# DWG room design implementation

Branch: `codex/dwg-room-design-roadmap`, based on local `main` at `b3569c8`.
Worktree: `../cabinet-designer-dwg-roadmap`.

## Isolation and integration

Keep development and verification in this worktree. Do not change, stash, reset,
or switch the parallel `fix/import-plan-underlay-only` checkout. Do not reuse its
running development server. This branch does not yet include that parallel work.
When the parallel work is committed and ready, reconcile both branches in an
integration worktree, resolve overlaps, and run regression tests before bringing
the result into the original project. No merge has been performed.

## First release

DWG upload → calibrated background → manual wall tracing → cabinet placement →
synchronized 2D/3D → save/reopen.

1. Validate LibreDWG Web with representative DWGs: geometry, units, blocks,
   unsupported content and distribution licensing.
2. Add browser worker parsing, file selection, progress/error/cancel handling,
   import diagnostics and a zoomable background.
3. Read units, verify a known distance, and support rotation, positioning and layers.
4. Reuse editable wall tracing; verify wall thickness/height, closure, openings and undo.
5. Verify shared room geometry remains synchronized in both views.
6. Connect cabinet selection, wall snapping, mounting height and fit checks.
7. Persist background, scale, layers, room and cabinets; verify reopening and 2D output.

## Started in this branch

- Added pure INSUNITS conversion and validated drawing-bounds conversion to mm.
- Added scale tests for metric, imperial, survey feet, offset origins and invalid inputs.
- Unitless, malformed and unsupported unit codes return no scale: the importer
  must request calibration. Header units must still be verified by a known distance.
- Existing main already provides image/PDF underlays, transforms and calibration.
  Reuse those paths after adding the DWG adapter.

This is an implementation foundation, not a working DWG upload feature yet.
No representative user DWGs have been validated. Parser dependency, worker,
geometry rendering and UI integration remain to be implemented.

## References

- LibreDWG Web API: https://github.com/mlightcad/libredwg-web/tree/master/bindings/javascript
- AutoCAD INSUNITS: https://help.autodesk.com/cloudhelp/2025/ENU/AutoCAD-Core/files/GUID-A58A87BB-482B-4042-A00A-EEF55A2B4FD8.htm

## Later

Endpoint snapping, layer-based wall suggestions, known cabinet block recognition,
and a separate native DWG export evaluation.

## Initial verification

Focused DWG tests: 24 passed.
The repository test script also ran the full suite: 1,266 passed, 10 failed
across 7 files. Failures were in existing File/crypto-dependent and PDF checks;
the shell currently uses Node 18.15.0, below several dependency requirements.
Repeat baseline verification under a supported Node runtime before integration.
No existing production modules were changed by this initial implementation.

## Browser import implementation

The active project checkout now uses `codex/dwg-room-design-roadmap`, at the
user's request. The original sibling worktree is detached at the foundation commit.

Implemented: pinned LibreDWG Web 0.7.14, bundled local WASM, worker parsing with
cancellation and timeout, DWG file selection, preview zoom, layer selection at
import, unit-derived scale or manual millimeters-per-unit entry, explicit omitted
entity reporting, and import into the existing calibration/transform workflow.
SVG background, exact dimensions, transforms and the import report persist through
the existing project model. DWG import does not generate editable walls.

The initial geometry adapter supports planar LINE, straight LWPOLYLINE and CIRCLE.
Blocks, arcs, curved polylines, text, hatches and other unsupported entities are
reported, not silently approximated. Layers can be selected in the import dialog;
changing layer visibility after import requires reimporting the DWG. The source
DWG bytes are not saved; the generated self-contained SVG is saved.

Verification: 42 focused tests pass, including scale, geometry, calibration and
JSON save/reopen. Production build passes. A headless Chromium smoke test of the
built worker parsed upstream `test/test-data/example_2018.dwg`: 8 entities drawn,
one layer, millimeter units, with unsupported types reported. This is a mixed-entity
parser sample, not representative validation of a customer room drawing.

Dependency metadata identifies LibreDWG Web as GPL-3.0; the repository contains
GPLv3 license text. Preserve upstream notices and provide corresponding source
when distributing the bundled dependency. Dependency source:
https://github.com/mlightcad/libredwg-web

Still pending: broader entity/block support, representative customer DWGs,
end-to-end room tracing/cabinet integration acceptance, and full application
save/reopen/output regression validation. Do not call the complete roadmap done.
