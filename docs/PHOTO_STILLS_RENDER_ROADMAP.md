# Photo stills render roadmap

**Status:** Phase 1 lighting is in the tree (Poly Haven 1k HDRIs, AgX, neutral backgrounds, fog off inside the room, lighter walnut, bands re-recorded). Phases 2–4 are not started.
**Goal:** Client-showcase renders that look like photographs, where lights read as real fixtures, **and** show exactly the finishes, models and layout the customer picked.
**Scope:** Shared lighting and material assets, the stills job, and a controlled offline still engine. The live WebGL viewport gets only cheap, constraint-safe fixes.
**Relationship to other docs:** Fills the open **Phase 2C "controlled offline renderer"** slot in
[`PHASE_2_HYBRID_STILLS_PIPELINE.md`](PHASE_2_HYBRID_STILLS_PIPELINE.md) and keeps the
[`STILLJOB_TRUST_CONTRACT.md`](STILLJOB_TRUST_CONTRACT.md). Respects the hard constraints in
[`3D_PRESENTATION_QUALITY_ROADMAP.md`](3D_PRESENTATION_QUALITY_ROADMAP.md) (no new viewport packages; SSAO / SMAA / bloom stay out of the viewport) and
[`PRODUCT_DECISIONS.md`](PRODUCT_DECISIONS.md) ("do not chase Synaps quality by endless `gl.render` polish").
Fixture geometry and the light model are owned by [`WALL_DECOR_LIGHTING_ROADMAP.md`](WALL_DECOR_LIGHTING_ROADMAP.md) (complete 2026-10-01); this doc only consumes them.

---

## 1. Verdict on the original brief

The brief's **diagnosis is correct** (verified in code 2026-10-06):

| Claim | Code truth |
| --- | --- |
| HDRIs are 128×64 placeholders | `public/environments/*.hdr` are 32 816 B each |
| HDRI resolution is clamped | Preview path clamps to 64 / 128 (`environmentLightingQuality.ts:57`); hero `client-preview` / `presentation` already request 256. **Model View is hard-wired to `"preview"`** (`modelViewPreviewDefaults.ts`) and then overrides again: shadow map 640 (Draft) / 1024 (Standard), `hemisphereScale` 0.78 / 0.68 |
| Hemisphere fill on top of the HDRI | `CompiledSceneRenderer.tsx:152` |
| ACES everywhere | `RendererColorPipeline.tsx:13` hardcodes it and **ignores** `stylePresets.toneMapping`; `stylePresets.test.ts:28` pins `"aces-filmic"` |
| Background / fog tinted | Per style: warm-contemporary `#7f93a8`, nordic `#c3ced8`, moody-walnut (the 2 BHK) `#54575a` |
| Walnut too dark | Only moody-walnut: `#3d2d26` / 0.56. Others are `#503a2e` / 0.6 and `#60463a` / 0.65. Roughness is already per finish per style |
| Wood grain is two sine waves | `proceduralMapGenerators.ts:117` |
| No post-processing; only `ContactShadows` | `ModelViewInteractionRig.tsx:92` |
| Real textures ~120 KB total | `public/textures` |
| Stills capture at DPR 1 | Only `render-apartment-stills.mjs:120`. Card media already captures at DPR 2 (`captureStillsPass.mjs:23`). Neither script selects a quality preset; both inherit the seeded project |

Its **spending plan is wrong for this project**:

1. Steps 1–3 as written are another WebGL polish loop. Phase 1 exit (2026-08-14) closed that loop, and the quality roadmap forbids `@react-three/postprocessing`. Step 2 (N8AO + SMAA + bloom) is out unless product reopens Phase 1.
2. Step 4 (in-browser path tracer) is the wrong offline renderer. Factory Tauri boxes are Linux webviews without WebGPU, the WebGL build is deprecated upstream, and it needs a multi-MB denoiser in the client.
3. A real-time viewport has a hard ceiling: "very good game", never "photo". Coohom, Homestyler and Planner 5D all edit in three.js and render client deliverables offline. We should do the same.

**Decision:** assets first (they feed both engines), then a **Blender Cycles still engine** behind the existing StillJob / review / provenance pipeline. Viewport work is limited to what is cheap and already allowed.

---

## 2. Revised phases

### Phase 0 — Fix the measuring instrument (hours)

- `render-apartment-stills.mjs` moves to `deviceScaleFactor: 2`. Both it and the card-media capture **select the `client-preview` preset explicitly** instead of inheriting the seed project.
- Pixel-readout gate on **apartment stills only**. Catalog room posters stay on the exposure gate. A sample counts only when the **nearest visible** hit is that surface: invisible pick volumes and export-excluded helpers are skipped, and a TV or console in front of a wall is not a wall sample. The probe casts a 12×9 grid at ±0.85 NDC so side walls in the 4:3 card crop reach the three-hit minimum, and it restores raycasting on instanced GLB batches for the duration of one read so overview furniture blocks the floor behind it.
- **Targets are set in this phase, not inherited**: the ≈231/255 daylight wall in `WALL_DECOR_LIGHTING_ROADMAP.md` §2 is the *overexposure warning* (any wash saturates to 255), not a pass value. Bands live in `fixtures/photo-stills/surface-bands.json` at ±12 luma.
- **Re-record is how a new look is accepted.** ±12 luma rejects every intentional lighting change. Phase 1 and every later lighting phase re-records the bands on purpose after the still is reviewed. The tolerance is a regression check between those re-records.
- The 2 BHK overview is a near-black shell in this capture (wall ~28, floor ~42). Those figures are the measured broken look, not the photograph we want. Phase 1 sets an overview target and re-records them.

**Done when:** apartment stills are re-rendered at the new settings, the diff is reviewed, and the pixel bands are written into the proof.

### Phase 1 — Lighting and colour assets, shared by both engines (~1.5 days)

- **HDRIs:** three CC0 Poly Haven maps at 1k (interior daylight, warm evening, neutral studio). The 1k files are about 1.6 MB each, lazy-loaded for the active recipe only. `environmentManifest.ts` entries unchanged; files replaced.
- **Model View actually sees them:** `resolveModelViewLightingQuality` (`modelViewPreviewDefaults.ts`) is the resolver to edit. **Standard only:** `resolution` 256 and `hemisphereScale` 0 when `preferHdri` is true. Draft keeps its clamp and its hemisphere. The generic resolver's preview branch is left alone.
- **Tone mapping:** `AgXToneMapping` (built into three r185). `RendererColorPipeline` **reads** `style.colorManagement.toneMapping` (today it ignores it); the union widens to `"aces-filmic" | "agx"`; exposure re-tuned per style by pixel readout; `stylePresets.test.ts:28` updated. Three's AgX and Blender's AgX view are the same family, not a pixel match: the Phase 3 review gate, not the curve, guarantees parity.
- **Background / fog:** neutral background per style; fog disabled when the camera is inside the room. Confirmed on the Phase 0 stills: the 1 BHK and 3 BHK show the style backdrop as a blue slab through the window cutaway.
- **Colour fixes:** moody-walnut walnut `#3d2d26` → ~`#5a4034` (other styles unchanged). Light colour temperature already exists (`colorTemperatureK` → `kelvinToHex` → `light.color` in `lightFixtureProperties.ts:46`), so nothing is invented here; Phase 3 sends what the app stores.

**Done when:** Model View Standard pixel readout for wall, floor and walnut door sits inside bands **re-recorded** after this phase, including a new 2 BHK overview target; no new npm packages.

### Phase 2 — Real material sets, shared by both engines (~2 days)

- Six to eight CC0 sets (oak, walnut, white laminate, grey laminate, fabric, stone, matte paint): colour + roughness + normal at 1k, with known physical tile size so `uvScaleMm` stays honest.
- Web delivery as KTX2 via three's bundled `KTX2Loader` (Basis transcoder wasm in `public/`, no npm package). **Source PNGs are kept on the render side**, keyed by material id, so Cycles never consumes the viewport's compressed or procedural maps.
- Wired to existing finish IDs in `CuratedPbrMaterial.tsx`; procedural generators stay as fallback for thumbnails and un-mapped finishes.
- Finish identity law is the **StillJob material-id rule** (trust contract §3.1: exact slot → material id), not apartment-template D9, which is about generic roles versus brand SKUs.

**Done when:** door, table and sofa in the 2 BHK still show grain / weave with no sine-wave stripes; landing-page weight unchanged (it only ships WebP stills).

### Phase 3 — Photo still engine: Blender Cycles (~1.5 weeks)

This is Phase 2C's "controlled offline renderer". The trust contract already names a fixed Blender export as the deterministic engine.

**Scene bundle (from the authored project, never from the open view)**

1. `buildStillJob` (exists) gains a bundle: a GLB **compiled from `InteriorProject`** plus the StillJob JSON. `exportSceneGlb.ts` is *not* reused as-is: it exports whatever Model View shows, cutaways included. A compile-to-GLB path with cutaways off and editor objects excluded is added beside it, sharing `sceneExportFilter`.
2. The GLB carries geometry, UVs and **material ids only** (no embedded maps). Blender binds the Phase 2 source PNGs by id. Clearcoat, sheen and transmission are mapped explicitly in the Python script, because glTF PBR is not 1:1 with Principled BSDF once those appear.
3. Lights are stripped from the GLB (`sceneExportFilter.ts:24` already does this) and **rebuilt from the JSON light list**, see "Light fidelity" below.
4. Camera uses the job's `fovDeg` and pose directly (the contract allows 0.5° drift; today's default is 42°, already a ~32 mm equivalent). No second lens conversion.

**Light fidelity — fixtures must read as real lights (the "Unity HDRP" bar)**

The bundle rebuilds **the lights the scene actually has**, one Cycles light per viewport light, in the same count and placement (`rendering/lighting/fixtures/*`, `windowKeyLight.ts`):

| App fixture | Viewport lights today | Cycles mapping |
| --- | --- | --- |
| Cove (`CoveFixture`) | Two `rectAreaLight`: up-light + wall band (`coveWallShare`) | Two area lights, same sizes and positions, **cast soft shadows** |
| Rope / profile / under-cabinet (`StripFixture`) | Emitter `rectAreaLight` + wall halo when wall-mounted | One or two area lights, same rule |
| Panel (`PanelFixture`) | One down `rectAreaLight` | One area light |
| COB and ceiling downlight (`CobFixture`) | One `spotLight` with `beamAngleDeg` | Spot, same cone, shadow-casting; IES optional (§6) |
| Track (`TrackFixture`) | One `spotLight` per head, `aimAngleDeg` | One spot per head |
| Pendant (`PendantFixture`) | One `pointLight` | Point with radius from fixture |
| Window keys (`resolveWindowKeyLights`) | One `directionalLight` each | One sun each, plus HDRI |
| Fixture body | Emissive mesh, no glow (bloom forbidden in viewport) | Emissive mesh; compositor glow **masked to the fixture emission pass**, nothing else blooms |
| Indirect light | None (the cove "wash" is the second area light) | Real bounce: a warm wall tints the ceiling, cove light wraps the cornice |

**Colour and units are the app's, not re-derived.** Each light carries `light.color` (what the viewport shows) and `colorTemperatureK` only when it is still set on the fixture. Intensity is sent as the physical value the viewport already computes through `fixtureRenderIntensity` and `LIGHT_RENDER_SCALE`: nits for area lights, candela for spots and points, with authoring brightness 0–100 alongside for provenance. The Python script converts those units to Blender's watts with a fixed, versioned formula and adds no scale table of its own.

**Render service**

- `blender --background --python render_still.py`, Cycles, AgX view transform, OIDN denoise, **pinned seed** and recorded device string in provenance.
- **Time cap is the gate, not a design number:** 1080p must finish in ≤ 3 min on the target box; samples adapt downward until a 2 BHK is measured. 4K is a flag.
- Output returns through the **existing** review step (`stillDiffOverlay`, `validateStillOutput`, accept / reject / retry) and provenance.
- **No double polish:** `runStillGeneration` always applies `runHeroStillEngine` (grade, unsharp, vignette, depth contact). The Cycles engine registers as its own engine id and that pass is skipped for it.
- **Rerun gate: Cycles stays deterministic.** Same job, pinned seed, one recorded device, and the contract's existing **deterministic row** (MAD ≤ 2% on the interior mask, or SSIM ≥ 0.98). If the target box misses that with OIDN on, a denoise note is added to the deterministic row (CPU OIDN, fixed thread count) rather than loosening the tolerance. The Stochastic AI row stays reserved for image models.
- UI: a **Render photo** action in Present and in the recent-jobs panel with progress and cancel, labelled "presentation still".

**Transport (open, see §6):** a shared GPU render box means customer room geometry leaves the seat, and some shops have no such box or no network path. Both options stay on the table: (a) shared HTTP render service, (b) Blender as a local Tauri sidecar on seats that have a GPU. The job contract is identical; only the runner differs. A seat with neither still gets the WebGL hero still.

**Done when:** a 2 BHK still from Cycles passes review with cove, COB and pendant fixtures visibly lighting the room; provenance lists the same material ids as the job; render time ≤ 3 min at 1080p on the target box; the WebGL viewport is untouched.

### Phase 4 — Viewport grounding within constraints (~1.5 days, after Phase 3)

Only what the quality roadmap already allows:

- Shadow **bias / normalBias / radius** audit per room size (fixes the speckled strip under the console without moving geometry). The strip is still in the Phase 0 2 BHK hero at device pixel ratio 2, so it is not a capture-aliasing artefact.
- `ContactShadows` tuned per tier; GLB casters at Standard (quality roadmap P0).
- Fixture read in the viewport stays as `WALL_DECOR_LIGHTING_ROADMAP.md` Phase 2 delivered it (emissive body, no bloom). Glow is a Phase 3 deliverable only.

Dropped from rev 1: the "28–35 mm lens" change (already the current lens) and the "normal-map bevel" (does not move the silhouette; a real chamfer is cabinet-geometry work and belongs in the millwork docs if ever).

---

## 3. Dropped, and why

| Option | Reason |
| --- | --- |
| In-browser path tracer (`three-gpu-pathtracer`) | WebGPU missing on Linux webview; WebGL path deprecated upstream; multi-MB denoiser in the client; only as good as Phases 1–2 anyway |
| AI enhancement (ControlNet from viewport) | Repaints textures; the laminate the customer picked is not guaranteed to be the laminate shown. Product decisions already exclude AI decoration |
| Paid AI render API, V-Ray AppSDK | Per-image cost or native render; same fidelity risk |
| LuxCoreRender | Free but needs an exporter plus server, with no advantage over Cycles |
| Unreal / Unity | Full rewrite of the 3D layer. The HDRP *look* (area shadows, glow, bounce) is reached through Cycles in Phase 3 instead |
| Viewport bloom / SSAO | Forbidden by the quality roadmap; fixtures glow in stills, not in the editor |
| 360 tours / panoramas | Trivial once Cycles exists, but "not first" in product decisions; keep as a flag, not a feature |

---

## 4. Cost summary

| Phase | Effort | Shipped weight | Where it loads |
| --- | --- | --- | --- |
| 0 | hours | none | scripts only |
| 1 | ~1.5 d | ~2–3 MB HDRIs | 3D view, active recipe only |
| 2 | ~2 d | ~0.3–1 MB per set + ~200 KB transcoder | 3D view, on-screen finishes only |
| 3 | ~1.5 w | ~0 in the app; Blender on a box or sidecar | render runner |
| 4 | ~1.5 d | none | 3D view |

Landing page stays at its current ~250 KB of WebP stills throughout.

---

## 5. Order and gates

1. **Phase 0 → 1 → 2** in that order; each gated by pixel readout plus a re-rendered 2 BHK still reviewed by the user. Each lighting phase re-records `fixtures/photo-stills/surface-bands.json` on purpose. ±12 luma will fail an intentional change until that re-record.
2. **Phase 3** starts once Phase 2 lands, because Cycles renders sine-wave wood just as faithfully as real oak.
3. **Phase 4** last, only after the Cycles still is accepted, so viewport work cannot become the polish loop again.

## 6. Open decisions for product

- Render runner: shared GPU box, per-seat Blender sidecar, or both behind one job contract (recommendation: both, sidecar first for the Mac build, shared box for factory seats). Who maintains Blender in each case.
- Whether customer geometry may leave the seat at all; if not, sidecar only.
- Whether 4K and panorama flags are exposed in the UI or kept internal.
- Whether IES profiles are worth sourcing per fixture kind, or a generic cone per kind is enough for v1.
