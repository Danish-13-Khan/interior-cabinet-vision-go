# CubiCasa-class inference spike (Phase 6C)

Local path to produce `FloorplanModelOutput` JSON for the lab adapter.
**Does not** bundle CubiCasa weights (CC BY-NC — see [`../../experiments/gemini-floorplan/CUBICASA_LICENSE.md`](../../experiments/gemini-floorplan/CUBICASA_LICENSE.md)).

## Lab input format

Write JSON next to fixtures or under `public/experiments/gemini-floorplan/fixtures/cubicasa/<stem>.model.json`:

```json
{
  "source": "cubicasa",
  "imageWidthPx": 640,
  "imageHeightPx": 480,
  "polygons": [
    { "class": "wall", "pointsPx": [{ "x": 80, "y": 80 }, { "x": 560, "y": 80 }] },
    { "class": "door", "pointsPx": [{ "x": 200, "y": 80 }, { "x": 280, "y": 80 }] }
  ]
}
```

The lab **6C model** mode fetches `/experiments/gemini-floorplan/fixtures/cubicasa/<image-stem>.model.json`.

## Option A — use checked-in fixtures (no GPU)

Already shipped for `rect-kitchen`, `l-living`, `two-room`.  
In the lab: **Use sample image** → load proposal → **6C model**.

## Option B — real CubiCasa5k (research only)

1. Clone https://github.com/CubiCasa/CubiCasa5k  
2. Download weights from the repo README (Google Drive)  
3. Run their `samples.ipynb` / eval on your plan PNG  
4. Export wall/icon polygons to the JSON shape above (map SVG/junctions → `pointsPx`)  
5. Save as `public/.../cubicasa/<stem>.model.json` and refresh the lab  

## Option C — floorplan-to-3d

1. Follow https://github.com/Yytsi/floorplan-to-3d  
2. Convert their polygon export into `FloorplanModelOutput`  
3. Drop JSON into the fixtures folder with matching stem  

## Stub exporter

```bash
node scripts/gemini-floorplan/cubicasa_spike/write_example_fixture.mjs
```

Re-writes the rect-kitchen example fixture (no PyTorch).
