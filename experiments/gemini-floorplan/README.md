# Gemini Floor-Plan Vision Lab

Isolated lab for **upload → Gemini Vision → reviewable JSON → (later) 3D**  
(see [`docs/GEMINI_FLOORPLAN_VISION_ROADMAP.md`](../../docs/GEMINI_FLOORPLAN_VISION_ROADMAP.md)).

Does **not** modify the Living Room / 2D precision-canvas WIP.

## Current phase

**Phase 4 — Accept bridge** (reviewed proposal → InteriorProject draft, explicit confirm).

Earlier phases remain: Vision extract, review overlay, 3D shell.

## Run

1. Copy env template:

   ```bash
   cp .env.example .env
   ```

2. Optional for now: set `VITE_GEMINI_API_KEY` when you want live Vision.  
   Optional: `VITE_GEMINI_MODEL` (default `gemini-3.6-flash`).  
   Optional: `VITE_ENABLE_GEMINI_LAB=true` for production builds.

3. ```bash
   npm run dev
   ```

4. Open [http://localhost:1420/lab/gemini-floorplan](http://localhost:1420/lab/gemini-floorplan)

## Without an API key

Use **Load offline kitchen / L-room** → review overlay + editors + calibration.  
Sample PNGs live under `/experiments/gemini-floorplan/fixtures/`.

## Accept (Phase 4)

1. Review overlay + confidence  
2. Check **I reviewed scale, walls, and confidence**  
3. **Accept → interior draft** downloads `.interior.json` and stashes sessionStorage  
4. Open that file in the designer when ready (see `MERGE_NOTES.md`)

## Code

`src/experiments/gemini-floorplan/` · regenerate PNGs with  
`node scripts/gemini-floorplan/generate-fixtures.mjs`

## Branch

Only `feat/gemini-floorplan-lab` (from `main`). Keep `feat/2d-plan-layer` untouched.
