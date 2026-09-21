# Drawing fixtures

## `room_4000x3000.dxf` — known-scale L-room (scale proof)

Authored ASCII R2000-style DXF. Not a customer file; it stands in for one.

- `$INSUNITS` 4 (millimetres). Millimetres-per-unit = 1.
- Overall bounds 4000 × 3000 mm. Taped south wall is 4000 mm.
- L-outline on layer `Walls` (six LINE entities — supported).
- Door jambs on `Doors`, window on `Windows`, `BASE-CABINET` INSERT on `Cabinets`.
- One TEXT on `Notes` is omitted on purpose.

Drawn after import: 13 entities. Omitted: TEXT 1. Calibrating the south wall
to 4000 mm is an identity scale if the header units were honoured.

LibreDWG WASM cannot read this DXF. The app parses it with `parseAsciiDxf`.

## `example_2018.dwg` — LibreDWG parser sample

Upstream mixed-entity regression drawing:
https://github.com/LibreDWG/libredwg/blob/master/test/test-data/example_2018.dwg

Retrieved 2026-09-21. License: GNU GPL v3 or later. This is not a customer
floor plan. Geometry spans kilometres; the e2e sets scale `0.001` so it fits
the workspace. Synthetic tests cover block transforms, curves, units, and
persistence.
