# 3D Presentation Quality — Technical Review & Roadmap

**Document role:** Review of the living-room WebGL Model View / Render Studio stack, industry comparison, and phased improvement plan  
**Status:** DRAFT — awaiting product/engineering review (no implementation committed under this doc yet)  
**Date:** 2026-09-11  
**Related:** [Phase 1 — WebGL Presentation Floor](./PHASE_1_WEBGL_PRESENTATION_FLOOR.md) · [Phase 2 — Hybrid Stills Pipeline](./PHASE_2_HYBRID_STILLS_PIPELINE.md) · [Product Decisions](./PRODUCT_DECISIONS.md)

**Hard constraints (carry forward from Phase 1):**

- No Three types or absolute paths in InteriorProject JSON
- Prefer focused modules (≤200 lines hard ceiling in this repo)
- **No `@react-three/postprocessing`** and no BVH unless product explicitly reopens those constraints
- Honest claims: strong interactive WebGL presentation, **not** Synaps / Twinmotion photoreal
- Reuse R3F + Drei + existing presets / lighting / material ladders — do not rewrite the renderer

---

## 1. Verdict

The app already has a **real presentation stack** (Three + R3F + Drei, quality presets, HDRI, `MeshPhysicalMaterial`, contact shadows, ACES tone mapping). It still reads “flat CAD” mainly because of:

1. **Miswired soft shadows** (`PCFShadowMap` forced while styles claim `pcf-soft`)
2. **Preview-mode GLBs that do not cast realtime shadows** (Model View is always `preview`)
3. **Weak / low-resolution material maps** (procedural ≤256px; incomplete normal/rough sets)
4. **OrbitControls-only navigation** (no CameraControls-class truck/dolly/smooth focus)
5. **Product ban on in-viewport post-processing** (MSAA only; export polish is 2D)

Modern web interior tools look sharper by stacking soft shadows + denser IBL + richer PBR maps + smoother cameras — and often by **baking or offline stills** for client marketing frames (aligned with Phase 2).

---

## 2. Current state (what we already implement)

| Area | Status |
|------|--------|
| Stack | `three` ^0.185, `@react-three/fiber`, `@react-three/drei` |
| Color pipeline | ACESFilmic + sRGB + exposure (`RendererColorPipeline`) |
| Quality tiers | `draft` / `standard` / `client-preview` / `presentation` |
| Lighting | Hemisphere + recipe lights + window key lights + HDRI or Lightformer fallback |
| Materials | MeshPhysical (clearcoat / sheen / transmission), curated + procedural maps |
| Shadows | Directional shadow maps + Drei `ContactShadows` (`frames={1}`) |
| Camera | OrbitControls, damping, view presets, fit room / focus selection, walkthrough WASD |
| Export polish | Supersample + unsharp + vignette + depth contact (still engine) |
| Honesty | Preview ≠ photoreal messaging already in Phase 1 docs |

### Scene mount path

```
LivingRoomModelView
  → ModelViewScene (Canvas)
       → CompiledSceneRenderer
            RendererColorPipeline
            RenderLightingRig (Environment + project lights + window keys)
            CompiledNodeView → procedural / AssetBackedObject (GLB)
            ModelViewInteractionRig (ContactShadows, OrbitControls, CameraRig)
LivingRoomRenderStudio
  → LivingRoomRenderCanvas + RenderCaptureBridge (hero stills)
```

### Key files

| Concern | Path |
|---------|------|
| Model Canvas | `src/components/livingRoomScene/ModelViewScene.tsx` |
| Render Canvas | `src/components/LivingRoomRenderCanvas.tsx` |
| Color / tone / shadow type | `src/components/livingRoomScene/RendererColorPipeline.tsx` |
| Contact shadows + OrbitControls | `src/components/livingRoomScene/ModelViewInteractionRig.tsx` |
| Camera pose / fit | `src/components/livingRoomScene/CameraRig.tsx` |
| Lighting rig | `src/rendering/lighting/RenderLightingRig.tsx` |
| HDRI / Lightformers | `src/rendering/lighting/EnvironmentLighting.tsx` |
| Presets | `src/domain/livingRoom/renderPresets/definitions.ts` |
| Lighting quality map | `src/domain/livingRoom/environmentLightingQuality.ts` |
| PBR descriptor | `src/rendering/materials/createPbrMaterial.ts` |
| GLB materials | `src/rendering/materials/applyGlbSlotMaterials.ts` |
| Still polish | `src/rendering/stillEngine/runHeroStillEngine.ts` |

### Preset knobs (interactive / capture)

| Preset | DPR | Shadow map | Contact res | Env res | Shadow radius |
|--------|-----|------------|-------------|---------|---------------|
| draft | 1 | 512 | 256 | 64 | 1 |
| standard | 1.5 | 1024 | 512 | 128 | 4 |
| client-preview | 1.75 | 1536 | 768 | 256 | 5 |
| presentation | 2 | 2048 | 1024 | 256 | 7 |

Model View is restricted to `modelViewSafe` presets (draft / standard) and always uses `renderMode: "preview"`.

---

## 3. Problems → symptoms

| User symptom | Likely cause |
|--------------|--------------|
| Flat materials / soft edges | Procedural maps ≤256px; incomplete normal/rough/metal maps; low anisotropy in draft |
| Weak shadows / depth | `RendererColorPipeline` forces `PCFShadowMap` vs Canvas `shadows="percentage"` and style `"pcf-soft"` |
| Furniture floats | GLB `castShadow` only when `renderMode === "hero"` — Model View never casts from GLBs |
| Dull lighting | Preview light/env scales damp intensity; env res 64–128; ambient draw multiplier ~0.58× |
| Non-pro camera feel | OrbitControls only; focus is one-shot fit; limited clamps |
| Soft / muddy image | MSAA only; draft DPR = 1; no SMAA (postprocessing package forbidden) |

---

## 4. Industry comparison (web interior / floor planners)

Typical modern web planners use a **dual path**:

1. **Realtime authoring view** — PBR + IBL + contact/soft shadows, capped DPR, few shadow-casting lights  
2. **Presentation stills** — bake / path-trace / cloud render for marketing frames  

Common camera UX: orbit + pan-to-cursor + eased focus + eye-height / walk presets (often `CameraControls`).

Materials: tileable 1–2K albedo/normal/rough rather than procedural noise as the hero finish.

Some demos (e.g. Homemaker-class) **disable realtime shadows** for FPS and lean on maps + cove lights. Our bet (shadows + HDRI + contact) is correct for cabinet sales previews — we need to **tune and un-conflict** it, not copy “no shadows.”

---

## 5. Recommended architecture (reuse, don’t rewrite)

Keep the dual-path model:

```
Model View (interactive, honest WebGL)
  → existing presets + lighting/material ladders
  → fix misconfigs, enrich maps, improve camera UX

Render Studio / client stills
  → existing capture + still engine polish
  → Phase 2 hybrid stills for “wow” frames
  → NOT EffectComposer in the live viewport (unless product reopens Phase 1 constraint)
```

Prefer: soft-shadow wiring fix, gated GLB castShadow, texture manifest enrichment, optional Drei `CameraControls` (already a dependency), Adaptive DPR later.

---

## 6. Phased roadmap

### Phase A — Quick wins · Priority P0 · Estimate 1–3 days

| Recommendation | Why | What should change | Files | Libraries | Trade-offs |
|----------------|-----|--------------------|-------|-----------|------------|
| Honor soft shadows | Soft edges/depth currently defeated | Use `PCFSoftShadowMap` (or stop overriding); align style metadata | `RendererColorPipeline.tsx`, style presets | none | Slightly costlier than hard PCF |
| GLB castShadow in Model View | Furniture looks ungrounded | Allow cast in preview for standard+ (keep draft off) | `AssetBackedObject.tsx`, quality flag | none | More casters → GPU up; gate by preset |
| Raise Model View default quality | Draft looks intentionally flat | Default viewport to **standard** or bump draft env/contact | `modelViewPreviewDefaults.ts`, Model View UI | none | Heavier on weak GPUs |
| Tune exposure / env for preview | Scene reads muddy | Slight bump preview envMap + window key; keep ACES | `environmentLightingQuality.ts`, `heroRenderQuality.ts` | none | Overbright risk — A/B vs Phase 1 benchmarks |
| Contact shadow opacity/blur pass | Cheapest grounding realism | Per-style tweak via existing knobs | `stylePresets.ts`, `groundingQuality.ts` | none | Too dark = dirty floor blobs |

### Phase B — Rendering sharpness · Priority P0–P1

| Recommendation | Why | What | Files | Libraries | Caveat |
|----------------|-----|------|-------|-----------|--------|
| DPR policy | Soft on retina | Keep `dpr={[1, preset]}`; Model View ≥1.5 on standard | `ModelViewScene.tsx`, presets | none | Battery/CPU |
| Stay on MSAA | Product bans EffectComposer | Keep `antialias: true`; sharpness from textures + soft shadows | Canvas props | none | No SMAA unless constraint lifted |
| Texture anisotropy | Soft wood/fabric | Preview standard ≥8 anisotropy | `heroRenderQuality.ts` | none | Minor VRAM |
| Capture path unchanged | Client PNGs already supersample + unsharp | Do not move still polish into live viewport | still engine | none | — |

### Phase C — Lighting · Priority P1

| Recommendation | Why | What | Files | Libraries | Caveat |
|----------------|-----|------|-------|-----------|--------|
| Soft map + bias consistency | Professional depth | Soft map + bias/normalBias/radius per preset | `SceneProjectLights`, `WindowKeyLight` | none | Shadow acne if bias wrong |
| Limit shadow-casting lights | Performance | 1–2 casters (window key OR sun); others fill-only | lighting recipes, `SceneProjectLights` | none | Less multi-light drama |
| Stronger IBL, weaker flat ambient | Modern look = reflections | Prefer HDRI; reduce ambient multiplier; raise env | `EnvironmentLighting`, `SceneProjectLights`, `environmentManifest` | existing HDR | HDR fail → Lightformer (already) |
| Shadow frustum fit to room | Crisp shadows in large rooms | Fit ortho shadow cam to room AABB | light helpers | none | Update on room resize |
| Optional HDR intensity / rotation UI | Designer control | Expose intensity; optional rotateY | render settings UI | none | Scope creep if full light editor |

### Phase D — Materials · Priority P1

| Recommendation | Why | What | Files | Libraries | Caveat |
|----------------|-----|------|-------|-----------|--------|
| Complete curated PBR sets | Flat finishes | Albedo+normal+rough for top woods/laminates/paint | `textureManifest`, `materialManifest`, `CuratedPbrMaterial` | none (assets) | Bundle size; KTX2 later |
| Raise procedural fallback res | When no curated map | Selective 256→512 on standard+ | `proceduralMapQuality.ts` | none | CPU on first compile |
| Consistent GLB vs procedural | Mixed look feels cheap | Shared roughness/env ladders | `createPbrMaterial`, `applyGlbSlotMaterials` | none | Kenney preserve-source path |
| Edge perception without heavy bevels | “Sharp finishing” | Normal maps + slight clearcoat | material scales | none | Real bevels cost geometry |

### Phase E — Camera · Priority P1

| Recommendation | Why | What | Files | Libraries | Caveat |
|----------------|-----|------|-------|-----------|--------|
| CameraControls upgrade (optional) | Pro pan/dolly/focus | Wrap/replace OrbitControls with Drei `CameraControls` | `ModelViewInteractionRig`, `CameraRig`, session hook | **drei only** | Fit/focus rewrite; careful walkthrough |
| Smooth focus-on-selection | Fit is abrupt today | Ease look-at over 200–400ms | `CameraRig`, `modelViewFit` | CameraControls helpers | Don’t fight mid-drag |
| Navigation limits | Avoid under-floor / chaos | Keep maxPolar; add minPolar; optional floor-locked pan | controls props | none | Too strict frustrates dollhouse |
| FOV / near-far audit | Interior FOV ~35–45 is good (42 today) | Keep; scale `far` with roomSpan | `ModelViewScene`, fit helpers | none | Large far → z-fighting |
| Preset transitions | Pros live on presets | Smooth front/side/iso/dollhouse moves | `modelViewPresets`, `CameraRig` | none | Ortho↔persp already special |

### Phase F — Post-processing · Priority P2 (constrained)

| Recommendation | Why | What | Notes |
|----------------|-----|------|-------|
| In-viewport SSAO / SMAA / bloom | Looks “pro” | **Blocked** by Phase 1 | Prefer contact + soft maps + materials |
| Export-time grade | Client stills | Keep/enhance unsharp, vignette, contrast, depth contact | Align with Phase 2 |
| If constraint lifted later | Optional N8AO + SMAA at presentation only | Would need EffectComposer package | Gate behind presentation quality only |

### Phase G — Performance · Priority P1–P2

| Recommendation | Why | What | Files | Caveat |
|----------------|-----|------|-------|--------|
| Shadow caster budget | Many objects | Cap casters; draft = contact only | quality ladders | Draft visual regression OK |
| Demand frameloop | Idle GPU | `frameloop="demand"` + invalidate on interaction | Canvas, controls | Easy to miss redraws |
| Adaptive DPR | Large rooms | Drei AdaptiveDpr / PerformanceMonitor | `ModelViewScene` | Flicker if aggressive |
| Texture memory | Many materials | Share materials; dispose; optional KTX2 | loaders, manifests | Tooling work |
| No BVH yet | Phase 1 forbid | Keep simple picking | — | Revisit if pick lag |
| Static architecture batching | Draw calls | Later merge static walls/floors | scene compiler | Larger refactor |

### Phase H — Final production quality · Priority P2

| Track | Goal |
|-------|------|
| Interactive “sales floor” | Soft shadows + casting furniture + richer maps + smoother camera |
| Client package | Render Studio hero presets + still polish; Phase 2 for wow frames |
| Desktop / web | Cap DPR 1.5–2; 1–2 shadow lights; honor Phase 1 Tauri latency budgets |
| Honesty | Keep “presentation WebGL” claims; do not market as Twinmotion |

---

## 7. Priority summary

| Priority | Do first |
|----------|----------|
| **P0** | Soft shadow map fix; GLB castShadow on standard+ Model View; contact + env/exposure retune; Model View default ≥ standard |
| **P1** | Shadow frustum fit; curated PBR completion; CameraControls or smoother Orbit focus; demand frameloop / adaptive DPR |
| **P2** | KTX2; static batching; reopen postprocessing only with product approval; Phase 2 stills for photoreal |

---

## 8. Suggested first implementation slice (after doc approval)

**P0 only — no new libraries:**

1. Soft shadows actually soft  
2. Preview GLBs cast shadows on standard+  
3. Contact + env/exposure retune against existing Phase 1 benchmark rooms  
4. Validate Draft vs Client Preview remain visibly different  

Materials pack + camera UX follow as a second PR after P0 lands.

---

## 9. Explicit non-goals

- Rewriting the renderer or abandoning compile → R3F architecture  
- Adding `@react-three/postprocessing` without an explicit product decision  
- Enabling every light to cast 2K shadows  
- Chasing path-trace quality in the live viewport  
- InteriorProject schema changes for polish-only work  

---

## 10. Review checklist

- [ ] Product agrees P0 scope (soft shadows + GLB cast + retune)  
- [ ] Product confirms postprocessing remains **out** for interactive Model View  
- [ ] Engineering confirms CameraControls is acceptable as a later P1 (Drei-only)  
- [ ] Phase 1 benchmark rooms remain the visual regression kit  
- [ ] Phase 2 stills remain the path for photoreal client marketing frames  

**Approval:** _pending review on `main`_
