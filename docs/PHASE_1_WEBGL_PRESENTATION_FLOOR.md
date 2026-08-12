# Phase 1 — WebGL Presentation Floor

**Branch:** `phase-1/webgl-presentation-floor` (from `main`)  
**Product spine:** Plan → Model → Render (unchanged)  
**Goal:** Raise WebGL presentation quality with a **hard scorecard** — still honest realtime WebGL, not Synaps.

**Related docs:** [StillJob trust contract](./STILLJOB_TRUST_CONTRACT.md) (Phase 2 foreshadow) · [Product decisions](./PRODUCT_DECISIONS.md)

---

## 0. First ICP (locks execution)

Phase 1 is **not** “any interior designer.” First buyer / job-to-be-done:

> **Custom cabinet shop salesperson or designer** who needs to turn a **manufacturable living-room layout** (room + millwork/soft goods) into a **client-facing concept preview** they can revise in-tool, without claiming photoreal marketing stills yet.

Out of scope for this ICP (for now): full home staging marketplace, pure consumer DIY decorate app, fabrication MES, Synaps-class marketing stills.

Workshop bridge stays real but **staged**: living-room preview now; named workshop deliverable is **Living-room Millwork Schedule v1** (see Product decisions) — otherwise “cabinet-aware” is slogan-only.

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

- No Three types or absolute/local file paths in InteriorProject JSON
- **Schema durability:** `schemaVersion`, migrations on load, stable entity/asset IDs, explicit units (`mm`), backward-compatible saves (see Product decisions)
- Prefer modules under ~200–300 lines; soft ceiling ~400
- No `@react-three/postprocessing`, no BVH, no AI unless product explicitly opens Phase 2
- Workshop / production PDFs stay separate from living-room client presentation
- Git identity for this repo only: `Danish-13-Khan` / `dan.my1313@gmail.com`

---

## 3. Brutal Phase 1 scorecard (definition of done)

Subjective “feels better” is **not** enough. Phase 1 exits only when the scorecard below passes.

### 3.1 Benchmark kit (locked fixtures)

Create and freeze **3 canonical rooms** × **2 locked cameras** each (= **6 frames**):

| ID | Room intent | Camera A | Camera B |
|---|---|---|---|
| `bench-daylight-sofa` | Window wall + sofa + coffee table | Eye-level toward sofa/window | Corner wide establishing |
| `bench-millwork-media` | Media wall / millwork + lounge chair | Eye-level to millwork | 3/4 seating cluster |
| `bench-evening-lamp` | Warmer recipe + floor lamp + side table | Eye-level seating | Detail toward lamp/table |

Store project JSON + camera ids under something like `fixtures/phase-1-benchmarks/` (committed).  
Store PNG baselines under `tmp/phase-1-baselines/` (**gitignored**) for before/after PR attachments.

### 3.2 Pass / fail checks (all required)

| # | Check | Pass rule |
|---|---|---|
| 1 | Ladder | For each of 6 frames, Draft vs Client Preview differ on **≥3** of: key-light contrast, contact grounding, material punch, exposure/framing. Reviewed in PR with side-by-side exports. |
| 2 | Grounding | Soft goods / millwork feet meet floor; no obvious hover. Contact shadow visible in Client Preview on all 6 frames. |
| 3 | Window key | On rooms with openings, Client Preview shows a clear key from window direction (Draft may be flatter). |
| 4 | Framing | Locked hero cameras stay eye-level; framing QA helpers do not flag “ceiling-heavy / cut-feet” on the 6 Client Preview exports. |
| 5 | Latency | See **§3.3 benchmark environment**. Client Preview ≤ **8.0s**, Draft ≤ **3.0s** per locked frame under that environment. |
| 6 | Honesty | UI copy / README do **not** claim photoreal, AI, or Synaps parity. Automated scan covers preset honesty strings + README / product docs / Render Studio honesty surfaces (negated “do not claim Synaps” language allowed). |
| 7 | Automation | `npm run phase1:proof` must run and pass: `qa:assets`, `qa:render`, `presets:check`, Phase 1 domain tests, and `qa:smoke`. Writes `automation-report.json`. |
| 8 | Data safety | Saving/loading a benchmark project does not introduce Three types or file paths; `schemaVersion` remains valid via migrations. |

**Latency evidence:** fill `fixtures/phase-1-benchmarks/latency-samples.json` (all 12 slots), then re-run `npm run phase1:proof`. Overall stays **pending** until latency is complete; automation can already be **pass**.

**Phase 1 fails** if we keep polishing past this scorecard, or if we start StillJob/AI work before these 8 pass.

### 3.3 Latency benchmark environment (locked)

Do not measure latency on an undefined “mid laptop.” Use this profile (or document an approved substitute in the PR):

| Knob | Locked value |
|---|---|
| App surface | **Tauri desktop build** (not random browser tab), release/`npm run build` assets |
| Preset / size | Client Preview **1920×1080**; Draft **1280×720** (per preset defs) |
| Scene | Each of the 6 locked benchmark frames; **warm** run (one discarded cold run first) |
| Timing | Start: capture requested → End: PNG bytes ready for package/download |
| Machine class | Apple Silicon laptop, **≥16 GB RAM**, power plugged in; note chip (e.g. M1/M2/M3) + OS in PR |
| GPU | Default integrated GPU; no external eGPU |
| Concurrency | No other heavy apps; single capture at a time |
| Report | PR must include table: frame id, Draft ms, Client Preview ms, machine string |

**Substitute allowed only if** the PR states why (e.g. Windows workstation) and uses the same resolution/warm-run rules. Thresholds stay ≤3s Draft / ≤8s Client Preview unless product revises this doc.

**Non-goals:** matching Synaps, film grain stacks, path tracing, cloud workers.

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

### Chapter 0 — Freeze the benchmark kit (in progress / landing)

1. Domain factories under `src/domain/livingRoom/phase1Benchmarks/` create the 3×2 locked frames
2. Scorecard + latency environment constants live beside them
3. PNG baselines stay in gitignored `tmp/phase-1-baselines/` for PR before/after

### Chapter 1 — Measure the gap (½–1 day)

1. Export the same demo room as **Draft** and **Client Preview**
2. Note failures: floating, flat light, chalk materials, bad crop
3. Capture screenshots into `tmp/phase-1-baselines/` for before/after

### Chapter 2 — Preset honesty first (landing)

Make quality knobs actually diverge (shadows, env resolution, contact, texture detail) end-to-end so later lighting work has somewhere to land. Add honesty badge in Model View + Render Studio: Working Draft vs Client Delivery.

### Chapter 3 — Grounding (landing)

Tune ContactShadows via `groundingQuality` so Client Preview visibly pins furniture without black mud. Draft stays lighter/faster.

### Chapter 4 — Window key light (landing)

Domain `windowKeyLight` samples openings → inward normals → quality-scaled directional keys.  
`WindowKeyLight` + `RenderLightingRig` consume descriptors only (no JSON mutation).

### Chapter 5 — Materials (landing)

Kind-aware `materialContrast` + richer oak/walnut/fabric/paint separation in manifests.  
Client Preview wood reads glossier; fabric sheenier; walls flatter.

### Chapter 6 — Framing (landing)

Eye-level defaults in cameras + hero focals; framing QA adds `ceiling-heavy`, `cut-feet`, `eye-off-standing`.

### Chapter 7 — Proof pack (landing)

- Domain `evaluatePhase1Scorecard()` gates all 8 checks (latency/automation evidence-driven)
- `npm run phase1:proof` runs **qa:assets + qa:render + presets:check + phase1-domain + qa:smoke**, writes `automation-report.json`, regenerates `PROOF.md`
- Latency: fill `fixtures/phase-1-benchmarks/latency-samples.json` then re-run proof
- Side-by-side PNGs remain manual under `tmp/phase-1-baselines/`
- Honesty scans preset copy + README / product docs / Render Studio surfaces

### Chapter 8 — StillJob spike (handoff only)

**Goal:** Prove StillJob JSON handoff + pose round-trip without AI.

**Done when:**
- [x] `StillJob` types + §3.1 tolerances in `src/domain/livingRoom/stillJob/`
- [x] Export for one benchmark camera (`npm run stilljob:spike` → `fixtures/still-job-spike/`)
- [x] Round-trip camera pose gates (eye ≤25 mm, target ≤40 mm, FOV ≤0.5°)
- [~] Hero PNG path attached; real Client Preview plate still manual
- [x] Gaps documented — **no AI API**

**Out of scope:** offline renderer, AI enhancer, Accept/Reject UI.

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

Use the **§3 brutal scorecard** as the real gate. Quick mirror:

- [ ] ICP text unchanged unless product explicitly revises `PRODUCT_DECISIONS.md`
- [ ] 3 benchmark rooms × 2 cameras frozen and exported Draft + Client Preview
- [ ] Scorecard checks 1–8 all pass (ladder, grounding, key light, framing, latency, honesty, automation, data safety)
- [ ] No Three / file paths written into saved project JSON; schemaVersion/migrations intact
- [ ] StillJob/AI work not started beyond optional week-4 handoff spike
- [ ] Before/after exports attached to PR description
- [ ] Out-of-scope items in §9 were not started

---

## 9. Explicitly out of scope (Phase 2+)

- Presentation StillJob **engine** / workers (handoff JSON spike is allowed)
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
| `npm run phase1:proof` | Full Phase 1 gate (assets, render QA, presets, domain, smoke) + proof pack |
| `npm run stilljob:spike` | StillJob handoff JSON + gaps (no AI) |
| `docs/STILLJOB_TRUST_CONTRACT.md` | Still fidelity law |

---

## 11. One-line Phase 1 pitch

**Raise the WebGL presentation floor until Draft and Client Preview are obviously different — then stop, before pretending the canvas is Synaps.**
