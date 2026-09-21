# Camera Phase 5 — Product view cube (in-canvas 3D gizmo)

**Status:** Implemented (local)  
**Branch:** `fix/cabinet-orbit-screen-space-panning`  
**Direction locked:** Mockup **B** — game-engine style orientation cube (no McCurdy, no Present strip).

## What shipped

Always-on **in-canvas** 3D view cube on `CabinetScene`, rendered inside the R3F `Canvas` via `@react-three/drei` `GizmoHelper` + `GizmoViewcube` (Unity / Unreal / SketchUp style WebGL HUD).

| Interaction | Behavior |
|-------------|----------|
| Click a face | Tweens the default `OrbitControls` camera to that orthographic-ish orientation |
| Drag the cube | Rotates the main scene camera (gizmo drives `makeDefault` controls) |

The previous flat HTML bottom-right button overlay (`ViewCube.tsx`) was removed because it was easy to miss / clip under layout. The gizmo lives in the WebGL HUD at **bottom-right** (`alignment="bottom-right"`, `margin={[80, 80]}`).

Top ISO / Front / Side / Top text buttons stay out of the scene toolbar to avoid duplication; **Isolate** stays in the top-right toolbar. Ribbon / workspace camera buttons are unchanged.

`src/domain/orbit/viewCubeActions.ts` (+ tests) remains as mapping helpers for any future product face→preset wiring.

## Files

- `src/components/cabinetScene/SceneViewGizmo.tsx` — `GizmoHelper` + `GizmoViewcube`
- `src/components/CabinetScene.tsx` — mounts gizmo inside `Canvas` (OrbitControls `makeDefault` kept)
- `src/domain/orbit/viewCubeActions.ts` (+ test) — still valid helpers
- Obsolete: `ViewCube.tsx` HTML overlay and `.view-cube*` CSS removed

## Not in this phase

- McCurdy Display / Lighting / Performance panels
- Present-mode camera bookmark strip (mockup C)
- Compact named-save View menu (mockup A)
- Phase 4 debug HUD (`?cameraDebug=1`) — still separate / opt-in

## How to try

1. On branch tip with this commit, run the app as usual.
2. Open the cabinet **3D** editor canvas.
3. Use the bottom-right **3D orientation cube** in the WebGL view — no URL flag required.
