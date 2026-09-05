# Gemini Floor-Plan Vision Lab

Isolated lab for **upload → Gemini Vision → review → 3D → accept**  
(see [`docs/GEMINI_FLOORPLAN_VISION_ROADMAP.md`](../../docs/GEMINI_FLOORPLAN_VISION_ROADMAP.md)).

Does **not** modify the Living Room / 2D precision-canvas WIP.

## Current phase

**Phase 6 — Free hybrid CV** (`NEXT` — start at **6A** ortho/merge).  
Phases 0–5 done. See roadmap § Phase 6.

## Run

1. ```bash
   cp .env.example .env
   ```
2. Set **`GEMINI_API_KEY=`** in `.env` (preferred — stays on the Vite proxy).  
   Optional: `VITE_GEMINI_MODEL`, `VITE_GEMINI_USE_PROXY`, `VITE_ENABLE_GEMINI_LAB`.
3. ```bash
   npm run dev
   ```
4. Open [http://localhost:1420/lab/gemini-floorplan](http://localhost:1420/lab/gemini-floorplan)

## Flows

- **Offline:** Load offline kitchen / L-room  
- **Image Vision:** Use sample image or upload PNG/JPEG/WebP → Run Gemini Vision  
- **PDF:** Upload PDF → pick page → raster PNG → Run Gemini Vision  
- **Accept:** Review → checkbox → Accept → download `.interior.json`

## Privacy

See [`PRIVACY.md`](./PRIVACY.md). Images are EXIF-stripped; Vision uses `/api/lab/gemini-vision` in DEV.

## Branch

Only `feat/gemini-floorplan-lab` (from `main`). Keep `feat/2d-plan-layer` untouched.
