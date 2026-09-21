# DWG room design

First milestone: a correctly scaled DWG/DXF tracing background in the existing
2D workspace. First release is that background plus the existing room tools:
trace the real outline, openings, cabinets, 2D/3D, save/reopen, 2D sheet.

## Scale proof (checked-in drawings)

No customer floor-plan DWG is in the repo. Proof uses two files:

| File | Units | Drawn | Omitted | Wall layer |
| --- | --- | --- | --- | --- |
| `tests/fixtures/dwg/room_4000x3000.dxf` | INSUNITS 4 → 1 mm/unit. Overall 4000 × 3000 mm. South wall is 4000 mm. | 6 Walls LINEs, 2 door jambs, 1 window, 4-line `BASE-CABINET` INSERT (13 entities) | TEXT on Notes (1) | Yes — `Walls`, LINE, supported |
| `tests/fixtures/dwg/example_2018.dwg` | Header says mm; mixed parser sample spans kilometres. E2E sets scale `0.001`. | LINE/ARC/CIRCLE/POLYLINE/INSERT subset | Text, hatches, splines, paper space, and other unsupported types | Not a room drawing; layers are sample junk |

Import the DXF, leave millimetres-per-unit at `1`, calibrate the south wall to
4000 mm. The background stays 4000 × 3000 mm (identity scale). That is the
taped-wall proof.

LibreDWG WASM cannot read DXF (`dwg_read_data` / `dwg_read_file` return
nothing / error 2048). ASCII DXF uses `parseAsciiDxf`. `.dxf` opens the same
tracing dialog as `.dwg`. PNG/JPG/PDF import as a tracing underlay without the extract API.

## Implemented

Users can choose a `.dwg` or `.dxf`, preview and hide layers, set
millimetres-per-unit, import as an underlay, calibrate a known distance,
pan/rotate/lock/hide, toggle layers after import, and save/reopen without
storing the original file bytes.

Tracing snaps to visible DWG endpoints. **Suggest walls from layers** walks
LINE segments on `Walls` (or other selected visible layers) into a closed
polygon. **Place recognized cabinets** maps `BASE-CABINET` →
`living:base-cabinet-900` onto the nearest wall.

Drawn today: LINE, ARC, CIRCLE, ELLIPSE, LWPOLYLINE / POLYLINE (including
bulge), and nested INSERT blocks. Reported, not drawn: text, hatches, splines,
paper space, xrefs, tilted 3D entities, and other unsupported types.

## Native DWG export

Evaluated separately. See [`DWG_EXPORT_EVAL.md`](./DWG_EXPORT_EVAL.md). The
bundled WASM cannot write DWG. First release keeps the existing 2D sheet.

## References

- LibreDWG Web: https://github.com/mlightcad/libredwg-web
- AutoCAD INSUNITS: https://help.autodesk.com/cloudhelp/2025/ENU/AutoCAD-Core/files/GUID-A58A87BB-482B-4042-A00A-EEF55A2B4FD8.htm
- License: LibreDWG Web is GPL-3.0; this repository is already GPLv3. Keep
  upstream notices when distributing the bundled WASM.
