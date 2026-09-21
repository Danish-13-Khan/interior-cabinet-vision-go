# Native DWG export evaluation

This is an evaluation only. The first release does not write DWG.

## What the bundled reader can do

LibreDWG Web 0.7.14 in this repo is built with `--disable-write`. The WASM
surface exposes `dwg_read_file` and `dwg_write_dxf`. There is no
`dwg_write_file` / native DWG writer in the shipped module.

Probing `dwg_read_data(..., Dwg_File_Type.DXF)` on a known-scale ASCII DXF
returns no database. DXF import therefore uses a local ASCII parser; DWG import
still uses LibreDWG.

## Product options

1. **Keep 2D sheet export (current).** PDF/PNG from the existing plan sheet
   already covers the first-release deliverable.
2. **ASCII DXF export later.** Possible without a new native dependency: write
   HEADER `$INSUNITS=4`, Walls/Doors/Windows, and LINE/INSERT entities from the
   project graph. Interoperable, not a round-trip DWG.
3. **Native DWG write later.** Would need a different library or a
   write-enabled LibreDWG build, plus GPL distribution of that binary. Do not
   treat “export DWG” as a small follow-up to the tracing underlay.

## Recommendation

Do not promise native DWG export from this WASM. If a CAD file must leave the
app, prefer a new ASCII DXF writer after the tracing workflow is accepted.
