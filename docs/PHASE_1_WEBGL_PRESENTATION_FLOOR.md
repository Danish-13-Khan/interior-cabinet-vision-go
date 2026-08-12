# Phase 1 — WebGL Presentation Floor

**Branch:** `phase-1/webgl-presentation-floor` (from `main`)  
**Product spine:** Plan → Model → Render (unchanged)  
**Goal:** Make Draft vs Client Preview feel like two different products — still honest realtime WebGL, not Synaps.

---

## 1. The story (why this phase exists)

Phase 0 shipped a real interior authoring loop:

1. Draw / edit a living room in **Plan (2D)**
2. See and move things in **Model (3D)**
3. Frame cameras and export in **Render Studio**
4. Package a **client PDF + PNG** from the same interactive scene

That spine is correct. What hurts trust today is the **output ceiling**: Client Preview still reads as a flat WebGL snapshot. Furniture can feel ungrounded, window light is weak, materials lack contrast, and Draft vs Presentation are not dramatically different enough for a client to feel “this is the nice one.”

Phase 1 does **not** invent a new product. It raises the **presentation floor** of the existing WebGL path so that:

- Designers can author confidently in Draft
- Clients can review a clearly better Client Preview / Presentation frame
- Marketing claims stay honest: “strong interactive presentation,” **not** “Synaps photoreal”

Phase 2 (later) splits a second stills pipeline. Phase 1 deliberately stops before that fork.

---

## 2. What Phase 1 is / is not

| Phase 1 **is** | Phase 1 **is not** |
|---|---|
| Lighting, grounding, material contrast, framing polish | AI stills / generative images |
| Making presets *visibly* different | Path tracer / Blender offline render |
| Working inside current R3F + registries + presets | Rewriting InteriorProject schema |
| Keeping cabinets procedural | Replacing millwork with pretty GLBs |
| Raising WebGL client still quality | Claiming Synaps parity |

**Hard constraints (carry forward):**

- No Three types or file paths in InteriorProject JSON
- Prefer modules under ~200–300 lines; soft ceiling ~400
- No `@react-three/postprocessing`, no BVH, no AI unless product explicitly opens Phase 2
- Workshop / production PDFs stay separate from living-room client presentation
- Git identity for this repo only: `Danish-13-Khan` / `dan.my1313@gmail.com`

---

## 3. Success story (exit criteria)

Phase 1 is done when a side-by-side check of the **same room / same camera** shows:

1. **Draft** — fast, readable, slightly flat; good for layout
2. **Client Preview** — clearly richer: grounded furniture, believable window key light, stronger wood/fabric/floor contrast, better eye-level framing
3. Export PNG from Client Preview is still WebGL, but no longer “empty grey room with floating sofa”
4. Diagnostics + existing QA scripts still pass (`qa:assets`, `qa:render`, `presets:check`, smoke)
5. Unit tests cover new pure lighting / material / framing helpers

**Non-goals for exit:** matching Synaps, film grain stacks, path tracing, cloud workers.

---

## 4. Architecture (where Phase 1 lives)

Phase 1 is a **vertical slice through the existing pipeline**, not a new top-level product:

```
InteriorProject (truth — mostly untouched)
        │
        ▼
sceneCompiler + RenderBindings (small extensions only if needed)
        │
        ▼
renderPresets + environmentLightingQuality + heroRenderQuality
        │
        ▼
rendering/lighting + materials + CompiledSceneRenderer
        │
        ▼
RenderCaptureBridge + client package (consume better frames)
```

**Rule:** prefer pure domain knobs → thin rendering consumers. Do not grow `App.tsx` or `LivingRoomPlanWorkspace.tsx` with lighting math.

---

## 5. Full Phase 1 module map

### Workstream A — Window key light & recipe daylight

**Problem:** HDRI + project lights exist, but rooms often lack a clear “sun from the window” story. Soft goods look studio-lit and flat.

**Modules to own / extend:**

| Module | Path | Phase 1 job |
|---|---|---|
| Lighting recipes | `src/domain/livingRoom/lighting.ts` | Add / tune recipe fields for key-light direction, intensity, warmth tied to openings |
| Environment style | `src/domain/livingRoom/stylePresets.ts` | Ensure style environments expose contact + ambient values that support daylight contrast |
| Lighting quality | `src/domain/livingRoom/environmentLightingQuality.ts` | Map Draft vs hero/client into key-light scales (not only HDRI resolution) |
| Scene openings | `src/domain/livingRoom/sceneCompilerOpenings.ts` | Provide stable opening normals / centers the rig can aim a key light at |
| Project lights UI consumer | `src/rendering/lighting/SceneProjectLights.tsx` | Honor shadow map size / radius; keep editable lights |
| Rig | `src/rendering/lighting/RenderLightingRig.tsx` | Compose HDRI + project lights + **new window key light** without mutating JSON |
| HDRI | `src/rendering/lighting/EnvironmentLighting.tsx` | Keep recipe-bound HDRI; intensity scales from quality |

**New focused module (recommended):**

- `src/domain/livingRoom/windowKeyLight.ts` (+ `*.test.ts`)  
  Pure function: openings + recipe + renderQuality → key light pose/intensity/color.  
  No React. No Three types in the return contract (use mm vectors / plain numbers).

- `src/rendering/lighting/WindowKeyLight.tsx`  
  Thin drei/three consumer of that contract.

**Story beat:** When a window exists, Client Preview gets a directional key from that opening; Draft gets a cheaper / softer version or skips expensive shadows.

---

### Workstream B — Grounding (contact shadows / “not floating”)

**Problem:** Sofas and tables read as hovering. ContactShadows exist but opacity/blur/resolution are easy to under-drive or over-blur into mush.

**Modules:**

| Module | Path | Phase 1 job |
|---|---|---|
| Contact tuning | `src/domain/livingRoom/heroRenderQuality.ts` | Separate Draft vs Client Preview grounding curves |
| Quality bridge | `src/domain/livingRoom/environmentLightingQuality.ts` | Feed resolution / opacity / blur from presets honestly |
| Presets | `src/domain/livingRoom/renderPresets/definitions.ts` | Confirm contactShadowResolution ladder Draft → Client |
| Scene renderer | `src/components/livingRoomScene/CompiledSceneRenderer.tsx` | Wire ContactShadows with quality; avoid hard-coded magic |

**Optional new module:**

- `src/domain/livingRoom/groundingQuality.ts`  
  Single place for “floor contact feel” so heroRenderQuality stays focused on framing/exposure.

**Story beat:** Client Preview furniture casts a soft footprint on the floor; Draft keeps a lighter footprint for speed.

---

### Workstream C — Material contrast (wood / fabric / floor)

**Problem:** PBR path exists, but hero still looks chalky: low contrast albedo, weak roughness split, soft-goods GLB slots not punchy enough at presentation quality.

**Modules:**

| Module | Path | Phase 1 job |
|---|---|---|
| Material assets | `src/rendering/assets/materialManifest.ts` | Tune baseColor / roughness / maps for oak, walnut, fabric, paint |
| Texture resolve | `src/rendering/materials/resolveMaterialTextureUrls.ts` | Ensure hero prefers real maps when available |
| PBR factory | `src/rendering/materials/createPbrMaterial.ts` | Quality-aware roughness/metalness clamps; no Three in domain |
| Procedural maps | `src/rendering/materials/proceduralSurfaceMaps.ts` | Better fallback grain when textures missing |
| GLB slot materials | `src/rendering/materials/applyGlbSlotMaterials.ts` | Stronger upholstery vs legs contrast |
| Material view | `src/components/livingRoomScene/CompiledMaterialView.tsx` | Pass renderQuality through consistently |
| Domain bindings | `src/domain/livingRoom/renderAssetBindings.ts` | Only if new materialAssetIds needed |

**Story beat:** Wood reads as wood, fabric as fabric, floor slightly richer than walls — especially under Client Preview lighting.

---

### Workstream D — Hero framing & camera defaults

**Problem:** Exports often look like random orbit shots: too high, too wide, cut feet, empty ceiling weight.

**Modules:**

| Module | Path | Phase 1 job |
|---|---|---|
| Camera pose | `src/domain/livingRoom/renderCameraPose.ts` | Eye-level defaults, safe target height for living rooms |
| Hero quality | `src/domain/livingRoom/heroRenderQuality.ts` | Composition helpers for hero vs preview |
| Framing QA | `src/domain/livingRoom/renderQa/cameraFramingValidation.ts` | Tighten checks used by diagnostics / smoke |
| Cameras domain | `src/domain/livingRoom/cameras.ts` | Sensible default cameras for demos / new projects |
| Capture | `src/components/livingRoomScene/RenderCaptureBridge.tsx` | Keep polish mild; don’t fake path-traced look |
| Export polish | `src/rendering/export/heroExportPolish.ts` | Slight contrast/vignette only — no heavy “Instagram filter” |

**Story beat:** Hitting “Client Preview” frames a believable standing-eye living-room shot without manual babysitting every time.

---

### Workstream E — Preset honesty (Draft ≠ Client Preview)

**Problem:** Quality ids exist, but users can’t *feel* the ladder.

**Modules:**

| Module | Path | Phase 1 job |
|---|---|---|
| Preset defs | `src/domain/livingRoom/renderPresets/definitions.ts` | Lock ladder: draft / standard / presentation / client-preview |
| Resolve | `src/domain/livingRoom/renderPresets/resolve.ts` | Single resolver; no silent upgrades |
| Studio | `src/domain/livingRoom/renderStudio.ts` | Model View stays Draft-safe |
| Model view | `src/components/LivingRoomModelView.tsx` | Default Draft; never surprise-load Client Preview |
| Render studio | `src/components/LivingRoomRenderStudio.tsx` | Clear preset picker + copy that Draft ≠ client export |
| Diagnostics | `src/components/livingRoomScene/RenderDiagnosticsPanel.tsx` | Show active preset + key lighting flags |

**Story beat:** A designer can explain to a client: “left is working Draft; right is what we send you.”

---

### Workstream F — QA, fixtures, docs

| Piece | Path | Phase 1 job |
|---|---|---|
| Unit tests | colocated `*.test.ts` under domain modules above | Cover pure key-light, grounding, framing |
| Asset QA | `npm run qa:assets` | Still green after texture/material retunes |
| Preset QA | `npm run presets:check` / `presets:list` | Ladder documented |
| Render QA | `npm run qa:render` | Unit gate |
| Smoke | `npm run qa:smoke` | Nonblank + basic framing |
| Presentation sample | `npm run presentation:sample` | Visual regression by eye for client package |
| This doc | `docs/PHASE_1_WEBGL_PRESENTATION_FLOOR.md` | Source of truth for scope |

---

## 6. Suggested implementation order (full narrative)

### Chapter 1 — Measure the gap (½–1 day)

1. Export the same demo room as **Draft** and **Client Preview**
2. Note failures: floating, flat light, chalk materials, bad crop
3. Capture screenshots into a local `tmp/phase-1-baselines/` (gitignored) for before/after

### Chapter 2 — Preset honesty first (1–2 days)

Make quality knobs actually diverge (shadows, env resolution, contact, texture detail) end-to-end so later lighting work has somewhere to land. Add a small UI label in Render Studio: active preset + “preview vs client.”

### Chapter 3 — Grounding (2–3 days)

Tune ContactShadows + groundingQuality. Furniture should kiss the floor in Client Preview without black mud puddles.

### Chapter 4 — Window key light (3–5 days)

Introduce `windowKeyLight` domain + `WindowKeyLight` renderer. Drive from openings. Scale by preset. Keep JSON free of Three types.

### Chapter 5 — Materials (3–5 days)

Retune manifests + PBR path for contrast under the new light. Soft-goods slot materials should separate cushion vs frame.

### Chapter 6 — Framing (2–3 days)

Default eye-level hero pose + framing QA. Soften capture polish only if it still looks natural.

### Chapter 7 — Proof pack (1–2 days)

Re-export baselines, run `qa:*` + smoke, update this doc’s checklist, open PR from `phase-1/webgl-presentation-floor` → `main`.

**Rough calendar:** ~2–6 weeks depending on depth of material/HDRI retunes — matches the roadmap’s Phase 1 band.

---

## 7. File touch budget (expected)

**Likely modify**

- `src/domain/livingRoom/environmentLightingQuality.ts`
- `src/domain/livingRoom/heroRenderQuality.ts`
- `src/domain/livingRoom/lighting.ts` / `stylePresets.ts`
- `src/domain/livingRoom/renderPresets/*`
- `src/domain/livingRoom/renderCameraPose.ts`
- `src/domain/livingRoom/renderQa/cameraFramingValidation.ts`
- `src/rendering/lighting/RenderLightingRig.tsx`
- `src/rendering/lighting/EnvironmentLighting.tsx`
- `src/rendering/lighting/SceneProjectLights.tsx`
- `src/rendering/materials/*`
- `src/rendering/assets/materialManifest.ts`
- `src/components/livingRoomScene/CompiledSceneRenderer.tsx`
- `src/components/LivingRoomRenderStudio.tsx`
- `src/components/LivingRoomModelView.tsx`
- `src/components/livingRoomScene/RenderCaptureBridge.tsx`

**Likely add**

- `src/domain/livingRoom/windowKeyLight.ts` + test
- `src/domain/livingRoom/groundingQuality.ts` + test (optional split)
- `src/rendering/lighting/WindowKeyLight.tsx`

**Avoid growing**

- `src/App.tsx`
- `LivingRoomPlanWorkspace.tsx` (orchestration only)
- InteriorProject type dump for render-only knobs

---

## 8. Acceptance checklist

- [ ] Draft Model View remains fast and clearly “working” quality
- [ ] Client Preview / Presentation show stronger key light when windows exist
- [ ] Contact shadows visibly ground soft goods and millwork
- [ ] Wood / fabric / floor contrast improved under hero lighting
- [ ] Default hero framing is eye-level and QA-validated
- [ ] Preset labels in UI match actual render behavior
- [ ] No Three / file paths written into saved project JSON
- [ ] `npm test` (or project unit suite) green for new domain tests
- [ ] `npm run qa:assets && npm run qa:render && npm run presets:check` green
- [ ] `npm run qa:smoke` green
- [ ] Before/after exports attached to PR description
- [ ] This document’s out-of-scope items were not “accidentally” started

---

## 9. Explicitly out of scope (Phase 2+)

- Presentation StillJob contracts / workers
- AI image generation or cloud render services
- `@react-three/postprocessing` stacks, SSR, BVH
- Offline Blender / path tracer
- Replacing procedural cabinets with hero GLBs
- Rebranding the product as a Synaps competitor on stills

When Phase 1 exits, the honest product line remains:

> **MVP:** Plan → Model → better WebGL Client Preview  
> **Next:** Phase 2 hybrid stills if Synaps-class images are required

---

## 10. Related docs & scripts

| Resource | Role |
|---|---|
| Root `README.md` | Product overview |
| `docs/ASSET_CONVENTIONS.md` | Asset packing rules |
| `docs/RELEASE_CANDIDATE.md` | RC process |
| `npm run assets:curated` | Rebuild curated pack |
| `npm run qa:assets` / `qa:render` / `qa:smoke` | Quality gates |
| `npm run presets:list` / `presets:check` | Preset ladder |
| `npm run presentation:sample` / `presentation:check` | Client package sample |

---

## 11. One-line Phase 1 pitch

**Raise the WebGL presentation floor until Draft and Client Preview are obviously different — then stop, before pretending the canvas is Synaps.**
