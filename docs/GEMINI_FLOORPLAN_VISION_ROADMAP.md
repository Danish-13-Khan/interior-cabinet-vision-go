# Gemini Floor-Plan Vision Lab Roadmap

**Document role:** Active roadmap for an isolated **upload 2D floor plan → (Vision + free hybrid CV) → reviewable 3D preview** lab  
**Product relationship:** Research / accelerator toward [2D Plan Layer Roadmap](./2D_PLAN_LAYER_ROADMAP.md) Phase 5.2 (AI floor-plan detection → review → accept). **Not** part of the current 2D precision-canvas WIP.  
**Branch:** `feat/gemini-floorplan-lab` (forked from `main` @ `494b7b3`)  
**Worktree:** `/Users/danishkhan/alpha/danish_cargo/cabinet-designer-gemini-lab`  
**Baseline date:** 2026-09-05  
**Status:** Phases 0–5 done · **Phase 6 (`NEXT`)** — free hybrid CV quality pass  
**Constraint:** AI/CV proposes geometry; the editable project model remains the source of truth after human accept  
**Cost constraint:** Phase 6 uses **no paid CV APIs** (no Tectly / Planner 5D / Polycam). Gemini (already in lab) + open-source / classical CV only.  

---

## 0. How to use this doc

1. This lab is **separate** from `feat/2d-plan-layer` and must not merge into that WIP until both sides are ready.
2. Status vocabulary: `CURRENT` · `NEXT` · `LATER` · `EXCLUDED`.
3. Ship phase-by-phase; do not start Phase N+1 until Phase N exit criteria pass.
4. Gemini **Vision** extracts semantics (and v0 geometry). Phase 6 adds **free hybrid CV** so walls/openings are detected or cleaned — not only guessed. The app builds 3D from the proposal — no generative GLB/mesh as the product model.

---

## 1. North star

> A salesperson drops a floor-plan image, gets a credible wall/room draft in seconds, reviews it, and can later accept it into the normal measured-room workflow.

**Primary metric (lab):** time from upload → inspectable 3D room shell under ~30 seconds on a typical kitchen/living plan image.

**Positioning:** import accelerator + review loop — not “AI designs the house.”

---

## 2. Isolation contract (non-negotiable)

| Rule | Detail |
| --- | --- |
| Branch base | `feat/gemini-floorplan-lab` from **`main` only** — never from `feat/2d-plan-layer` |
| Code surface | Prefer `experiments/gemini-floorplan/` (+ thin route/entry if needed) |
| Do not touch | Living-room plan WIP, precision canvas, measure/snap polish under active WIP |
| Secrets | `VITE_GEMINI_API_KEY` (or server proxy later); never commit keys |
| Merge policy | Lab may merge to `main` behind a lab route/flag; **import into real planner** only after Phase 4 accept path |

---

## 3. Technical approach (Vision + hybrid CV)

```text
[Floor-plan image]
        │
        ├──────────────────────────────┐
        ▼                              ▼
 Gemini Vision (JSON)          Free CV path (Phase 6)
 labels / rooms / notes        walls / openings / cleanup
        │                              │
        └──────────┬───────────────────┘
                   ▼
         Lab proposal model (merged)
                   │
                   ▼
         Review UI (overlay + scale)
                   │
                   ▼
         Deterministic 3D room shell
                   │
                   ▼
         Accept → interior-project geometry
```

**Why Vision + CV, not mesh generation**

| Path | Use |
| --- | --- |
| Gemini Vision → JSON | Labels, room names, notes, rough structure when CV is weak |
| Classical / open CV → walls | Ortho snap, contours, CubiCasa-class segmentation (free) |
| Image-to-3D generative mesh | Wrong for millwork — not editable, not measured, not topology-safe |
| App builds 3D from JSON | Same pattern as current 2D→3D sync: one model of truth after accept |

**API / CV shape**

- Model: Gemini multimodal (pinned via env; proxy in Phase 5)
- Input: image (JPEG/PNG/WebP/PDF raster) + schema prompt
- Output: validated proposal JSON; Phase 6 may replace/merge wall geometry from free CV
- Fail soft: show raw Vision text + validation errors; never crash the lab page
- Phase 6: no paid floor-plan APIs — TypeScript cleanup → classical CV → optional CubiCasa-class weights

---

## 4. Proposal schema (lab v0)

Minimal fields — extend only when a phase needs them.

```ts
type GeminiFloorProposal = {
  units: "mm" | "cm" | "m" | "ft" | "in"
  scaleConfidence: "low" | "medium" | "high"
  assumedWallHeightMm: number
  rooms: Array<{
    id: string
    name?: string
    // plan polygon in proposal-local coordinates (mm after normalize)
    outlineMm: Array<{ x: number; y: number }>
  }>
  walls: Array<{
    id: string
    a: { x: number; y: number }
    b: { x: number; y: number }
    thicknessMm?: number
  }>
  openings?: Array<{
    id: string
    kind: "door" | "window" | "opening"
    wallId?: string
    widthMm?: number
    heightMm?: number
  }>
  notes?: string[]   // Vision caveats for the reviewer
}
```

**Invariant:** after Phase 2, coordinates are normalized to **mm** in a consistent plan origin before 3D build.

---

## 5. Delivery sequence

### Phase 0 — Lab scaffold (`CURRENT` — done)

Stand up an isolated surface with zero product risk.

| ID | Item | Exit criteria |
| --- | --- | --- |
| G-0.1 | `experiments/gemini-floorplan/` package layout + README | Lab runs without touching plan WIP files |
| G-0.2 | Dev route or standalone entry (e.g. `/lab/gemini-floorplan`) | Reachable in local `npm run dev` only / behind flag |
| G-0.3 | Env template for `VITE_GEMINI_API_KEY` | Documented; `.env` gitignored |
| G-0.4 | Empty UI shell: upload zone + status + placeholder 3D pane | Manual smoke: page loads |

**Phase exit:** Lab page opens; WIP branch remains clean of these files until intentional port.

---

### Phase 1 — Vision extract (`CURRENT` — done)

Upload → Gemini Vision → validated proposal JSON.

| ID | Item | Exit criteria |
| --- | --- | --- |
| G-1.1 | Image pick + preview (PNG/JPEG/WebP; size/type guards) | Bad files rejected with clear message |
| G-1.2 | Gemini Vision client (prompt + schema instructions) | Returns JSON for a sample plan fixture |
| G-1.3 | Schema validation + normalize units to mm | Invalid model output surfaces as review errors |
| G-1.4 | Fixture pack: 3–5 anonymized floor-plan images + expected notes | Repeatable local demos without guessing |
| G-1.5 | Cost/latency readout (tokens / ms) in UI | Operator can see call cost shape |

**Phase exit:** Upload a fixture → see validated proposal JSON in the lab (no 3D required yet).

---

### Phase 2 — Review overlay (`CURRENT` — done)

Human can trust or distrust the draft before 3D.

| ID | Item | Exit criteria |
| --- | --- | --- |
| G-2.1 | 2D overlay of walls/rooms on the uploaded image | Geometry visually aligns or mismatches are obvious |
| G-2.2 | Simple editors: wall endpoints, room name, wall height | Corrections update proposal model |
| G-2.3 | Scale calibration (known length on plan → mm) | User can fix bad Vision scale |
| G-2.4 | Confidence + Vision `notes` panel | Low-confidence items highlighted |

**Phase exit:** Reviewer can correct scale and walls without re-calling Gemini (optional re-run still allowed).

---

### Phase 3 — Deterministic 3D shell (`CURRENT` — done)

Build a presentable room shell from the **reviewed** proposal.

| ID | Item | Exit criteria |
| --- | --- | --- |
| G-3.1 | Pure builder: proposal JSON → Three.js meshes (walls/floor) | Unit-tested geometry helpers |
| G-3.2 | Orbit viewer (existing R3F/drei patterns if reused carefully) | Rotate/pan/zoom the shell |
| G-3.3 | Openings as wall cutouts or marked voids (v0 may be markers) | Doors/windows visible in 3D |
| G-3.4 | Side-by-side: image / overlay / 3D | Sales-demoable lab flow |

**Phase exit:** Reviewed proposal produces a stable 3D room shell every time (same JSON → same mesh).

---

### Phase 4 — Accept bridge (`CURRENT` — done)

Connect lab output to real interior-project geometry — still review-gated.

| ID | Item | Exit criteria |
| --- | --- | --- |
| G-4.1 | Mapper: proposal → interior-project walls/rooms draft | Mapping documented + tested |
| G-4.2 | Explicit **Accept** action (no silent overwrite) | User confirms before project mutation |
| G-4.3 | Post-accept path uses normal plan editor (no AI model of truth) | Aligns with roadmap 5.2 principle |
| G-4.4 | Merge strategy vs `feat/2d-plan-layer` when that WIP lands | Written ADR / checklist before merge |

**Phase exit:** Accept creates normal editable geometry; reject leaves project unchanged.

---

### Phase 5 — Hardening (`CURRENT` — done)

| ID | Item | Exit criteria |
| --- | --- | --- |
| G-5.1 | Server-side Gemini proxy (hide API key from browser) | Key not required in Vite client for shared deploys |
| G-5.2 | PDF page → raster → Vision path | Multi-page PDF: pick page then run |
| G-5.3 | Regression fixtures + golden JSON snapshots | Vision prompt changes don’t silently drift |
| G-5.4 | Privacy: strip EXIF; local-only mode docs | Clear data-handling note for demos |

**Phase exit:** Lab is demoable with proxy, PDF, fixtures, and privacy notes.

---

### Phase 6 — Free hybrid CV (`NEXT`)

Improve wall/opening quality **without paid CV vendors**. Gemini stays for semantics; geometry gets classical cleanup and optional open-source detection. Still review-gated before Accept.

**Principle:** detect or clean walls with free tools → merge into the same proposal schema → existing review / 3D / accept unchanged.

| Sub | Focus | Cost |
| --- | --- | --- |
| **6A** | Geometry post-process on proposal JSON | Free (TypeScript only) |
| **6B** | Browser / local classical CV wall candidates | Free (OpenCV.js or Canvas) |
| **6C** | Open pretrained floor-plan model (CubiCasa / floorplan-to-3d) | Free weights; optional local GPU |
| **6D** | Quality gate vs fixtures → ready for 2D-5.2 port | Free |

#### 6A — Ortho / merge post-process (`CURRENT` — done)

| ID | Item | Exit criteria |
| --- | --- | --- |
| G-6.1 | Snap wall angles to 0° / 90° (configurable tolerance) | Near-ortho walls become axis-aligned |
| G-6.2 | Merge near-collinear / near-duplicate wall segments | Fewer overlapping stubs in overlay |
| G-6.3 | Close nearly closed room loops where safe | Room outlines less fragmented |
| G-6.4 | Pure `domain`-style helpers + unit tests on golden proposals | Deterministic; no network |
| G-6.5 | Lab toggle: **Raw Vision** vs **CV-cleaned** proposal | Side-by-side quality check in UI |

**6A exit:** Cleaned proposal looks tighter on fixtures than raw Gemini; 3D/Accept still work.

#### 6B — Classical CV wall mask (`CURRENT` — done)

| ID | Item | Exit criteria |
| --- | --- | --- |
| G-6.6 | Raster prep: threshold / morphology on plan image | Strong line structure on clean B&W scans |
| G-6.7 | Contour → polyline candidates mapped into proposal space | Candidate walls overlay the image |
| G-6.8 | Merge strategy: CV walls preferred for geometry; Gemini for names/notes | Documented merge rules + tests |
| G-6.9 | Fail soft on photo-of-paper / noisy scans | Falls back to Vision + 6A cleanup |

**6B exit:** At least one golden scan produces usable walls **without** trusting Vision endpoints alone.

#### 6C — Open pretrained model (`CURRENT` — done spike)

| ID | Item | Exit criteria |
| --- | --- | --- |
| G-6.10 | Spike: CubiCasa5k or `floorplan-to-3d` → wall/door/window polygons | Local inference script or tiny lab service |
| G-6.11 | Adapter: model output → `GeminiFloorProposal` (same schema) | Drop-in for review / 3D / accept |
| G-6.12 | License check (research / non-commercial vs product) | Written note in lab README before any product promise |
| G-6.13 | Optional: Gemini only for room labels after CV geometry | Hybrid path documented |

**6C delivery:** Offline `*.model.json` fixtures + adapter + license doc + spike README. Real CubiCasa weights stay **local/research** (CC BY-NC) — not bundled. Fail soft → 6B → 6A.

**6C exit:** On hard fixtures, CV model walls beat Gemini-only; still no paid API.

#### 6D — Quality gate before 2D plan port (`CURRENT` — done)

| ID | Item | Exit criteria |
| --- | --- | --- |
| G-6.14 | Fixture scorecard: overlay alignment + wall count sanity | Recorded pass/fail on golden set |
| G-6.15 | Checklist for port into [2D Plan Layer](./2D_PLAN_LAYER_ROADMAP.md) **2D-5.2** | Accept + underlay path listed; WIP branch still untouched until intentional merge |

**6D delivery:** `fixtureScorecard` + offline report (`phase6-scorecard.json`) + lab panel + [`PORT_2D_5_2.md`](../experiments/gemini-floorplan/PORT_2D_5_2.md). Also fixed 6A merge so opposite parallel walls are not collapsed.

**Phase 6 exit:** Hybrid path clearly better than Vision-only on fixtures; ready to discuss 2D-5.2 integration — still behind review + Accept.

---

## 6. Explicitly EXCLUDED

- Using generative mesh / NeRF / “image to GLB” as the editable product model  
- Claiming AI replaces measuring on site  
- Auto-accept into customer projects without review  
- Furniture / decor auto-staging as part of this lab  
- DWG/DXF conversion (separate program)  
- Merging lab into `feat/2d-plan-layer` while that branch is WIP  
- Shipping Vision calls on production `/app` without flag + privacy review  
- **Paid floor-plan CV APIs** as a Phase 6 dependency (Tectly, Planner 5D recognition, Polycam, etc.)  
- Replacing Phase 2 review with fully automatic accept  

---

## 7. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Vision invents walls / wrong scale | Phase 2 review + calibration; Phase 6 CV cleanup / detection |
| Classical CV fails on photos | Fail soft → Vision + 6A; reserve 6C for hard cases |
| CubiCasa license limits product use | G-6.12 before promising customers |
| API key leakage in client | Phase 0 env hygiene; Phase 5 proxy |
| Prompt drift across Gemini versions | Pin model ID; fixture snapshots |
| Contaminating 2D WIP | Separate worktree/branch; lab folder boundary |
| Users think 3D is “final millwork” | Label UI as **draft shell**; no cabinet auto-layout in lab v0 |

---

## 8. Suggested execution order

```text
PHASE 0  Lab scaffold + env              [done]
    ↓
PHASE 1  Gemini Vision → JSON            [done]
    ↓
PHASE 2  Review overlay + scale          [done]
    ↓
PHASE 3  Deterministic 3D shell          [done]
    ↓
PHASE 4  Accept → interior project       [done]
    ↓
PHASE 5  Proxy / PDF / hardening         [done]
    ↓
PHASE 6A Ortho / merge post-process      [done]
    ↓
PHASE 6B Classical CV wall candidates    [done]
    ↓
PHASE 6C Open CubiCasa-class model       [done spike — fixtures + adapter]
    ↓
PHASE 6D Fixture scorecard → 2D-5.2      [done]
```

**Phase 6 complete (lab):** 6A–6D landed on `feat/gemini-floorplan-lab`. Product port waits on [`PORT_2D_5_2.md`](../experiments/gemini-floorplan/PORT_2D_5_2.md).

### Phase 7 — Wall topology (`CURRENT` — in progress)

| ID | Item | Exit criteria |
| --- | --- | --- |
| G-7.1 | Junctions from wall endpoints | T/L/X/corner kinds |
| G-7.2 | Thickness + height on arch walls | Stored on `ArchitecturalWall` |
| G-7.3 | Exterior/interior heuristic | Classification + confidence |
| G-7.4 | Wall adjacency via junctions | Queryable neighbors |
| G-7.5 | roomLeft / roomRight | Probe from centerline |
| G-7.6 | join/split repair helpers | Pure functions + tests |

See § Reconstruction program in repo history / Downloads draft for Phases 8–14 plan.

---

## 9. Success definition

**Lab v0 (Phases 0–5):**  
1. Upload → Vision JSON → review → 3D shell on fixtures.  
2. Accept path gated; AI never a second source of truth.  
3. Proxy / PDF / privacy / goldens in place.

**Lab v1 (Phase 6):**  
4. Hybrid CV path improves wall overlay vs raw Vision on golden fixtures.  
5. No paid CV vendor required.  
6. Clear gate for porting into 2D roadmap **5.2**.

---

## 10. Open decisions

### Resolved (Phases 0–5)

| Decision | Choice |
| --- | --- |
| Model ID | Flash-class default; env override |
| Key transport | Server proxy preferred (`GEMINI_API_KEY`) |
| Entry | `/lab/gemini-floorplan` behind flag |
| 3D reuse | Tiny lab R3F viewer |

### Resolve before / during Phase 6

| Decision | Options | Recommendation |
| --- | --- | --- |
| 6A snap tolerance | 5° vs 10° vs 15° | Start **10°**; tune on fixtures |
| 6B runtime | OpenCV.js in browser vs Canvas-only | Prefer **Canvas / pure TS** first; OpenCV.js if needed |
| 6C host | Local Python script vs Vite plugin sidecar | Local script + JSON drop for spike; sidecar only if demo needs one-click |
| Merge policy | CV overwrites Vision walls vs weighted blend | **CV geometry + Vision labels** when CV confidence high |

---

## 11. Approval gate (Phase 6)

Phases 0–5 are implemented on `feat/gemini-floorplan-lab`.

When ready to build Phase 6, confirm:

1. Phase 6 plan accepted (or list edits)  
2. Choices for §10 Phase 6 (snap tolerance, 6B runtime, merge policy)  
3. Still **no paid CV APIs**; CubiCasa only if 6A+6B are not enough  
4. Still no merge into `feat/2d-plan-layer` until 6D gate  

Then implementation starts at **Phase 6A** on `feat/gemini-floorplan-lab` only.
