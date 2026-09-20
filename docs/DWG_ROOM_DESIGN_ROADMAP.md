# DWG room design

First milestone: a correctly scaled DWG tracing background in the existing 2D
workspace. First release still includes manual tracing, cabinets, 2D/3D sync,
and save/reopen of the complete design.

## Implemented (first milestone)

Users can choose a `.dwg`, parse it locally with LibreDWG Web 0.7.14, preview
and hide layers, set millimeters-per-unit (from INSUNITS or by hand), import as
an underlay, calibrate a known distance, pan/rotate/lock/hide, toggle layers
after import, and save/reopen without storing the original DWG bytes.

Saved projects keep compact layer path data. The SVG background is rebuilt on
open. Header units are a scale hint only; Calibrate remains required.

Drawn today: LINE, ARC, CIRCLE, ELLIPSE, LWPOLYLINE / POLYLINE (including bulge),
and nested INSERT blocks. Reported, not drawn: text, hatches, splines, paper
space, xrefs, tilted 3D entities, and other unsupported types.

DWG import does not create editable walls. Tracing, cabinets, and 2D/3D stay on
the existing room tools. Endpoint snap, layer-based wall suggestions, cabinet
block recognition, and native DWG export are later work.

## Still open

- Import 1–2 real architectural floor-plan DWGs and confirm a known wall length.
- The checked-in fixture `tests/fixtures/dwg/example_2018.dwg` is LibreDWG’s
  mixed-entity parser sample, not a customer room.
- Cabinet placement and 2D output on a DWG-backed project are not yet accepted.

## References

- LibreDWG Web: https://github.com/mlightcad/libredwg-web
- AutoCAD INSUNITS: https://help.autodesk.com/cloudhelp/2025/ENU/AutoCAD-Core/files/GUID-A58A87BB-482B-4042-A00A-EEF55A2B4FD8.htm
- License: LibreDWG Web is GPL-3.0; this repository is already GPLv3. Keep
  upstream notices when distributing the bundled WASM.
