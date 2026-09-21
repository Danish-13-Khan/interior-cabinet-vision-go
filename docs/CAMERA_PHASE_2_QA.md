# Camera Phase 2 — Interaction QA

**Branch:** `fix/cabinet-orbit-screen-space-panning`  
**Depends on:** Phase 0 baseline notes + Phase 1 (`screenSpacePanning` on CabinetScene)  
**Goal:** Accept or reject camera-parity with observable checks. If pass → ship and **close**. Do not start Phase 3/4 unless opened as separate tasks.

## Preconditions

- [ ] Phase 0 baseline clips/notes available (or re-capture “before” if missing — use similar framing/geometry; identical GLB not required)
- [ ] Phase 1 change present: CabinetScene `OrbitControls` has `screenSpacePanning` (or `screenSpacePanning={true}`)
- [ ] No other orbit/mouse-map edits mixed into this QA pass

## Compare setup

| Item | Guidance |
|---|---|
| Content | Equivalent rooms/cabinets OK; identical GLB not required |
| Framing | Similar distance / facing when comparing Model View vs CabinetScene |
| External viewer | Optional reference only — own before/after decides pass |

## Checklist — CabinetScene (after Phase 1)

Mark Pass / Fail. Fail only blocks ship if it is a **new regression** vs Phase 0 baseline, or it **breaks pan acceptance**. Pre-existing issues → note as separate tasks.

### Pan acceptance (required)

At each view, vertical pan must follow the **screen’s vertical** direction and must **not** disrupt select/edit:

| View | Pass? | Notes |
|---|---|---|
| Front | | |
| Oblique | | |
| Near-top | | |

### Orbit / zoom / devices

| Check | Pass? | Notes |
|---|---|---|
| Orbit (RMB rotate as mapped) | | |
| Zoom — mouse wheel | | |
| Zoom — trackpad | | |
| Zoom feel vs Model View (`zoomToCursor` on MV, unset on Cabinet) — note only unless blocking | | |

### Editing interaction (required)

| Check | Pass? | Notes |
|---|---|---|
| LMB select still works | | |
| Move drag — camera stable after release | | |
| Rotate gizmo — camera stable after release | | |
| Resize — camera stable after release | | |
| Marquee select — camera stable after release | | |

### Model View (sanity — should be unchanged)

| Check | Pass? | Notes |
|---|---|---|
| Orbit / pan / zoom still as Phase 0 | | |
| Walkthrough mouse-map exception still correct | | |

## Damping (observe only unless failing)

- Model View `0.06` → longer glide  
- CabinetScene `0.15` → quicker settling  
- Do **not** change damping in this phase unless pan acceptance fails and damping is the proven cause (then open a separate one-axis change).

## Decision

- [ ] **PASS** — navigation acceptable + interaction checks pass → ship Phase 1; **close camera-parity work**
- [ ] **FAIL** — list blocking items only (new regressions or pan-acceptance failures). Fix with one-axis changes or revert Phase 1; re-run this checklist

### Freeze after PASS (optional micro-follow-up, still this PR if desired)

Named constants already on Model View (`MODEL_VIEW_SCREEN_SPACE_PANNING`). Optionally mirror CabinetScene with an explicit `CABINET_SCENE_SCREEN_SPACE_PANNING = true` constant — cosmetic clarity only, not required to close Phase 2.

## Out of scope here

- Shared OrbitControls preset helper (Phase 3)
- Demand-loop / always-on RAF changes (Phase 3)
- Debug HUD (Phase 4)
- Matching mouse maps between canvases
