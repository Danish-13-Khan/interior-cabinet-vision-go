# Photo stills render roadmap

**Status:** Phase 3 pipeline is in the tree (`feat/photo-stills-p3-cycles`): Cycles bundle from the authored project, Blender scripts, Node runner, Present → Export photo job, Still review → Import photo still with the trust gates. **Not yet rendered**: no Blender on the build machine, so the light calibration and the 3-minute gate are unmeasured. Phase 4 is not started.
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

- **HDRIs:** three CC0 Poly Haven 1k pure skies, lazy-loaded for the active recipe only. `environmentManifest.ts` entries unchanged; files replaced. Daylight is `kloppenheim_06_puresky`, neutral studio is `belfast_sunset_puresky`, warm evening is `qwantani_dusk_2_puresky`. Photo-studio and lamp-grid interiors were dropped: their hotspots reflected off the semi-gloss floors as pale circles. Evening sun and window keys stay at 0.18 so placed fixtures lead; the evening HDRI and hemisphere run at 0.35 of daytime (`EVENING_ENVIRONMENT_SCALE`). At 0.18 the walnut fronts went black; at 1 the evening card heroes read as daylight and the 1 BHK failed the 175 card cap at 197. The card-capture hook's `setLook` mood now applies in plain Model View (`ShowcaseViewMode.capture`), which it never did before, so card heroes are graded against the mood they were actually rendered in.
- **Model View actually sees them:** `resolveModelViewLightingQuality` (`modelViewPreviewDefaults.ts`) is the resolver to edit. **Every tier above Draft** (Standard, Client Preview, Presentation) takes the rich path: `resolution` 256, `hemisphereScale` 0, the 1024 shadow map. Draft keeps its clamp and its hemisphere. The stills scripts pin Client Preview, so this is what the bands measure. The generic resolver's preview branch is left alone.
- **Tone mapping:** `AgXToneMapping` (built into three r185). `RendererColorPipeline` **reads** `style.colorManagement.toneMapping` (today it ignores it); the union widens to `"aces-filmic" | "agx"`; exposure re-tuned per style by pixel readout; `stylePresets.test.ts:28` updated. Three's AgX and Blender's AgX view are the same family, not a pixel match: the Phase 3 review gate, not the curve, guarantees parity.
- **Background / fog:** neutral background per style; fog disabled when the camera is inside the room. Confirmed on the Phase 0 stills: the 1 BHK and 3 BHK show the style backdrop as a blue slab through the window cutaway.
- **Colour fixes:** moody-walnut walnut `#3d2d26` → `#6a5342` (other styles unchanged). Nordic and warm-contemporary exposure are both 1.42; moody-walnut is 1.05. A saved project adopts that exposure only when it still holds the retired preset default (moody 0.92, nordic 1.18, warm 1.05). Any other exposure is left as the user set it. Adoption runs in the file loader and again when a snapshot becomes the open project, so a browser draft reopened from IndexedDB is covered too. Light colour temperature already exists (`colorTemperatureK` → `kelvinToHex` → `light.color` in `lightFixtureProperties.ts:46`), so nothing is invented here; Phase 3 sends what the app stores.

**Done when:** Model View Standard pixel readout for wall, floor and walnut door sits inside bands **re-recorded** after this phase, including a new 2 BHK overview target; no new npm packages.

### Phase 2 — Real material sets, shared by both engines (~2 days)

- Eight CC0 Poly Haven 1k scans, colour + roughness + normal, tile size in millimetres: `red_oak_veneer` (oak, 1000), `black_walnut_veneer_02` (walnut, 1000), `hessian_230` (oatmeal fabric and the wool rug, 269), `polar_fleece` (olive fabric, 273), `marble_01` (stone floor, 1500), `beige_wall_001` (matte paint, 3000), `leather_white` (white laminate, 300), `grey_plaster` (grey laminate, 1000). White and grey laminate are new finish ids; the others stay on the existing living-room ids. Walnut is the dark veneer, not the pale `smoked_walnut_veneer` scan.
- Web delivery is KTX2 via three's `KTX2Loader`. Colour and roughness are ETC1S; normals are UASTC with Zstandard. Fabric delivery is 512 px so every map is a multiple of four. The Basis transcoder lives in `public/basis/` (no npm package). Source PNGs are `render-sources/materials/<materialId>/{color,normal,roughness}.png` plus `source.json`, so Cycles never consumes the viewport's compressed maps. The old sine-wave PNGs are gone. Metal AO stays a PNG. A set stays inside the 0.3–1 MB budget.
- Wired through `CuratedPbrMaterial` and the GLB slot loader. Procedural generators stay the fallback for thumbnails and any finish without a scan. Paint and stone colour maps sit near a linear mean of 0.64, and fabric and laminate near 0.82, so the wall and floor scans stop muddying the Phase 1 exposure without blowing the daylight cap. Every roughness map is lifted near a linear mean of 1. Wood colour maps sit near 0.32 so the style brown stays in the walnut under the cove light and a full-height panel stays inside the daylight exposure cap. The style colour and roughness multiply those maps. Normal relief is 2 on non-paint scans. Grey laminate's own colour is the plaster mean (`#8c8674`) so the detail map does not turn it white.
- Finish identity law is the **StillJob material-id rule** (trust contract §3.1: exact slot → material id), not apartment-template D9, which is about generic roles versus brand SKUs.

**Done when:** door, table and sofa in the 2 BHK still show grain / weave with no sine-wave stripes; landing-page weight unchanged (it only ships WebP stills).

### Phase 3 — Photo still engine: Blender Cycles (~1.5 weeks)

This is Phase 2C's "controlled offline renderer". The trust contract already names a fixed Blender export as the deterministic engine.

**Scene bundle (from the authored project, never from the open view)**

1. `buildCyclesStillBundle` (`domain/livingRoom/cyclesBundle/`) wraps the StillJob with a **description of the compiled scene**, not a GLB export: boxes, cylinders and polygon prisms with exact sizes in their three.js local frames, and catalog GLBs by public asset key with slot → material-id bindings. Blender rebuilds the meshes itself, so there are no cutaways, no editor helpers and no viewport state in the still. (The GLB-export route in rev 3 was dropped: `exportSceneGlb.ts` exports what Model View shows, and a mesh export carries nothing Blender cannot rebuild from the description.)
2. The bundle carries **material ids and the style tint only**. Blender binds the Phase 2 source PNGs by id and multiplies each scan by `tint / mean`, with the means precomputed into `source.json` by `npm run cycles:means`, so the still's albedo is the style colour with the scan as detail, the viewport's rule. Glass maps to transmission; opacity to alpha.
3. Lights are never exported as meshes: the bundle lists **every light the viewport creates**, see "Light fidelity" below, and `scripts/cycles/check-bundle-math.mjs` proves the Python transform math matches three.js to zero error for the YXZ fixture frames.
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

**Transport (decided for v1: (b) per-seat runner, no sidecar yet):** the app writes `bundle.json` (Present → **Export photo job…**, or Still review), `npm run cycles:render <dir> --rerun` renders it with the local Blender, and Still review → **Import photo still…** takes `provenance.json` and `still.png` back through the trust gates with a freshly captured WebGL plate. Customer geometry never leaves the seat. The job contract is runner-agnostic, so a shared HTTP service (a) can consume the same bundle later. In-app spawn with progress and cancel needs the Tauri shell plugin and stays a follow-up; a seat without Blender still gets the WebGL hero still. The Render Studio itself is a QA surface (`interiors-qa-fixture` → `openRenderStudio`), so the customer-facing entry is the Present button.

**Done when:** a 2 BHK still from Cycles passes review with cove, COB and pendant fixtures visibly lighting the room; provenance lists the same material ids as the job; render time ≤ 3 min at 1080p on the target box; the WebGL viewport is untouched.

**Built so far (2026-10-07):** bundle export verified from both app entry points and the CLI (2 BHK: 33 nodes, 2 GLBs, 21 materials, 3 fixtures with 4 lights, 5 recipe lights, 1 window key, warm-evening HDRI at 0.32); import gates verified with a fabricated provenance (pass), a swapped material id (fail) and an edited project (fail). **Still owed:** the first real render, which sets the four `CALIBRATION` factors in `still_bundle_math.py` and measures the 3-minute gate. That needs Blender 4.x on a machine with this checkout.

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
