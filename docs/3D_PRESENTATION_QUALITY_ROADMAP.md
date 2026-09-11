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

**Revision notes (source review):**

1. First draft incorrectly treated `PCFSoftShadowMap` as a P0 fix. On Three **r185**, soft-PCF is already the `PCFShadowMap` path. Shadow work is bias / radius / frustum + caster coverage.
2. Material work must target Model View overrides (`modelViewPreviewDefaults.ts`), not only `heroRenderQuality.ts`.
3. P0 validation must include Model View viewport checks, not export-only stills.
4. **Shared lights isolation** — `SceneProjectLights` / `WindowKeyLight` serve Model View and Render Studio; bias/frustum changes need an explicit Model View scope **or** Studio still regression (section 6.1).
5. **Perf gate** — replace subjective “no stutter” with a recorded hardware + scene + frame-time protocol (section 8.4).
6. **Hero castShadow regression** — today `castShadow = renderMode === "hero"`. Studio **Draft** resolves to `preview` (no GLB cast). Hero tiers are **standard / presentation / client-preview** (plus any forced `hero` lock). P0 must preserve and test **all** of those hero paths when adding Model View Standard casting (section 8.2).

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
| **Gated GLB castShadow in Model View Standard** | Primary float bug | Cast when Model View quality is `standard` (keep Model View draft contact-only or lighter). Condition must be additive: keep `renderMode === "hero"` true for **all** Studio hero tiers | `AssetBackedObject.tsx`, optional quality helper | More GPU on Model View Standard; budget FPS |
| **Shadow bias / radius / frustum audit** | Softness & acne, not map type | Prefer **Model View–scoped** params (section 6.1). Do not silently retune shared Studio defaults | See 6.1 | Wrong bias → acne / peter-panning; shared edits need Studio stills |
| **Stale style metadata cleanup** | Avoid future false “pcf-soft” fixes | Align style docs/fields with r185 (`PCFShadowMap`) | `stylePresets.ts` (metadata only) | None |
| **Model View lighting retune after casters** | Avoid guessing intensity before grounding exists | Adjust scales only in `resolveModelViewLightingQuality` after Standard cast is on; remeasure perf (8.4) after this step | `modelViewPreviewDefaults.ts` | Overbright if done before casters |
| **Do not raise Model View default to Standard yet** | Perf unknown | Keep Draft default until **recorded** frame-time budget passes (8.4) | Model View UI / defaults | Raising default too early hurts low-end machines |

**Out of P0:** swapping shadow map enums for “softness”; anisotropy bumps aimed at Model View via `heroRenderQuality.ts`.

### 6.1 Shared lighting isolation (required for P0 shadow-param work)

`SceneProjectLights` and `WindowKeyLight` are used by **both** Model View and Render Studio. Neither currently receives a Model View flag. P0 must pick **one** policy and document it in the PR:

| Policy | How | When to use | Regression |
|--------|-----|-------------|------------|
| **A — Preferred: Model View–scoped params** | Pass viewport context (e.g. `viewport: "model-view" \| "studio"`) or Model View shadow overrides from `resolveModelViewLightingQuality` into the light components / a thin wrapper. Studio keeps today’s hardcoded bias / ±7 frustum / pad behavior unless separately approved | Default for P0 bias / frustum / radius experiments | Model View Standard checks (8.1) only |
| **B — Shared constant change** | Edit the shared bias / normalBias / frustum / pad values used by both paths | Only if Policy A is impractical for a specific knob | **Mandatory** Studio still regression for **every hero quality** (8.2) before merge |

**Rules:**

- Contact opacity / blur / hemisphere / light **intensity scales** that already live in `resolveModelViewLightingQuality` stay Model View–only — no Studio isolation issue.
- Do not change Studio-only look by “tuning Model View” through shared defaults without Policy B stills.
- Unit tests should assert Model View vs Studio receive different shadow-camera inputs when Policy A is used.

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
| Room-fit shadow camera | Large rooms | Model View–scoped frustum from room bounds (**Policy A**); Studio unchanged unless Policy B | helper + light props | Update on room edit |
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

1. **Record perf baseline** (section 8.4) on Model View Standard **before** code changes.  
2. Enable **GLB `castShadow` for Model View Standard** with an **additive** condition that preserves `renderMode === "hero"` for all Studio hero tiers.  
3. Run **Model View acceptance** (8.1) + **Studio castShadow regression** (8.2).  
4. Remeasure perf (8.4) after caster enable.  
5. **Audit and tune** shadow bias / radius / frustum under **Policy A** (6.1); if any shared default must change, run Policy B Studio stills.  
6. Retune **Model View–only** contact / window / project scales if still flat or too dark.  
7. Remeasure perf (8.4) **again after final lighting adjustments**.  
8. Clean stale `pcf-soft` style metadata when convenient.  
9. **Do not** change default viewport quality to Standard until the recorded frame-time gate passes.

---

## 8. Acceptance criteria

### 8.0 Current castShadow behavior (code truth)

| Context | `resolveStudioRenderMode` / Model View mode | GLB `castShadow` today |
|---------|---------------------------------------------|-------------------------|
| Model View Draft | always `preview` | **false** |
| Model View Standard | always `preview` | **false** (P0 flips to **true**) |
| Studio Draft | `preview` | **false** — preserve |
| Studio Standard | `hero` | **true** — preserve |
| Studio Presentation | `hero` | **true** — preserve |
| Studio Client Preview | `hero` | **true** — preserve |
| Studio `heroStillLock` / forced hero | `hero` | **true** — preserve |

P0 must not implement “cast only on Model View Standard” in a way that drops any `renderMode === "hero"` path. Prefer:

`castShadow = renderMode === "hero" || (modelViewPreview && quality === "standard")`

(or equivalent), with unit tests for each row above.

### 8.1 Model View (required for P0 — primary)

| Check | Pass condition |
|-------|----------------|
| Furniture grounding (Standard) | Selected Kenney/GLB pieces cast onto floor; contact + map shadows read as one grounded object |
| Draft vs Standard | Draft remains lighter/faster and **without** GLB map-cast (unless product later asks); Standard visibly better grounded |
| GLB load | Lamp / plant / sofa load without fallback flicker for known assets |
| Move object | Drag XYZ; mesh, outline, and gizmo stay aligned; shadow follows |
| Orbit / pan / zoom | Usable under the recorded frame-time gate (8.4) |
| Performance budget | Pass section **8.4** (not subjective “feels fine”) |
| Walkthrough smoke | Enter/exit walkthrough still works after caster change |

### 8.2 Render Studio castShadow + still regression (required for P0)

| Check | Pass condition |
|-------|----------------|
| Studio Draft | Remains `preview`; GLBs **do not** gain castShadow from the Model View Standard condition |
| Studio Standard | GLBs still cast (`hero`) |
| Studio Presentation | GLBs still cast (`hero`) |
| Studio Client Preview | GLBs still cast (`hero`) |
| Forced hero lock | If UI can lock hero, GLBs still cast |
| Draft vs Client Preview stills | Still visibly different (Phase 1 intent) when capturing those qualities |
| Policy B stills | If shared light bias/frustum/pad constants change: capture before/after stills for **standard, presentation, and client-preview** (and Draft preview smoke) on a fixed bench camera; attach under `tmp/` (gitignored) or PR notes |

Automated preference: extend unit/integration coverage around `AssetBackedObject` / render-mode resolution so hero tiers cannot regress silently. Visual stills required when Policy B applies.

### 8.3 Explicit non-validation

- Do not treat “switched shadow map enum” as a success metric  
- Do not use anisotropy ≥8 in `heroRenderQuality` as Model View proof (Standard already at 10 via overrides)  
- Do not treat “no stutter” without an 8.4 record as a perf pass  

### 8.4 Reproducible Model View performance gate

Subjective “no sustained stutter on a target laptop” is **not** a pass. Before judging P0 (and again after final lighting tweaks), record:

| Field | What to write down |
|-------|--------------------|
| **Hardware** | Machine model; CPU; GPU; RAM; OS version |
| **Runtime** | Browser name+version **or** Tauri/WebView build id |
| **Viewport** | CSS canvas size (e.g. 1280×720 or full authoring chrome size) and **effective DPR** (Model View Standard → preset max 1.5) |
| **Scene** | Fixed project: prefer a Phase 1 bench (e.g. `bench-daylight-sofa`) **or** a named golden fixture; note object count, lighting recipe id, style id |
| **Quality** | Model View **Standard** (the tier under test) |
| **Motion** | Same orbit path each run (e.g. 10 s continuous orbit, or N scripted pose samples) |
| **Metric** | Average and/or p95 **frame time (ms)** from `requestAnimationFrame` delta or `renderer.info` / R3F clock over the motion window — pick one method and keep it for before/after |
| **Baseline** | Measured **before** P0 caster change |
| **After casters** | Remeasure after Model View Standard castShadow |
| **After lighting** | Remeasure after final bias/frustum/contact/intensity adjustments |
| **Gate** | Fail P0 (and block raising default quality) if post-change p95 frame time exceeds **baseline × 1.25** **or** an absolute ceiling set from the baseline run (document the chosen number in the PR). Example placeholder until first baseline exists: e.g. p95 ≤ 22 ms (~45 FPS) on the recorded machine — **replace with the real ceiling after the baseline measurement** |

Store the sheet in the PR description or `tmp/` (gitignored). Do not invent a universal FPS number without that first baseline.

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
- [ ] Shadow bias/frustum work uses **Policy A** (Model View–scoped) by default; Policy B requires Studio stills for all hero qualities  
- [ ] Perf gate uses section **8.4** (hardware, viewport, fixed scene, frame-time threshold) with remeasure after lighting  
- [ ] Studio regression covers **all hero tiers** (standard / presentation / client-preview + forced hero) and preserves Studio Draft as non-casting preview  
- [ ] No new packages in implementation PRs under this doc  
- [ ] Default quality stays Draft until the recorded Standard frame-time gate passes  

**Approval:** _pending review on `main`_
