# Gemini Floor-Plan Vision Lab

Isolated lab for **upload → Gemini Vision → review → 3D → accept**  
(see [`docs/GEMINI_FLOORPLAN_VISION_ROADMAP.md`](../../docs/GEMINI_FLOORPLAN_VISION_ROADMAP.md)).

Does **not** modify the Living Room / 2D precision-canvas WIP.

## Current phase

**Phase 6D — Fixture scorecard** (done). Phase 6 lab complete (6A–6D).  
See [`PORT_2D_5_2.md`](./PORT_2D_5_2.md) before any 2D plan port. CubiCasa NC: [`CUBICASA_LICENSE.md`](./CUBICASA_LICENSE.md).

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
- **Geometry modes:** Raw · 6A cleaned · 6B classical CV · **6C model** (CubiCasa-class JSON)  
- **Accept:** Review → checkbox → Accept → download `.interior.json`

### Phase 6B merge rules

1. Classical CV owns **wall segments** (Otsu + morph close + H/V runs → proposal mm via ink bbox).  
2. Vision keeps **rooms, openings, scale, height, notes**.  
3. Result always runs through **6A cleanup**.  
4. Fail soft (no image, bad ink density, too few/many segments) → 6A cleaned Vision walls + note.

### Phase 6C model path

1. Lab fetches `/experiments/gemini-floorplan/fixtures/cubicasa/<image-stem>.model.json`.  
2. Adapter maps polygons → walls (Vision keeps room names).  
3. Missing model JSON → fail soft to 6B then 6A.  
4. Real CubiCasa weights: see [`scripts/gemini-floorplan/cubicasa_spike/README.md`](../../scripts/gemini-floorplan/cubicasa_spike/README.md) — **not bundled** (NC license).

## Privacy

See [`PRIVACY.md`](./PRIVACY.md). Images are EXIF-stripped; Vision uses `/api/lab/gemini-vision` in DEV.

## Branch

Only `feat/gemini-floorplan-lab` (from `main`). Keep `feat/2d-plan-layer` untouched.
