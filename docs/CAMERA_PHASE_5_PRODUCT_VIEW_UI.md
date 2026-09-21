# Camera Phase 5 — Product view cube (in-canvas 3D gizmo)

**Status:** Removed from both canvases at user request.
**Branch:** `fix/cabinet-orbit-screen-space-panning`  
**Direction locked:** Mockup **B** — game-engine style orientation cube (no McCurdy, no Present strip).

The orientation cube HUD is no longer mounted in CabinetScene or Model View. Existing toolbar camera controls remain available. The notes below describe the previous implementation.

## Previous implementation

Always-on **in-canvas** 3D view cube via `@react-three/drei` `GizmoHelper` + `GizmoViewcube` (Unity / Unreal / SketchUp style WebGL HUD), mounted on **both** 3D canvases:

| Canvas | Component |
|--------|-----------|
| Cabinets **3D Support** pane | `CabinetScene` |
| Interiors **Model View** | `ModelViewScene` (hidden when `interactive={false}`, e.g. client presentation) |

| Interaction | Behavior |
|-------------|----------|
| **Click a face / edge / corner** | Tweens the default `OrbitControls` camera to that orientation |
| Orbit the scene | Cube orientation tracks the main camera |

There is **no** dedicated “drag the cube to free-spin the world” gesture. Face / edge / corner **click-to-orient** only (drei `tweenCamera`). Older docs that claimed drag-rotate on the cube were wrong.

The previous flat HTML bottom-right button overlay (`ViewCube.tsx`) was removed. The gizmo lives in the WebGL HUD at **bottom-right** (`alignment="bottom-right"`, `margin={[80, 80]}`).

Cabinets scene toolbar keeps **Isolate**; ISO / Front / Side / Top text buttons stay out to avoid duplication. Ribbon / workspace camera buttons and Model View’s existing preset chrome are unchanged.

`src/domain/orbit/viewCubeActions.ts` (+ tests) remains as mapping helpers for any future product face→preset wiring.

## Files

- `src/components/cabinetScene/SceneViewGizmo.tsx` — shared `GizmoHelper` + `GizmoViewcube`
- `src/components/CabinetScene.tsx` — mounts gizmo inside Cabinets `Canvas` (`OrbitControls` `makeDefault` kept)
- `src/components/livingRoomScene/ModelViewScene.tsx` — mounts same gizmo inside Model View `Canvas` (interaction rig already uses `makeDefault` OrbitControls)
- `src/domain/orbit/viewCubeActions.ts` (+ test) — still valid helpers
- Obsolete: `ViewCube.tsx` HTML overlay and `.view-cube*` CSS removed

## Not in this phase

- McCurdy Display / Lighting / Performance panels
- Present-mode camera bookmark strip (mockup C)
- Compact named-save View menu (mockup A)
- Phase 4 debug HUD (`?cameraDebug=1`) — still separate / opt-in
- Object move / rotate / resize handles (selection gizmos) — separate from the view cube; need an active selection / floor attachment as before

## Previous verification steps (before removal)

1. Run the app with these local files (no commit — review first).
2. Open **Interiors → Model View** *or* Cabinets **3D** Support pane.
3. Bottom-right **3D orientation cube** — click a face to snap camera. No URL flag required.
