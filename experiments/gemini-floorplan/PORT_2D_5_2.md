# Port checklist — Gemini lab → 2D Plan Layer **2D-5.2**

**Phase:** 6D (G-6.15)  
**Lab branch:** `feat/gemini-floorplan-lab`  
**Do not merge into:** `feat/2d-plan-layer` while that WIP is active  
**Related:** [2D Plan Layer Roadmap](../../docs/2D_PLAN_LAYER_ROADMAP.md) § Phase 5 · [MERGE_NOTES.md](./MERGE_NOTES.md)

## Gate (must be green before product wiring)

- [x] Phase 6A ortho/merge cleanup  
- [x] Phase 6B classical CV (fail soft)  
- [x] Phase 6C model adapter + NC license note  
- [x] Phase 6D fixture scorecard passes offline goldens (`phase6Scorecard.test.ts`)  
- [ ] Manual demo on 2–3 real customer plans (review overlay + Accept)  
- [ ] Privacy review before Vision on production `/app`  

## Accept → planner path

- [ ] Keep **review-gated** Accept (checkbox + explicit action)  
- [ ] Map via existing `mapProposalToInteriorProject` / `drawRoomFromPoints`  
- [ ] After Accept, **InteriorProject** is source of truth (no live Gemini model of truth)  
- [ ] Openings: still manual in plan editor unless a follow-up imports them  
- [ ] Scale: require calibration when `scaleConfidence === "low"`  

## Underlay / 2D canvas

- [ ] Port underlay image + SVG overlay patterns into 2D Phase 2 underlay polish  
- [ ] Reuse scale calibration UX from lab  
- [ ] Geometry mode default for product: **6A cleaned** (6B/6C optional advanced)  
- [ ] CubiCasa / NC weights: **not** in product builds without commercial license  

## Isolation

- [ ] Merge lab → `main` behind flag first (optional)  
- [ ] Only then cherry-pick / port into `feat/2d-plan-layer` when that WIP is ready  
- [ ] Do not land AI convert as the only way to start a room  

## Success for 2D-5.2

Salesperson: upload plan → review walls → Accept → continue in normal 2D/3D millwork flow.
