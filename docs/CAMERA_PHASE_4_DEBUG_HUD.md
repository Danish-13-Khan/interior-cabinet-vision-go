# Camera Phase 4 — Optional debug HUD

**Branch:** `fix/cabinet-orbit-screen-space-panning`  
**Status:** Implemented locally (uncommitted). Local only — do not push from bot.

## Enable

Off by default. Turn on either:

- URL: `?cameraDebug=1` (or bare `?cameraDebug`)
- localStorage: `cabinet.cameraDebug=1`

## What it shows

- Orbit readout: `screenSpacePanning`, damping, distance, target, polar
- Perf: FPS / frame ms, triangles, draw calls
- Exposure **readout only** (Model View) — does not write product lighting
- Frameloop label

## Session-only toggles

- Wireframe
- Grid (CabinetScene only)
- Punctual lights visibility

These do **not** persist into project / lighting stores.

## Files

- `src/domain/orbit/cameraDebug.ts` + test
- `src/components/cameraDebug/*`
- Wired in `CabinetScene` and `ModelViewInteractionRig`

## Out of scope (still Phase 5)

- Full McCurdy Display/Lighting/Performance clone
- HDR environment dropdown / lighting folder fork
