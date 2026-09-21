# Camera Phase 0 — Baseline

**Branch:** `fix/cabinet-orbit-screen-space-panning`  
**Status:** Implementation baseline verified; baseline capture pending.  
**Scope:** Document current Model View vs CabinetScene orbit behavior. Do **not** change `screenSpacePanning` in this phase.  
**Repo tip verified:** `origin/main` @ `51e3555` (synced onto this branch before notes).

## Implementation baseline (verified in code)

### Model View — `src/components/livingRoomScene/ModelViewInteractionRig.tsx`

| Setting | Value | Source |
|---|---|---|
| `enableDamping` | `true` | prop |
| `dampingFactor` | `0.06` | longer glide |
| `screenSpacePanning` | `true` | `MODEL_VIEW_SCREEN_SPACE_PANNING` in `src/domain/livingRoom/modelViewCameraEase.ts` |
| `zoomToCursor` | `true` | `MODEL_VIEW_ZOOM_TO_CURSOR` |
| `panSpeed` / `zoomSpeed` / `rotateSpeed` | `1.05` / `1.05` / `0.92` | props |
| Frameloop | `demand` | `MODEL_VIEW_FRAMELOOP` via `ModelViewScene` |
| Mouse (orbit presets) | LMB rotate · middle pan · RMB pan | `mouseButtons` |
| Walkthrough exception | pan/zoom off; middle/RMB → rotate; walkthrough nav takes over | `viewPreset === "walkthrough"` |

LMB is free for orbit because pick/drag is coordinated separately (`enabled={!dragging}`).

### CabinetScene — editor canvas (`src/components/CabinetScene.tsx`)

| Setting | Value | Source |
|---|---|---|
| `enableDamping` | `true` | prop |
| `dampingFactor` | `0.15` | quicker settling than Model View |
| `screenSpacePanning` | **not set** | inherits OrbitControls default — Phase 1 will set `true` explicitly |
| `zoomToCursor` | **not set** | not enabled (zoom feel may differ vs Model View) |
| `rotateSpeed` | `0.8` | prop |
| Frameloop | Canvas default (continuous) | no `frameloop="demand"` |
| Mouse | LMB **undefined** (reserved for select/edit) · middle pan · RMB rotate | `mouseButtons` |
| Distances | `minDistance={1.1}` · `maxDistance={14}` · `target={[0, 0.7, 0]}` | props |

Intentionally **not** identical mouse maps to Model View — LMB stays for editing unless later usability testing says otherwise.

### Damping language (for Phase 2)

- Higher `dampingFactor` → **quicker settling** (less residual glide). CabinetScene `0.15`.
- Lower `dampingFactor` → **longer glide**. Model View `0.06`.
- Hands-on choice later; not an external-viewer copy requirement.

## Baseline capture checklist (pending — do before Phase 1)

Use **equivalent geometry** and **similar camera framing**. Identical GLB is not required if canvases load content differently.

Record short clips / notes for each canvas:

1. Orbit (LMB or RMB as mapped)
2. Pan including **vertical** at **front**, **oblique**, and **near-top** views
3. Zoom — **mouse wheel** and **trackpad**
4. After release of move / rotate / resize / marquee (CabinetScene) — camera must not jump
5. Model View walkthrough: confirm exception (look + WASD), note separately

Store clips/notes with this branch (e.g. `docs/camera-baseline-clips/` or a linked drive) as the **before** side of Phase 2.

**Pan acceptance target (Phase 2):** At front, oblique, and near-top views, vertical pan follows the screen’s vertical direction without disrupting cabinet editing.

## What Phase 1 will change (not done yet)

- CabinetScene only: set `screenSpacePanning={true}` explicitly.
- No other orbit props in that pass.

## Stopping rule (after Phase 2)

If navigation feels acceptable and interaction checks pass → ship and **close** camera-parity work. Phases 3–4 are separate optional tasks only if opened. Pre-existing issues that also appear in this baseline → note as separate tasks; they do not block Phase 1 unless they prevent pan acceptance or are new regressions.

## External viewer

External glTF viewer comparison is **optional** reference only. Own before/after recordings decide acceptance.
