# Phase 4 merge notes — Gemini lab → product

**Status:** Lab-only accept bridge (G-4.4)  
**Branch:** `feat/gemini-floorplan-lab` (from `main`)  
**Do not merge into:** `feat/2d-plan-layer` while that WIP is active  

## What Accept does today

1. Maps reviewed `GeminiFloorProposal` → `InteriorProject` via `drawRoomFromPoints`
2. Requires explicit checkbox + **Accept → interior draft**
3. Downloads `.interior.json` and stashes a copy in `sessionStorage`  
   key: `gemini-floorplan-lab:accepted-interior-v1`
4. Openings are **not** auto-imported (warning only) — place in the normal plan editor

## Product handoff checklist (when WIP lands)

- [ ] Keep accept **review-gated** (no silent overwrite of open jobs)
- [ ] Wire “Open accepted draft” in `/app` using `loadInteriorProjectFile` + existing restore path
- [ ] Decide whether sessionStorage handoff stays or File → Open only
- [ ] Reconcile with underlay/calibration from 2D Phase 2 when that ships
- [ ] Privacy review before enabling Vision on production `/app`

## Invariants

- After accept, **InteriorProject** is the source of truth
- Lab proposal JSON is archival / audit only
- Never treat Gemini output as editable millwork truth without human accept
