# Gemini Floor-Plan Vision Lab

Isolated lab for **upload → Gemini Vision → review → 3D → accept**  
(see [`docs/GEMINI_FLOORPLAN_VISION_ROADMAP.md`](../../docs/GEMINI_FLOORPLAN_VISION_ROADMAP.md)).

Does **not** modify the Living Room / 2D precision-canvas WIP.

## Current phase

**Phase 6B — Classical CV wall candidates** (done).  
Modes: **Raw Vision** · **6A cleaned** · **6B classical CV** (needs plan image). Next: **6C** only if fixtures still weak.

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
- **Geometry modes:** Raw Vision · 6A cleaned (ortho/merge) · 6B classical CV (image → axis walls)  
- **Accept:** Review → checkbox → Accept → download `.interior.json`

### Phase 6B merge rules

1. Classical CV owns **wall segments** (Otsu + morph close + H/V runs → proposal mm via ink bbox).  
2. Vision keeps **rooms, openings, scale, height, notes**.  
3. Result always runs through **6A cleanup**.  
4. Fail soft (no image, bad ink density, too few/many segments) → 6A cleaned Vision walls + note.

## Privacy

See [`PRIVACY.md`](./PRIVACY.md). Images are EXIF-stripped; Vision uses `/api/lab/gemini-vision` in DEV.

## Branch

Only `feat/gemini-floorplan-lab` (from `main`). Keep `feat/2d-plan-layer` untouched.
