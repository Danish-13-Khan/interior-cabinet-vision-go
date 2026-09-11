# 3D Presentation Quality — Technical Review & Roadmap

**Document role:** Review of the living-room WebGL Model View / Render Studio stack and phased improvement plan  
**Status:** REVISED DRAFT — awaiting product/engineering review (implementation not started under this doc)  
**Date:** 2026-09-11 (revised same day after source review)  
**Related:** [Phase 1 — WebGL Presentation Floor](./PHASE_1_WEBGL_PRESENTATION_FLOOR.md) · [Phase 2 — Hybrid Stills Pipeline](./PHASE_2_HYBRID_STILLS_PIPELINE.md) · [Product Decisions](./PRODUCT_DECISIONS.md)

**Hard constraints:**

- No Three types or absolute paths in InteriorProject JSON
- Prefer focused modules (repo ≤200-line script ceiling)
- No new npm packages for this program — reuse installed `three`, `@react-three/fiber`, `@react-three/drei` only
- No `@react-three/postprocessing`, no BVH, no path tracer in the live viewport unless product explicitly reopens Phase 1
- Honest claims: interactive WebGL presentation, not photoreal marketing stills (Phase 2 owns wow frames)
- Do not rewrite the renderer; tune existing compile → R3F path

**Revision note (source review):** The first draft incorrectly treated `PCFSoftShadowMap` as a P0 fix. On Three **r185** (installed), soft-PCF is already the `PCFShadowMap` path; a type swap alone would not improve visuals. Shadow work is now bias / radius / frustum + caster coverage. Material work must target Model View override functions, not only `heroRenderQuality.ts`. P0 validation must include Model View viewport checks, not export-only Phase 1 stills.

---

## 1. Verdict

The app already has a **real presentation stack** (R3F + Drei, quality presets, HDRI, `MeshPhysicalMaterial`, contact shadows, ACES). It still reads “flat CAD” mainly because of:

1. **GLB furniture does not cast realtime shadows in Model View** (`castShadow` only when `renderMode === "hero"`; Model View is always `preview`) — **confirmed primary grounding bug**
2. **Shadow softness / depth is under-tuned**, not “miswired to the wrong map type” — radius, bias, normalBias, and fixed ±7 m frustums need a measured audit against room size
3. **Incomplete or low-res material maps** on some finishes (procedural fallbacks; partial curated sets) — but Model View Standard already boosts anisotropy / env response via dedicated overrides
4. **Camera feel is OrbitControls-only** — fit/focus is abrupt; walkthrough exists; further UX can stay on existing Drei controls
5. **In-viewport post-processing is intentionally out** — MSAA + export still polish only

Stale style metadata (`shadowMap: "pcf-soft"`) is documentation debt, not a runtime bug on r185.

---

## 2. Current state

| Area | Status |
|------|--------|
| Stack | Installed `three` r185, R3F, Drei — **no new deps planned** |
| Color | ACESFilmic + sRGB + exposure (`RendererColorPipeline`) |
| Quality | Project: draft / standard / client-preview / presentation; **Model View safe:** draft / standard only |
| Lighting | Hemisphere + recipes + window keys + HDRI / Lightformer |
| Materials | MeshPhysical + curated / procedural maps |
| Shadows | Directional maps + Drei `ContactShadows` (`frames={1}`) |
| Camera | OrbitControls, presets, fit room / focus selection, walkthrough WASD |
| Export | Supersample + unsharp + vignette + depth contact (still engine) |

### Scene mount

```
LivingRoomModelView → ModelViewScene → CompiledSceneRenderer
  RendererColorPipeline
  RenderLightingRig
  CompiledNodeView → procedural / AssetBackedObject
  ModelViewInteractionRig (ContactShadows, OrbitControls, CameraRig)

LivingRoomRenderStudio → LivingRoomRenderCanvas + RenderCaptureBridge
```

### Key files

| Concern | Path |
|---------|------|
| Model Canvas | `src/components/livingRoomScene/ModelViewScene.tsx` |
| Color / exposure / shadow map type | `src/components/livingRoomScene/RendererColorPipeline.tsx` |
| Contact + orbit | `src/components/livingRoomScene/ModelViewInteractionRig.tsx` |
| Camera pose / fit | `src/components/livingRoomScene/CameraRig.tsx` |
| **Model View lighting / material overrides** | `src/domain/livingRoom/modelViewPreviewDefaults.ts` |
| Generic preview/hero material ladder | `src/domain/livingRoom/heroRenderQuality.ts` |
| Env / shadow quality map | `src/domain/livingRoom/environmentLightingQuality.ts` |
| Project lights (bias / frustum) | `src/rendering/lighting/SceneProjectLights.tsx` |
| Window keys | `src/rendering/lighting/WindowKeyLight.tsx` |
| GLB cast / receive | `src/components/livingRoomScene/AssetBackedObject.tsx` |
| Presets | `src/domain/livingRoom/renderPresets/definitions.ts` |

---

## 3. Effective Model View runtime (do not ignore)

Model View does **not** use generic `getRenderModeQuality("preview", …)` alone. When the viewport profile is active, materials and lighting resolve through:

- `resolveModelViewLightingQuality(quality)`
- `resolveModelViewMaterialQuality(quality)`
- `modelViewProjectLightScale` / `modelViewWindowKeyScale`
- `describeModelViewRuntimeProfile` (diagnostics / tests)

| Knob | Draft Model View | Standard Model View | Notes |
|------|------------------|---------------------|-------|
| `renderMode` | `preview` | `preview` | Never hero |
| Anisotropy | **6** | **10** | Already ≥ proposed “8” on Standard |
| `envMapIntensityScale` | **0.94** | **1.06** | Above generic preview ladder |
| Texture detail | low | high | Procedural width 128 / **256** |
| Shadow map size | 640 | ≥768 | From Model View lighting override |
| Shadow radius | base + 2 | base + 3 | Softer than generic preview |
| Contact opacity / blur scales | 1.1 / 1.14 | 1.2 / 1.1 | Grounding boosted |
| Project light scale | 0.88 | 0.94 | |
| Window key scale | 0.98 | 1.08 | |
| `preferHdri` | true | true | Forced on in Model View |

**Implication:** Bumping anisotropy via `heroRenderQuality.ts` alone may **do nothing in Model View** (overrides win) or **change Render Studio** unintentionally. Viewport material/lighting work must edit `modelViewPreviewDefaults.ts` (and tests in `modelViewPreviewDefaults.test.ts`). Studio/export work stays on `heroRenderQuality.ts` / preset definitions.

### Current directional shadow parameters (audit targets)

| Source | Bias | Normal bias | Radius usage | Frustum |
|--------|------|-------------|--------------|---------|
| `SceneProjectLights` | −0.00028 | 0.04 | `shadowRadius + 2` on directionals | Fixed **±7** m, near 0.1 / far 30 |
| `WindowKeyLight` | −0.0003 | 0.035 | `shadowRadius + 1` | Pad from light; near 0.2 / far 28 |

`RendererColorPipeline` sets `PCFShadowMap` — correct for r185 soft-PCF behavior. Style field `"pcf-soft"` is leftover metadata; clean up when touching styles, do not treat as a shadow-engine switch.

---

## 4. Problems → symptoms (corrected)

| User symptom | Cause |
|--------------|-------|
| Furniture floats | GLB `castShadow` gated on hero only — **fix in Model View Standard+** |
| Weak / blotchy shadows | Radius / bias / frustum not fit to room; contact carries too much of grounding |
| Flat materials | Incomplete maps / procedural fallbacks; **not** missing Standard anisotropy (already 10) |
| Dull lighting | May need Model View intensity/contact retune after castShadow lands — measure first |
| Soft image | Draft DPR 1; MSAA only (by design) |
| Camera not “pro” | Orbit + one-shot fit; improve within existing Drei OrbitControls / CameraRig |

---

## 5. Recommended architecture

```
Model View (draft | standard, always preview mode)
  → tune modelViewPreviewDefaults + casters + shadow params
  → acceptance = interactive viewport checks

Render Studio (hero tiers for capture)
  → keep separate ladders; do not conflate with Model View overrides

Phase 2 stills
  → photoreal / wow frames (out of this interactive program)
```

**Dependency policy:** zero new packages. Prefer parameter and asset work inside existing modules. Optional later camera polish uses APIs already available from installed Drei/Three — no new control library.

---

## 6. Phased roadmap

### Phase A — Quick wins · P0

| Item | Why | What changes | Files | Trade-off |
|------|-----|--------------|-------|-----------|
| **Gated GLB castShadow in Model View Standard** | Primary float bug | Cast when Model View quality is `standard` (keep draft contact-only or lighter). Preview mode stays preview — only caster flag changes | `AssetBackedObject.tsx`, optional quality helper | More GPU cost on Standard; must budget FPS |
| **Shadow bias / radius / frustum audit** | Softness & acne, not map type | Measure room-scale; fit directional ortho frustum to room AABB (replace fixed ±7 where needed); tune bias / normalBias / radius via existing `shadowRadius` ladders | `SceneProjectLights.tsx`, `WindowKeyLight.tsx`, `resolveModelViewLightingQuality`, maybe small domain helper | Wrong bias → acne or peter-panning |
| **Stale style metadata cleanup** | Avoid future false “pcf-soft” fixes | Align style docs/fields with r185 (`PCFShadowMap`) | `stylePresets.ts` (metadata only) | None |
| **Model View lighting retune after casters** | Avoid guessing intensity before grounding exists | Adjust contact/window/project scales in `resolveModelViewLightingQuality` only after Standard cast is on | `modelViewPreviewDefaults.ts` | Overbright if done before casters |
| **Do not raise Model View default to Standard yet** | Perf unknown | Keep Draft default until viewport budget passes; optional UI hint that Standard is richer | Model View UI / defaults | Raising default too early hurts low-end machines |

**Out of P0:** swapping shadow map enums for “softness”; anisotropy bumps aimed at Model View via `heroRenderQuality.ts`.

### Phase B — Rendering sharpness · P1

| Item | Why | What | Files | Caveat |
|------|-----|------|-------|--------|
| Keep MSAA | Already on Canvas | No change unless product opens postprocessing | `ModelViewScene.tsx` | — |
| DPR | Soft on retina Draft | Leave Draft at 1; Standard already 1.5 — document only unless measured need | presets | Battery |
| Anisotropy / env | Only if Standard still soft *after* maps | Tune **`resolveModelViewMaterialQuality`**, not only hero ladder | `modelViewPreviewDefaults.ts` | Studio path separate |
| Capture polish | Client PNGs | Leave still engine as-is for this program | still engine | — |

### Phase C — Lighting · P1

| Item | Why | What | Files | Caveat |
|------|-----|------|-------|--------|
| Caster budget | Many objects | Prefer 1–2 directional casters; fills without maps | recipes + `SceneProjectLights` | Less drama |
| Room-fit shadow camera | Large rooms | Shared helper: frustum from room bounds | new small helper under `src/domain/livingRoom/` or `src/rendering/lighting/` | Update on room edit |
| IBL vs ambient balance | After P0 | Prefer HDRI response; nudge ambient via Model View scales | `modelViewPreviewDefaults`, `EnvironmentLighting` | Measure in Standard |
| HDR intensity UI | Nice-to-have | Expose existing exposure / intensity already in render settings | existing UI | Scope |

### Phase D — Materials · P1

| Item | Why | What | Files | Caveat |
|------|-----|------|-------|--------|
| Curated map completeness | Flat woods/laminates | Add normal/rough where missing; keep bytes project-owned | `textureManifest`, `materialManifest`, `CuratedPbrMaterial` | Bundle size |
| Procedural fallback | Gaps | Optional higher width on Standard only via Model View textureDetail (already high @ 256) | `proceduralMapQuality` + Model View profile | CPU |
| Path separation | Avoid cross-breaks | Model View → `resolveModelViewMaterialQuality`; Studio → `getRenderModeQuality` / hero | both ladders + tests | Dual maintenance |

### Phase E — Camera · P1 (existing stack only)

| Item | Why | What | Files | Caveat |
|------|-----|------|-------|--------|
| Smoother focus / fit | Abrupt reframes | Lerp target/position in `CameraRig` over ~200–400 ms | `CameraRig.tsx`, `modelViewFit.ts` | Don’t fight drag |
| Limit polish | Disorientation | Optional minPolar / floor-locked pan on OrbitControls | `ModelViewInteractionRig.tsx` | Dollhouse |
| Preset easing | Pro feel | Ease between existing presets | `CameraRig`, `modelViewPresets` | Ortho↔persp |
| FOV / clip | Already ~42°, near 0.05 / far 100 | Scale `far` with `roomSpan` if large plans clip | `ModelViewScene`, fit helpers | Z-fight |

No new camera package. If Drei’s `CameraControls` is considered later, that is a **separate product decision** (still no new npm dep) and not part of P0.

### Phase F — Post-processing · deferred

In-viewport SSAO / SMAA / bloom remain **out**. Export still grade and Phase 2 hybrid stills remain the photoreal path.

### Phase G — Performance · P1–P2

| Item | Why | What | Files | Caveat |
|------|-----|------|-------|--------|
| Standard castShadow budget | P0 may cost FPS | Cap simultaneous casters; draft stays lighter | quality helpers | Visual vs speed |
| Demand frameloop | Idle GPU | `frameloop="demand"` + invalidate on interaction | Canvas / controls | Missed redraws |
| Adaptive DPR | Large rooms | Only if needed — prefer Drei helpers already installed | `ModelViewScene` | Flicker |
| Material sharing / dispose | Memory | Existing loaders | loaders | — |

### Phase H — Production quality bar

| Track | Goal |
|-------|------|
| Model View Standard | Grounded GLBs, readable materials, orbit stays responsive |
| Draft | Fast authoring; honest thinner lighting/shadows |
| Client package | Unchanged Studio hero + Phase 2 for wow |
| Desktop / web | Meet interactive budget below before raising defaults |

---

## 7. P0 implementation slice (approved direction)

**Start here — no new dependencies:**

1. Enable **GLB `castShadow` for Model View Standard** (preview mode, gated).  
2. Run **Model View acceptance** (section 8) and record a simple perf note (frame feel / interaction).  
3. **Audit and tune** shadow bias, radius, and frustum for Standard with casters on.  
4. Retune **Model View** contact / window / project scales only if still flat or too dark.  
5. Clean stale `pcf-soft` style metadata when convenient.  
6. **Do not** change default viewport quality to Standard until budgets pass.

---

## 8. Acceptance criteria

### 8.1 Model View (required for P0 — primary)

| Check | Pass condition |
|-------|----------------|
| Furniture grounding (Standard) | Selected Kenney/GLB pieces cast onto floor; contact + map shadows read as one grounded object |
| Draft vs Standard | Draft remains lighter/faster; Standard visibly better grounded — not identical |
| GLB load | Lamp / plant / sofa load without fallback flicker for known assets |
| Move object | Drag XYZ; mesh, outline, and gizmo stay aligned; shadow follows |
| Orbit / pan / zoom | Damping feels stable; no multi-second hitch after quality toggle |
| Performance budget | On target laptop/desktop: Standard room with ~15–25 objects stays interactive (no sustained stutter while orbiting). Exact FPS gate set during P0 measurement — block raising default until recorded |
| Walkthrough smoke | Enter/exit walkthrough still works after caster change |

Export / Phase 1 still comparisons are **optional** for this slice; they do not replace viewport checks.

### 8.2 Render Studio (regression only for P0)

| Check | Pass condition |
|-------|----------------|
| Draft vs Client Preview stills | Still visibly different (existing Phase 1 intent) |
| Hero castShadow | Unchanged behavior for non-draft studio modes |

### 8.3 Explicit non-validation

- Do not treat “switched shadow map enum” as a success metric  
- Do not use anisotropy ≥8 in `heroRenderQuality` as Model View proof (Standard already at 10 via overrides)

---

## 9. Priority summary

| Priority | Work |
|----------|------|
| **P0** | Standard-preview GLB castShadow → Model View benchmarks → bias/radius/frustum tune → optional Model View light retune |
| **P1** | Curated maps; Model View material tweaks in `modelViewPreviewDefaults`; camera easing; caster budget / demand frameloop |
| **P2** | Compression / batching; reopen postprocessing only with product OK; Phase 2 stills |

---

## 10. Non-goals

- New npm dependencies or external render tools  
- `@react-three/postprocessing` / BVH / path tracing in Model View  
- Fixing shadows by selecting `PCFSoftShadowMap`  
- Raising Model View default quality before viewport budget passes  
- Conflating Model View overrides with Render Studio hero ladders  
- Schema changes for polish-only work  

---

## 11. Review checklist

- [ ] Product agrees P0 = gated Standard castShadow + shadow param audit (not map-type swap)  
- [ ] Engineering agrees Model View material/lighting edits go through `modelViewPreviewDefaults.ts`  
- [ ] Model View acceptance table used as done definition for P0  
- [ ] No new packages in implementation PRs under this doc  
- [ ] Default quality stays Draft until Standard budget is recorded  

**Approval:** _pending review on `main`_
