# StillJob trust contract (Phase 2 foreshadow)

**Status:** Implemented · proof: `npm run phase2:proof` · spike: `npm run stilljob:spike`  
**Purpose:** Prevent Phase 2 from becoming a trust-destroying fork where the still no longer represents the authored scene.

Week-4 of the near-term plan spikes handoff shapes only — **no AI vendor lock-in**. Full still engine remains later.

**Related doc:** [Phase 2 — Hybrid Stills Pipeline](./PHASE_2_HYBRID_STILLS_PIPELINE.md)

---

## 1. Roles

| Artifact | Role |
|---|---|
| `InteriorProject` | Editable source of truth |
| WebGL viewport / Client Preview PNG | Authoritative interactive representation |
| `StillJob` | Optional presentation enhancement request |
| Still output image | Client-facing presentation asset, **labeled** as such |

The still must never silently replace the authored scene as truth.

---

## 2. StillJob request (conceptual contract)

A StillJob references the authored state; it does not embed GPU objects.

Required fields (conceptual):

- `projectId` + content hash (or serialized snapshot id)
- `schemaVersion`
- `cameraId` + locked pose (eye, target, fov) in project units
- `quality` / presentation preset id
- `lightingRecipeId` / style ids
- `seed` (for any stochastic enhancer)
- `engine` id + engine version
- `allowedEnhancements` (enum set — see below)
- `forbiddenChanges` inherited from this contract

Optional inputs derived from WebGL (deterministic preferred):

- hero PNG plate
- depth / normal / segmentation masks
- material id map (palette indices → project material ids)

---

## 3. What may never change (hard)

A still pipeline **must not** alter, invent, or hide:

1. Room footprint / wall positions / opening locations
2. Object counts, categories, or approximate placements (no adding/removing furniture)
3. Millwork / cabinet dimensions and configuration meaning
4. Camera identity claimed in the package (pose must match job camera within **§3.1** tolerances)
5. Material identity claims (“walnut door”) if the still substitutes a different species/finish without disclosure
6. Project JSON — stills are outputs, not writes back into truth without an explicit user action

**Mismatch = fail QA.** Do not auto-ship failed stills into client packages.

### 3.1 Numeric tolerances (QA gates)

All comparisons are against the StillJob’s locked authored snapshot (same `project` hash / camera id).

| Check | Metric | Pass tolerance | Fail means |
|---|---|---|---|
| Camera eye | ‖eye_still − eye_job‖ | **≤ 25 mm** | Camera drift |
| Camera target | ‖target_still − target_job‖ | **≤ 40 mm** | Look-at drift |
| Camera FOV | \|fov_still − fov_job\| | **≤ 0.5°** | Lens mismatch |
| Object set | Count + ids present | **Exact match** | Hallucinated / missing furniture |
| Object placement | ‖centroid_xy_still − centroid_xy_job‖ (plan) | **≤ 50 mm** per object | Furniture moved |
| Object height | \|z_still − z_job\| for origin/footing | **≤ 20 mm** | Floating / sunk |
| Millwork size | \|ΔW\|, \|ΔH\|, \|ΔD\| vs project | **≤ 2 mm** each | Cabinet lie |
| Opening / wall | Plan vertex drift | **≤ 15 mm** | Room footprint lie |
| Material id | Slot → materialAssetId / material id | **Exact** (unless disclosed swap flag; default off) | Finish bait-and-switch |
| Deterministic rerun | Same job + engine + seed→N/A | Mean absolute pixel diff **≤ 2%** of 8-bit channel range on interior mask (or SSIM ≥ **0.98**) | Unstable engine |
| Stochastic AI | Same job + seed + model version | Must pass geometry/material tables above; pixel diff **not** used as sole pass | Pretty but unfaithful |

**Notes:**

- Prefer mask-aware compares (ignore exterior window plate if background enhance is allowed).
- If depth/seg masks exist, object centroid checks should use mask centroids, not vibes.
- Tolerances are product law until this doc is explicitly revised.

---

## 4. What may be enhanced (soft, disclosed)

Allowed only if listed on the job and disclosed in the client package manifest:

| Enhancement | Allowed? | Rule |
|---|---|---|
| Soft shadows / contact enrichment | Yes | Must not invent new light sources that move object shading illogically |
| Material micro-detail / roughness polish | Yes | Same material id; no species swap |
| Exposure / contrast / mild grade | Yes | No heavy style transfer that changes daylight story |
| Background outside windows | Yes, cautious | Must not change interior geometry |
| Generative fill of unseen rooms | **No** | |
| Relight that contradicts recipe/windows | **No** | |
| Swap sofa model / add decor props | **No** unless user opted into “style props” mode (default off) | |
| Move furniture for composition | **No** | |

Default mode = **faithful enhance**. Any “marketing stylize” mode is a separate explicit flag.

---

## 5. Deterministic vs stochastic

| Kind | Examples | Requirement |
|---|---|---|
| Deterministic | Offline path tracer, fixed Blender scene export | Prefer for trust; same job → same pixels within tolerance |
| Stochastic | AI image models | Must store `seed`, model id/version; regenerate must be reviewable; higher QA bar |

If stochastic: UI must say **“AI-enhanced still”** (or equivalent). Never label as “exact viewport capture.”

---

## 6. Review loop (required product behavior)

1. User locks camera + runs StillJob  
2. System shows **WebGL plate | Still output | diff/mask overlay** (even if simple)  
3. User **Accept** / **Reject** / **Retry**  
4. Only Accepted stills enter client package  
5. Package manifest records engine, seed, enhancement flags, project hash, camera id  

Rejected stills are discarded; authored scene unchanged.

---

## 7. Edit-back rule

Stills are **not** editable geometry.  
To change the design, user edits Plan/Model (InteriorProject), then re-runs capture or StillJob.  
No “paint out the sofa in the still and pretend the project updated.”

---

## 8. Phase 1 week-4 spike (allowed without AI)

Prove handoff only:

- [x] Export StillJob JSON for one benchmark camera (`fixtures/still-job-spike/still-job.json`)
- [x] Attach WebGL PNG path + camera pose + material id list (capture bridge + support maps)
- [x] Round-trip validate: job camera pose matches project camera within **§3.1** tolerances (eye ≤25 mm, target ≤40 mm, FOV ≤0.5°)
- [x] Document gaps (`fixtures/still-job-spike/GAPS.md`) — **do not** call an AI API yet unless product explicitly expands scope
- [x] Deterministic rerun gate (hero engine, same job → same pixels within MAD ≤ 2%)
- [x] Review workflow + client package provenance (`npm run phase2:proof`)

Run: `npm run stilljob:spike`

---

## 9. One-line contract

**The still may look prettier; it may not lie about what was authored.**
