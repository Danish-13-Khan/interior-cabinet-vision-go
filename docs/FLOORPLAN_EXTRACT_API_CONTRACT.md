# cabinet-floorplan API contract

Contract for Cabinet (and other clients) integrating 2D plan → editable topology → optional mesh preview.

Base URL (local): `http://127.0.0.1:8080`  
Base URL (Render demo): `https://cabinet-floorplan.onrender.com` (or your Render service)

CORS: `Access-Control-Allow-Origin: *`  
Upload/body limit: **16MB**  
Auth: **none** (do not put secrets in Vite; treat public URLs as demos)

Error envelope (all JSON errors):

```json
{ "error": "<human-readable message>" }
```

Schema version for single-floor extract remains **`"1.0"`** (additive fields only; no v2 bump).  
Live schema: `GET /schema/v1` → `schemas/polygon_v1.json`.

---

## Authority and ownership (Cabinet)

| Stage | Owner | Notes |
| --- | --- | --- |
| After `POST /extract` | **Extraction JSON** | Import **draft** only. Overlay + scale review happen here. |
| During import review | Extraction JSON via `POST /geometry/patch` | Patch keeps the sidecar JSON as SoT for the draft. |
| After user **Apply** | **`InteriorProject`** (Cabinet) | Committed design. One undoable InteriorProject update. |
| After Apply | Mesh exports | **Preview/download only** — never the editable scene graph. |

**Do not** treat “load GLB into Three.js” as the end of the product flow. GLB/OBJ/glTF are optional preview shells. Studio edits after Apply live on `InteriorProject`. Routing those edits back through `/geometry/patch` needs a separate round-trip mapping and conflict policy (out of scope for the first import slice).

Multi-floor: `POST /export/building` takes a `MultiFloorProject` that wraps **per-floor** extract JSON. It does **not** replace single-floor `POST /extract` or bump schema past `"1.0"`.

---

## Graph mapping (footprints → Studio topology)

Extract polygons are **footprint rings** (`outer` in meters), not Studio centerlines / directed wall-ID loops.

Wall footprints do **not** directly provide:

- wall **centerlines**
- **shared nodes** at corners / T-junctions
- Studio **room loops** (directed wall IDs)
- **opening → wall** attachments

### Reuse backend wall graph (with v1 geometry limits)

The sidecar already builds connectivity in `internal/graph`:

- `BuildWallGraph(walls)` / `BuildWallGraphOpts(walls, snapTol, minSegLen)`
- Snaps endpoints (`DefaultSnapTolM` ≈ 0.15 m)
- Emits `Node{ID,X,Y}` and `Edge{A,B,ThickM,LengthM,Role,SourceID}`
- Classifies `exterior` / `interior` / `dropped`

**Cabinet should reuse that algorithm** (port the rules, or call a future graph-export endpoint) — do **not** invent an independent frontend topology guesser.

**Known geometry limits in the wall graph (must be documented in the importer):**

1. **Axis-aligned AABB only** (`centerlineFromWall`). Centerline is taken from the wall footprint’s axis-aligned bounding box (`dx >= dy` → horizontal centerline, else vertical). **Diagonal / skewed walls become H or V.** They are not preserved as diagonal edges. Near-zero AABB thickness (`< 1e-6`) is bumped here so a centerline can be formed.
2. **150 mm minimum for all thin walls** (`BuildWallGraphOpts`). After centerline extraction, **every** edge with thickness below `DefaultMinWallThick` (**0.15 m / 150 mm**) is raised to that floor. This is the rule that thickens ordinary thin walls — not `centerlineFromWall` alone.

**v1 Apply policy (locked):**

| Geometry | Draft preview | Apply |
| --- | --- | --- |
| Axis-aligned walls (≥ ~150 mm thick after graph) that form a usable graph | Show graph overlay | Allowed |
| Diagonal / non-AABB-faithful walls | Keep original extract footprint in preview; show warning | **Block Apply** with explanation (unsupported wall orientation) |
| Walls thinner than the 150 mm floor that would be silently thickened | Show warning in preview | **Block Apply** unless user accepts thickening (or we later add a true centerline extractor) |
| Floating / `dropped` edges | Hide or mark dropped | Do not commit dropped edges into InteriorProject |

Do not silently rewrite diagonals into H/V on Apply. Preview may still call `/export/glb` (mesh can look fine) while Apply stays blocked until geometry is supported or the user corrects the draft.

### Room rings → Studio loops

`rooms[].outer` is a **footprint ring** (often along the **inner face** of walls). Studio loops reference **directed wall edge IDs** on the shared wall graph — they are not a 1:1 copy of `outer`.

**v1 mapping rules:**

1. Build the wall graph first (after collision-free IDs — see below).
2. For each room footprint, find wall edges whose centerline lies within snap distance of the room boundary (use half-thickness / snapTol, not centroid-only). Prefer edges whose role is `interior` or `exterior` and that are not `dropped`.
3. Order matched edges into a **directed loop** (walk shared nodes). Require a single closed cycle; if the walk fails, leave the room unmatched.
4. **Holes (Cabinet Apply rule):** if `rooms[].holes` is present, map each hole the same way to an inner wall-ID loop. Unmatched holes must **not** silently disappear — they change floor geometry and quantities. **Block Apply** until every hole is either mapped to a closed inner loop **or** explicitly removed by the user in import review. Preview may keep the outer loop and flag unmatched holes.
5. **Unmatched edges / gaps:** edges that never join a room loop stay on the wall graph but are **not** part of any Studio room. Surfaces this in preview. **Block Apply** if any room that had an extract footprint ends with no closed wall-ID loop (unless the room is explicitly dropped from import).
6. Do **not** treat `rooms[].outer` coordinates as the Studio loop itself. Persist: `room.id` → ordered `[wallEdgeId, …]` (with direction), plus optional retained footprint for overlay.

If extract `rooms` is empty, v1 may skip room-loop commit and import walls/openings only (product choice); do not invent rooms from the exterior cycle without an explicit later phase.

### Opening attachment (strengthened)

Nearest centroid alone is **ambiguous at corners** and T-junctions.

For each door/window footprint:

1. Compute opening segment orientation from the long axis of its `outer` AABB (same H/V limitation as walls in v1). Project the opening onto that axis to get an interval `[t0, t1]` (full opening length).
2. Candidate walls: same orientation (±parallel), whose centerline is within snap of the opening centroid / opening segment.
3. **Containment (Cabinet Apply rule — locked):** the host wall’s centerline interval must **fully contain** `[t0, t1]`. Locked end tolerance: **`OPENING_END_TOL_M = 0.025` (25 mm)** beyond either wall endpoint. Partial overlap / 50% / 50 mm substitutes are invalid.
4. Among walls that fully contain the opening under that tolerance, prefer the smallest perpendicular distance; then longest host wall if still tied.
5. If two or more candidates remain within a small score epsilon, or none fully contain the opening, mark **`attachment: ambiguous | unmatched`** — show in preview, **block Apply** until resolved.
6. **Endpoint overshoot (0 < overshoot ≤ 25 mm):** do **not** silently invent extra wall length. Either (a) **adjust** the opening interval inward to the host wall ends with **visible feedback** in the overlay (user sees the trim), then treat as matched, or (b) leave unmatched and **block Apply**. Pick (a) as the default importer behavior when a unique host is otherwise clear; if adjustment would change opening length by more than the tolerance semantics require, block instead.
7. **Manual wall selection** must pass the **same** full-containment check (including the 25 mm tolerance and overshoot policy). A user-picked wall that cannot contain the opening stays unmatched / blocked — manual pick is not a bypass.
8. On a clear match: parameterize along the edge; keep `opening.sill_m` / `height_m` / `swing` / `wall_height_m` from extract (after any visible inward trim from step 6).

### Deterministic fallback IDs (collision-safe)

Polygon `id` is **optional** in `polygon_v1`. **Once per draft**, before graph construction and before any `/geometry/patch` that relies on ids:


1. **Reserve** every non-empty existing id in that group (and preferably across all polygon groups to avoid cross-group clashes in Studio).
2. For each polygon with a missing/blank id, allocate the next free `{prefix}-{n}` that is **not** already reserved (`wall-0`, `wall-1`, …), starting `n` at 0 and skipping collisions (e.g. if `wall-0` already exists, an unnamed wall becomes `wall-1` or the next free).
3. **Persist** the assigned ids on the draft extraction JSON (local draft store and any patch `upsert`/`replace` bodies) so graph edges, opening attachments, and later patches keep stable references.
4. Never mint random UUIDs on every re-import of the same draft; re-running the allocator on an already-id’d draft must be a no-op for existing ids.

| Group | Prefix |
| --- | --- |
| walls | `wall-` |
| rooms | `room-` |
| doors | `door-` |
| windows | `window-` |
| stairs | `stair-` |

Optional: if two polygons somehow share the same non-empty id, treat as a draft error — rename the later one with the same allocator before graph build.

### Re-normalize after every draft mutation

After **any** scale change or polygon patch (`set_scale`, `upsert_polygon`, `delete_polygon`, `replace_polygons`, or local draft edits), the client must **re-run** the full normalization pipeline before Apply can succeed:

1. Collision-safe ID pass (no-op for existing ids)
2. Wall graph build
3. Room → directed wall-ID loops (including holes)
4. Opening attachment + containment checks
5. Geometry gates (diagonal, thin-wall acceptance, unmatched rooms/holes, ambiguous openings)

Apply must only read this freshly computed gate result — never an outdated draft snapshot from before the last patch/scale.

---

## Scale calibration (`POST /extract`)

Pass **either**:

- `pixel_scale` — meters per pixel (or per drawing unit). **mm SVG → `0.001`**
- **or** both `ref_length_m` and `ref_length_px` — calibrated as `pixel_scale = ref_length_m / ref_length_px`

Accepted on **query string or multipart form** fields (same names).

**Precedence:** if `pixel_scale` is set and valid, it **wins**. The reference-length pair is only used when `pixel_scale` is absent. Setting only one of `ref_length_m` / `ref_length_px` is a **400**.

Cabinet UX: always show overlay + scale confirm before Apply, even when the API returned a `pixel_scale`.

---

## `GET /healthz` · `GET /readyz`

**200**

```json
{
  "ok": true,
  "service": "cabinet-floorplan",
  "version": "0.5.0",
  "device": "cpu",
  "model": "raster2seq",
  "go": "go1.22+",
  "profile": "full",
  "worker_configured": false
}
```

---

## `GET /version`

**200**

```json
{
  "version": "0.5.0",
  "go": "go1.22+",
  "build": "docker"
}
```

---

## `POST /extract`

Multipart form: field `file` (or `image` / `svg`). Allowed: png, jpg, jpeg, gif, svg, dxf.

**Query / form (common)**

| Param | Example | Notes |
| --- | --- | --- |
| `pixel_scale` | `0.001` | meters per unit; **wins** over ref-length pair |
| `ref_length_m` | `3.2` | real-world length of a measured segment (meters) |
| `ref_length_px` | `640` | same segment in pixels / drawing units |
| `mode` | `raster2seq` \| `yytsi` \| `stub` | request mode (default `raster2seq`). Response `source.mode` may also be `vector` or `worker` |
| `profile` | `full` \| `lite` | lite skips enrich on draft raster |
| `cache` | `0` | disable content-hash cache when supported |

**cURL**

```bash
curl -sS -X POST \
  -F 'file=@plan.svg;type=image/svg+xml' \
  'https://HOST/extract?pixel_scale=0.001'
```

**200** — `ExtractionResult` (schema v1). Example that validates against `polygon_v1` (trusted vector path):

```json
{
  "schema_version": "1.0",
  "units": "meters",
  "pixel_scale": 0.001,
  "image_size": { "width": 11800, "height": 15100 },
  "source": {
    "filename": "lounge-plan.svg",
    "content_type": "image/svg+xml",
    "mode": "vector",
    "quality": "trusted_vector",
    "notes": "DXF/SVG vector ingest — preferred production path"
  },
  "polygons": {
    "rooms": [
      {
        "id": "Room2",
        "label": "Room2",
        "confidence": 0.95,
        "outer": [[0.2, 0.2], [4.2, 0.2], [4.2, 5.5], [0.2, 5.5]],
        "material_id": "floor.wood.default"
      }
    ],
    "walls": [
      {
        "id": "wall-0",
        "label": "wall",
        "confidence": 0.95,
        "outer": [[0, 0], [10.1, 0], [10.1, 0.2], [0, 0.2]],
        "material_id": "wall.paint.default"
      }
    ],
    "doors": [
      {
        "id": "door-0",
        "label": "door",
        "confidence": 0.95,
        "outer": [[4.175, 1.2], [4.325, 1.2], [4.325, 2.1], [4.175, 2.1]],
        "material_id": "door.wood.default",
        "opening": {
          "sill_m": 0,
          "height_m": 2.1,
          "swing": "left",
          "wall_height_m": 2.7
        }
      }
    ],
    "windows": [
      {
        "id": "window-0",
        "label": "window",
        "confidence": 0.95,
        "outer": [[0, 1.4], [0.2, 1.4], [0.2, 3.0], [0, 3.0]],
        "material_id": "window.glass.default",
        "opening": {
          "sill_m": 0.9,
          "height_m": 1.2,
          "swing": "none",
          "wall_height_m": 2.7
        }
      }
    ],
    "stairs": [
      {
        "id": "StairRoom1",
        "label": "stair",
        "confidence": 0.95,
        "outer": [[7.65, 10.2], [8.85, 10.2], [8.85, 13.7], [7.65, 13.7]]
      }
    ]
  },
  "defaults": {
    "wall_height_m": 2.7,
    "materials": {
      "wall": "wall.paint.default",
      "floor": "floor.wood.default",
      "door": "door.wood.default",
      "window": "window.glass.default"
    }
  },
  "furniture_anchors": []
}
```

`source.mode` values the schema accepts: `stub` | `yytsi` | `raster2seq` | `vector` | `worker`.  
`source.quality` (optional): `trusted_vector` | `draft_raster_cv` | `stub`.

### Extract errors

**400** missing file

```json
{ "error": "missing multipart file field (use file, image, or svg)" }
```

**400** bad type

```json
{ "error": "invalid file type; allowed: png, jpg, jpeg, gif, svg, dxf" }
```

**400** bad mode

```json
{ "error": "unknown mode; use raster2seq (default), yytsi, or stub" }
```

**400** bad scale

```json
{ "error": "pixel_scale must be a positive number (meters per pixel)" }
```

```json
{ "error": "ref_length_m and ref_length_px must both be set for scale calibration" }
```

**413**

```json
{ "error": "upload exceeds 16MB limit" }
```

**422** unsupported input (rare)

```json
{ "error": "unsupported plan: <reason>" }
```

---

## `POST /export/glb` · `/export/obj` · `/export/gltf` · `/export/mesh`

Body: raw **`ExtractionResult` JSON** (not the SVG).  
Optional multipart field `extraction` / `file` with the same JSON.

**These endpoints are preview/download only.** They are not the editable Cabinet scene graph and must not replace `InteriorProject` after Apply.

**Query (product look)**

| Param | Default | Notes |
| --- | --- | --- |
| `strict` | `1` | `0` if wall graph has no closed exterior |
| `props` | on | `0` to disable furniture |
| `floors` | on | room floors |
| `doors` | on | door leaves |
| `frames` | on | jamb/threshold |
| `glass` | on | window panes |
| `trim` | on | baseboards |
| `union` | on | wall union |
| `ceilings` | **off** | `ceilings=1` to enable |
| `voidh` | **off** | `voidh=1` double-height voids |
| `format` | (mesh only) | `obj` \| `gltf` \| `glb` |

**cURL**

```bash
curl -sS -X POST -H 'Content-Type: application/json' \
  --data-binary @extract.json \
  'https://HOST/export/glb?strict=0&props=1&floors=1&doors=1&frames=1&glass=1&trim=1&union=1' \
  -o floorplan.glb
```

### Success

| Endpoint | Status | Content-Type | Body |
| --- | --- | --- | --- |
| `/export/glb` | 200 | `model/gltf-binary` | binary GLB (magic `glTF`) |
| `/export/gltf` | 200 | `model/gltf+json` | glTF JSON |
| `/export/obj` | 200 | `model/obj` | Wavefront OBJ text |
| `/export/mesh?format=glb` | 200 | same as format | |

Headers: `Content-Disposition: attachment; filename="floorplan.glb"` (or `.obj` / `.gltf`).

### Export errors

**400** SVG posted by mistake / bad JSON

```json
{ "error": "invalid ExtractionResult JSON: invalid character '<' looking for beginning of value" }
```

**400** empty body

```json
{ "error": "empty body; send ExtractionResult JSON" }
```

**413**

```json
{ "error": "body exceeds 16MB limit" }
```

**422** strict wall graph (default)

```json
{ "error": "wall graph: no closed exterior loop; pass ?strict=0 for draft export" }
```

---

## `POST /export/building`

Body: `MultiFloorProject` JSON (still schema `"1.0"` per floor extract). Query: `mode=stack|explode|cutaway` (default `stack`). Same mesh flags as `/export/glb`. Preview/download only.

```json
{
  "schema_version": "1.0",
  "floors": [
    {
      "id": "L0",
      "name": "Ground",
      "elevation_m": 0,
      "extract": { "schema_version": "1.0", "units": "meters", "polygons": { "rooms": [], "walls": [], "doors": [], "windows": [] } }
    }
  ]
}
```

---

## `POST /geometry/patch`

Applies ordered ops to an extraction **draft** and returns the updated `ExtractionResult` JSON.  
Optional `?enrich=true` (or body `"enrich": true`) re-runs Phase 3 enrichment after ops (default **false**).

Use during **import review** before Apply. After Apply, InteriorProject owns the design.

### `PatchRequest`

```json
{
  "extraction": { "schema_version": "1.0", "units": "meters", "polygons": { "rooms": [], "walls": [], "doors": [], "windows": [], "stairs": [] } },
  "ops": [],
  "enrich": false
}
```

| Field | Type | Notes |
| --- | --- | --- |
| `extraction` | `ExtractionResult` | Required base document |
| `ops` | `Op[]` | Applied in order; may be `[]` |
| `enrich` | bool | Optional; also `?enrich=true` |

### `Op` kinds

| `kind` | Required fields | Effect |
| --- | --- | --- |
| `set_scale` | `pixel_scale` (> 0) | Sets result `pixel_scale`. If `rescale_coords: true`, multiplies all rings/anchors by `new/old` (requires existing positive scale). |
| `upsert_polygon` | `group`, `polygon` | Replace polygon with same `id` in group, or append |
| `delete_polygon` | `group`, `id` | Remove polygon by id (**400** if missing) |
| `replace_polygons` | `group`, `polygons` | Replace entire group array (`polygons` may be `[]`) |
| `set_defaults` | `defaults` | Merge `wall_height_m` / `materials` into result defaults |

`group`: `walls` | `rooms` | `doors` | `windows` | `stairs`.

**Example**

```json
{
  "extraction": {
    "schema_version": "1.0",
    "units": "meters",
    "pixel_scale": 0.01,
    "polygons": {
      "rooms": [],
      "walls": [
        {
          "id": "w1",
          "label": "wall",
          "confidence": 0.9,
          "outer": [[0, 0], [4, 0], [4, 0.2], [0, 0.2]]
        }
      ],
      "doors": [],
      "windows": [],
      "stairs": []
    }
  },
  "ops": [
    { "kind": "delete_polygon", "group": "walls", "id": "w1" },
    {
      "kind": "set_defaults",
      "defaults": { "wall_height_m": 3.1, "materials": { "wall": "wall.paint.default" } }
    },
    { "kind": "set_scale", "pixel_scale": 0.001, "rescale_coords": false }
  ]
}
```

**200** — updated `ExtractionResult`.

### Patch errors

**400** empty body

```json
{ "error": "empty body; send PatchRequest JSON" }
```

**400** bad JSON / unknown op / missing id

```json
{ "error": "invalid PatchRequest JSON: ..." }
```

```json
{ "error": "op[0] delete_polygon: polygon id \"missing\" not found in walls" }
```

```json
{ "error": "op[0] split_wall: unknown kind \"split_wall\"" }
```

**413**

```json
{ "error": "body exceeds 16MB limit" }
```

---

## `GET /schema/v1`

**200** — JSON Schema (`polygon_v1.json`), including `source.mode` `vector`|`worker` and `quality`/`notes`.

**500**

```json
{ "error": "schema not found" }
```

---

## Recommended Cabinet client flow

1. `GET /readyz` until `ok: true`
2. `POST /extract` with file + `pixel_scale` **or** `ref_length_m`+`ref_length_px` (`pixel_scale` wins if both)
3. Validate response against `GET /schema/v1`
4. Mint **collision-free** fallback IDs once; persist on the draft
5. Build wall graph (reuse `BuildWallGraph` rules); map room footprints → directed wall-ID loops (holes must map or be removed); attach openings with orientation + **full containment** on host wall (flag ambiguous)
6. Overlay extract on plan → **scale confirm** + geometry warnings (diagonal / thin / unmatched holes / ambiguous openings)
7. Optional: `POST /geometry/patch` while still in import review (JSON remains draft SoT; keep assigned ids); **re-run normalization + all geometry gates after every scale or polygon patch**
8. **Apply only when geometry gates pass** → one undoable `InteriorProject` update (committed design). Client + draft preview may ship first; resolve these geometry rules before enabling Apply.
9. Optional: `POST /export/glb` for preview mesh only — not the editable graph (preview allowed even when Apply is blocked)
10. Save/reload, undo, failed import, estimate/freeze checks on InteriorProject

Always check `Content-Type` on export: if you asked for GLB and get `application/json`, parse `{ "error": ... }` instead of treating bytes as a mesh.
