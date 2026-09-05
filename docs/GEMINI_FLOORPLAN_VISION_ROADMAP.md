# Gemini Floor-Plan Vision Lab Roadmap

**Document role:** Active roadmap for an isolated **upload 2D floor plan → Gemini Vision → reviewable 3D preview** lab  
**Product relationship:** Research / accelerator toward [2D Plan Layer Roadmap](./2D_PLAN_LAYER_ROADMAP.md) Phase 5.2 (AI floor-plan detection → review → accept). **Not** part of the current 2D precision-canvas WIP.  
**Branch:** `feat/gemini-floorplan-lab` (forked from `main` @ `494b7b3`)  
**Worktree:** `/Users/danishkhan/alpha/danish_cargo/cabinet-designer-gemini-lab`  
**Baseline date:** 2026-09-05  
**Status:** Draft for approval — implement only after this plan is accepted  
**Constraint:** AI proposes geometry; the editable project model remains the source of truth after human accept  

---

## 0. How to use this doc

1. This lab is **separate** from `feat/2d-plan-layer` and must not merge into that WIP until both sides are ready.
2. Status vocabulary: `CURRENT` · `NEXT` · `LATER` · `EXCLUDED`.
3. Ship phase-by-phase; do not start Phase N+1 until Phase N exit criteria pass.
4. Gemini **Vision** (multimodal image understanding) extracts structure. The app builds 3D from that structure — Gemini does **not** emit production GLB/mesh as the product model.

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

## 3. Technical approach (Vision AI)

```text
[Floor-plan image]
        │
        ▼
 Gemini Vision (structured JSON schema)
        │
        ▼
  Lab proposal model (walls / rooms / openings / scale hint)
        │
        ▼
  Review UI (2D overlay + editable JSON summary)
        │
        ▼
  Deterministic 3D builder (Three.js room shell)
        │
        ▼
  (Later) Accept → interior-project geometry
```

**Why Vision, not mesh generation**

| Path | Use |
| --- | --- |
| Gemini Vision → JSON | Correct for walls, rooms, openings, labels, rough scale |
| Image-to-3D generative mesh | Wrong for millwork — not editable, not measured, not topology-safe |
| App builds 3D from JSON | Same pattern as current 2D→3D sync: one model of truth after accept |

**API shape (planned)**

- Model: Gemini multimodal (Vision-capable; pin a specific model ID in Phase 1)
- Input: image (JPEG/PNG/WebP) + system/user prompt with JSON schema
- Output: validated proposal JSON (Zod or equivalent)
- Fail soft: show raw Vision text + validation errors; never crash the lab page

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

### Phase 5 — Hardening (`CURRENT` — implemented)

| ID | Item | Exit criteria |
| --- | --- | --- |
| G-5.1 | Server-side Gemini proxy (hide API key from browser) | Key not required in Vite client for shared deploys |
| G-5.2 | PDF page → raster → Vision path | Multi-page PDF: pick page then run |
| G-5.3 | Regression fixtures + golden JSON snapshots | Vision prompt changes don’t silently drift |
| G-5.4 | Privacy: strip EXIF; local-only mode docs | Clear data-handling note for demos |

---

## 6. Explicitly EXCLUDED

- Using generative mesh / NeRF / “image to GLB” as the editable product model  
- Claiming AI replaces measuring on site  
- Auto-accept into customer projects without review  
- Furniture / decor auto-staging as part of this lab  
- DWG/DXF conversion (separate program)  
- Merging lab into `feat/2d-plan-layer` while that branch is WIP  
- Shipping Vision calls on production `/app` without flag + privacy review  

---

## 7. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Vision invents walls / wrong scale | Phase 2 review + calibration mandatory before accept |
| API key leakage in client | Phase 0 env hygiene; Phase 5 proxy |
| Prompt drift across Gemini versions | Pin model ID; fixture snapshots |
| Contaminating 2D WIP | Separate worktree/branch; lab folder boundary |
| Users think 3D is “final millwork” | Label UI as **draft shell**; no cabinet auto-layout in lab v0 |

---

## 8. Suggested execution order

```text
PHASE 0  Lab scaffold + env              [NEXT]
    ↓
PHASE 1  Gemini Vision → JSON            [NEXT]
    ↓
PHASE 2  Review overlay + scale          [NEXT]
    ↓
PHASE 3  Deterministic 3D shell          [NEXT]
    ↓
PHASE 4  Accept → interior project       [LATER]
    ↓
PHASE 5  Proxy / PDF / hardening         [LATER]
```

---

## 9. Success definition (lab complete)

1. Upload plan image → Vision JSON → review → 3D shell works on fixtures.  
2. No edits required on `feat/2d-plan-layer` to demo the lab.  
3. Accept path (Phase 4) is optional and gated; AI never becomes a second source of truth.  
4. Docs + env instructions are enough for you to run a demo with your Gemini key.

---

## 10. Open decisions (resolve before Phase 1 code)

| Decision | Options | Recommendation |
| --- | --- | --- |
| Model ID | Gemini 2.x Flash vs Pro Vision | Start **Flash** for cost/latency; allow Pro toggle |
| Key transport | Vite env vs local proxy | Vite env for Phase 0–3 lab; proxy in Phase 5 |
| Entry | Dedicated route vs `experiments` Vite multi-page | Dedicated `/lab/gemini-floorplan` behind flag |
| 3D reuse | Share existing R3F scene vs tiny lab viewer | Tiny lab viewer first (less coupling) |

---

## 11. Approval gate

**Do not implement Phases 0+ until this roadmap is accepted.**

When ready, reply with:

1. Approve roadmap as-is, or list edits  
2. Choices for §10 (model, key transport, entry, 3D reuse)  
3. Confirm Gemini key will be supplied via local `.env` (never pasted into chat)

Then implementation starts at **Phase 0** on `feat/gemini-floorplan-lab` only.
