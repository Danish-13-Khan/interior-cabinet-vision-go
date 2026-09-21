# Camera Phase 5 — Product view cube

**Status:** Implemented (local)  
**Branch:** `fix/cabinet-orbit-screen-space-panning`  
**Direction locked:** Mockup **B** — minimalist corner view cube (no McCurdy, no Present strip).

## What shipped

Always-on product control on `CabinetScene` (bottom-right):

| Control | Action |
|---------|--------|
| **Home** | Iso preset + fit |
| **Front / Side / Top** | Matching preset + fit |
| **Reset** | Fit framing only (keeps current preset) |

Top ISO / Front / Side / Top text buttons were removed from the scene toolbar to avoid duplication; **Isolate** stays in the top-right toolbar. Ribbon / workspace camera buttons are unchanged.

## Files

- `src/domain/orbit/viewCubeActions.ts` (+ test)
- `src/components/cabinetScene/ViewCube.tsx`
- `src/components/CabinetScene.tsx` (wire-up)
- `src/styles/scene.css` (`.view-cube*`)

## Not in this phase

- McCurdy Display / Lighting / Performance panels
- Present-mode camera bookmark strip (mockup C)
- Compact named-save View menu (mockup A)
- Phase 4 debug HUD (`?cameraDebug=1`) — still separate / opt-in

## How to try

1. On branch tip with this commit, run the app as usual.
2. Open the cabinet **3D** editor canvas.
3. Use the bottom-right cube — no URL flag required.
