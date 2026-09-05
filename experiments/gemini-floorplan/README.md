# Gemini Floor-Plan Vision Lab

Isolated **Phase 0** scaffold for upload → Gemini Vision → 3D (see
[`docs/GEMINI_FLOORPLAN_VISION_ROADMAP.md`](../../docs/GEMINI_FLOORPLAN_VISION_ROADMAP.md)).

This lab does **not** modify the Living Room / 2D precision-canvas WIP.

## Run

1. Copy env template from repo root:

   ```bash
   cp .env.example .env
   ```

2. Set `VITE_GEMINI_API_KEY` in `.env` (Phase 1+). Optional: `VITE_ENABLE_GEMINI_LAB=true`
   to expose the route in production builds.

3. From repo root:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:1420/lab/gemini-floorplan](http://localhost:1420/lab/gemini-floorplan)

   In `npm run dev`, the lab route is enabled automatically. Production builds
   require `VITE_ENABLE_GEMINI_LAB=true`.

## Code

UI lives in [`src/experiments/gemini-floorplan/`](../../src/experiments/gemini-floorplan/).
Do not wire Vision calls or project-accept into `/app` until Phase 4+.

## Branch

Work only on `feat/gemini-floorplan-lab` (from `main`). Keep
`feat/2d-plan-layer` untouched.
