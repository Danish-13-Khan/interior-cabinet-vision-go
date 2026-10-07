# Cycles still engine

Phase 3 of [`docs/PHOTO_STILLS_RENDER_ROADMAP.md`](../../docs/PHOTO_STILLS_RENDER_ROADMAP.md): the
"controlled offline renderer" slot of the hybrid stills pipeline. Blender Cycles rebuilds the
**authored** scene from a bundle the app exports, renders it with pinned settings, and writes a
provenance file the app's Still review checks before the still can enter a client package.

## Files

| File | Role |
| --- | --- |
| `still_bundle_math.py` | Pure helpers: three.js → Blender transforms, light-unit table. Self-checked against three.js by `scripts/cycles/check-bundle-math.mjs`. |
| `cycles_scene.py` | Rebuilds materials, primitives, catalog GLBs, fixtures, lights, camera and world from the bundle. |
| `render_still.py` | Entry point: Cycles settings, emission-masked glow, render, provenance, optional rerun gate. |

## Run it

Blender 4.x or 5.x must be installed (macOS: `/Applications/Blender.app`, or set `BLENDER=/path/to/blender`).

```bash
npm run cycles:check                                   # finds Blender, cross-checks the transform math
npm run cycles:bundle -- --template 2bhk --out .cycles/2bhk   # or --project my-project.json
npm run cycles:render -- .cycles/2bhk --rerun          # still.png + provenance.json next to bundle.json
```

### As a service (local Blender, Docker, or EC2)

```bash
npm run cycles:serve                                   # http://localhost:8787 using the local Blender
CYCLES_FAKE_RENDER=1 npm run cycles:serve              # no Blender: placeholder still, real provenance shape
docker build -f docker/cycles/Dockerfile -t cabinet-cycles .   # after git lfs pull
docker run --rm -p 8787:8787 -v cycles-jobs:/jobs cabinet-cycles
```

Point a seat at it with `localStorage.setItem("cabinet-designer:cycles-service-url", "http://localhost:8787")`
or build with `VITE_CYCLES_RENDER_URL`. Still review then shows **Render photo…**.

In the app, **Present → Export photo job…** writes the same `bundle.json` for the saved camera.
Render it as above, then **Still review → Import photo still…** picks `provenance.json` and
`still.png`, captures the WebGL plate for the overlay and runs the trust gates.

## What the bundle carries

- Geometry as descriptions, not meshes: boxes, cylinders and polygon prisms with exact sizes, in
  three.js local frames; catalog GLBs by public asset key with their slot → material-id bindings.
- Materials by id with the style tint. A scanned finish points at
  `render-sources/materials/<id>/` and its `source.json` means (`npm run cycles:means`), so the
  still's albedo is the style colour with the scan as detail, the viewport's rule.
- Every fixture's bodies and lights in the fixture's frame (emitter on local −Z), recipe lights and
  window keys in the physical units the viewport already uses: nits for area lights, candela for
  spots and points, lux for suns.
- The active HDRI and its strength, the style exposure and tone mapping, the camera pose and
  vertical field of view, render size, sample cap, time cap and seed.

## Light units (version 1)

| Bundle unit | Blender | Formula |
| --- | --- | --- |
| nits, area w×h | area light power W | nits · w · h · π / 683 |
| candela (point, spot) | power W | cd · 4π / 683 |
| lux (sun) | strength W/m² | lux / 683 |
| emissiveIntensity | emission strength | × 4 |

`CALIBRATION` in `still_bundle_math.py` multiplies those formulas. Version 2 (measured on the
2 BHK, Blender 5.2, 2026-10-07): area 250, point 250, spot 250, sun 50, emission 1, plus
`EXPOSURE_OFFSET_STOPS = 1`. At 1.0 everywhere the cove was a 0.09 W light and the frame read
luma 32. Change the factors only from a measured render and bump `CYCLES_LIGHT_UNITS_VERSION`
in `src/domain/livingRoom/cyclesBundle/types.ts` and `LIGHT_UNITS_VERSION` here together.

Blender 4.x and 5.x are both supported; 5.x moved the compositor to a node group on the scene,
shares the Mix node with shaders, ends in a group output and calls the pass `Emission`.

## Determinism

Pinned seed, fixed sample and time caps, CPU OpenImageDenoise, AgX view transform. `--rerun`
renders twice and records the mean absolute 8-bit channel difference; the app's
`deterministic_rerun` gate fails without it. The trust contract's limit is 2 % of the channel range.
