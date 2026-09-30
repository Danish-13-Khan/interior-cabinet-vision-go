# Model import and project saving roadmap

**Status:** Implemented on `feat/model-import-and-autosave` — 2026-09-30. See §0.
**Scope:** Importing 3D objects (GLB today; FBX and OBJ next) and keeping a
project safe while it is being created from nothing (autosave, recovery,
project file, desktop save).
**Relationship to other docs:** DWG/DXF floor-plan tracing stays as described
in [`DWG_ROOM_DESIGN_ROADMAP.md`](DWG_ROOM_DESIGN_ROADMAP.md); DWG export stays
as evaluated in [`DWG_EXPORT_EVAL.md`](DWG_EXPORT_EVAL.md). This roadmap only
changes how the DWG underlay is **stored** (Phase 1 and Phase 5).

---

## 0. Delivery status (2026-09-30)

All seven phases are built. Beyond the plan below, review rounds added: an
async unsaved-changes dialog for Finder opens, a production CSP, a trusted-path
allow-list for the desktop file commands, a modal that pauses a blocked tab,
per-project delete tombstones, and a pack budget equal to the open budget.

| Phase | State | Notes |
| --- | --- | --- |
| 1 Draft autosave / recovery | Done | Web opens the latest draft (notice when the pending marker was set); desktop asks per file. Tab lock pauses the second tab behind a modal. |
| 2 Import pipeline | Done | Worker with main-thread fallback only when the worker itself fails; 60 s+ timeout; Cancel. 256 px thumbnail is rendered on the main thread (not the worker). Z-up choice in the dialog. |
| 3 FBX and OBJ | Done | MTL and selected textures applied; missing or unsupported textures are warnings. |
| 4 Optimize | Done | meshopt only, `ALL_EXTENSIONS`, 2048 px textures (WebP, else PNG/JPEG by source). |
| 5 `.cabinet` zip | Done | 400 MB / 400-entry budget on save and open. |
| 6 Desktop save | Done | Serialized atomic writes with unique temp names; 3 backups in app data; a failed backup is logged, not a failed save. |
| 7 Snapshots | Done | Per-project history with preview (counts and changes) and a "before restore" snapshot. |

**Verified in the browser (dev server and a CSP'd production web build):**
autosave/restore, recovery notice, tab lock and Take over, OBJ/GLB/Draco
imports, nested transforms, unit guesses, Z-up, texture orientation, missing
textures, thumbnail, version preview and restore, CSP directives. Phase 4
render check: 20 imported sofas add ~0.7 ms per frame (0.69 → 1.40 ms,
653 draw calls, 247k triangles) on the development Mac.

**Not yet verified:** clicking through the native desktop app (Finder open
with unsaved work, Save As to a new folder, recent files after restart, PDF
package export, double Cmd+S); the unit suite and the Playwright specs
(including `tests/e2e/phase-1-draft-autosave.spec.ts`) after the last changes.

**Known limits:**
- After upgrading, recent files opened before the trusted-path list existed
  must be opened or saved once through a dialog.
- Saving into hidden folders, `~/Library/Application Support`,
  `~/Library/Containers` and system folders is refused on purpose.
- A re-run import (unit or axis change) leaves its previous model blob until
  the 30-day prune.
- `src/hooks/useLivingRoomPlanEditor.ts` is ~930 lines (already over the
  200-line rule on `main`); not split here.

## 1. Decisions

| # | Decision | Consequence |
| --- | --- | --- |
| D1 | **Convert once, render one format.** FBX and OBJ are converted to an optimized GLB at import time. | The 3D view, blob store, project file and GLB export keep a single model path. No FBX/OBJ loader runs when a project opens. |
| D2 | **Import work runs in a Web Worker** — subject to the Phase 2 step 0 spike. | Parsing a 20 MB FBX never freezes the editor. If the spike fails, textures load on the main thread and only geometry work stays in the worker. |
| D3 | **Newly imported objects use their real size.** | Dimensions come from the model's bounding box after unit conversion. Objects already saved with the 1000 mm placeholder are **left as they are**. |
| D4 | **The working draft lives in IndexedDB**, not localStorage. | No 5 MB ceiling; only the edited project is written. Startup becomes async. |
| D5 | **The project file becomes a zip (`.cabinet`).** | Binaries are stored raw, not base64 inside JSON. Old JSON project files still open. |
| D6 | **`.max` is not supported.** | See §3. Deferred; not part of this roadmap. |
| D7 | **Imported models are compressed with meshopt, never Draco.** | drei loads the Draco decoder from `gstatic.com`, which fails offline in the desktop app. |

## 2. Where we are (2026-09-29)

| Area | Today | File |
| --- | --- | --- |
| 3D object import | `.glb` only (+ sidecar PNG/JPG/WebP textures), 25 MB cap on the raw file | `src/domain/livingRoom/assetImportPipeline.ts` |
| Imported size | Always `1000 × 1000 × 1000 mm` | `assetImportPipeline.ts` (`readImportedGlb`) |
| Asset id | `file:<name>-<size>` — not stable (renaming the file changes it) | `assetImportPipeline.ts` |
| Blob storage | Bytes keyed by SHA-256 (`storeAssetBlob`), so identical files are **already stored once**; referenced as `idb:` | `src/domain/livingRoom/storedAssets/refs.ts`, `src/platform/assetBlobStore.ts` |
| Blob cleanup | `pruneStoredAssets` deletes blobs unreferenced by the current document and localStorage documents, after a 30-day grace | `storedAssets/prune.ts`, `src/hooks/useStoredAssetCleanup.ts` |
| Scene loading | drei `useGLTF`, which already enables meshopt **and** Draco (decoder from `gstatic.com`) by default | `src/components/livingRoomScene/AssetBackedGlbContent.tsx` |
| Per-placement render | `gltf.scene.clone(true)` shares **geometry**; `applyGlbSlotMaterials` builds new `MeshPhysicalMaterial`s per placement (materials **not** shared); `normalizeGlbFloorOrigin` moves the origin to the floor and measures size at render time | `AssetBackedGlbContent.tsx`, `src/rendering/materials/applyGlbSlotMaterials.ts`, `src/rendering/loaders/normalizeGlbFloorOrigin.ts` |
| Floor-plan import | `.dwg` (LibreDWG WASM) and `.dxf` (ASCII parser) as a 2D tracing underlay; PNG/JPG/PDF as image underlay | `src/domain/livingRoom/dwg*.ts`, `planUnderlay.ts` |
| DWG underlay storage | `preview` (SVG path data; validator allows 200k paths / 50 MB of path text) **and** the derived `dataUrl` are both kept inside the project JSON | `src/domain/livingRoom/dwgSource.ts` |
| Autosave | Whole saved-project list (up to 16) JSON-stringified into one localStorage key; read synchronously on first render | `src/domain/projectBrowserStorage.ts`, `src/hooks/useSavedProjectBrowser.ts`, `useSavedProjectsPersistence.ts` |
| Project file | JSON text; model bytes embedded as data | `src/platform/projectFileAssets.ts`, `src/hooks/portableProjectFile.ts` |
| Desktop file I/O | `load_project_file` reads text only (`read_to_string`); `save_binary_file` takes base64 over IPC; both saves call `fs::write` directly | `src-tauri/src/lib.rs` |
| Browser file open | `pickBrowserFile` → `file.text()` | `src/platform/desktopFiles.ts` |

Main risks today: a large DWG underlay or several projects can push autosave
over the localStorage quota; a crash loses everything since the last manual
file save; imported models appear at the wrong size.

## 3. Formats

| Format | Use | Support | How |
| --- | --- | --- | --- |
| GLB / glTF | 3D object | Yes (today) | Also passes through the Phase 4 optimizer. |
| FBX | 3D object | **Phase 3** | `FBXLoader` → normalize → `GLTFExporter`. |
| OBJ (+ MTL) | 3D object | **Phase 3** | `OBJLoader` + `MTLLoader`; user picks `.obj`, `.mtl` and textures together. |
| DAE, STL, 3DS, PLY | 3D object | Optional, Phase 3 | Loaders ship with three; same pipeline. |
| DWG / DXF | 2D floor plan | Yes (today) | Unchanged. Storage changes in Phases 1 and 5. |
| DWG 3D solids | 3D object | No | LibreDWG does not decode ACIS solids. Out of scope. |
| MAX | 3D object | **No (deferred)** | Closed Autodesk format with no parser outside 3ds Max. If users ask, show: “Export from 3ds Max as FBX or glTF.” |

## 4. Known technical facts (checked 2026-09-29, three 0.185)

- **Loaders in a worker.** `FBXLoader` and `MTLLoader` load textures through
  `TextureLoader` → `ImageLoader`, which creates an `<img>`; this fails in a
  worker. `GLTFExporter` is fine: it falls back to `OffscreenCanvas` when
  `document` is missing.
- **FBX up-axis and units.** `FBXLoader` already handles Z-up by rotating the
  **root node** (vertices unchanged). It does **not** apply `UnitScaleFactor`;
  it only stores it in `sceneGraph.userData.unitScaleFactor`. So for FBX: do
  not rotate again, do apply the unit scale, and bake the root transform into
  the geometry before measuring the bounding box.
- **Safari / WKWebView** (the Tauri macOS webview): WebGL on `OffscreenCanvas`
  needs recent Safari; canvas WebP encoding is believed to silently return PNG.
  **Unverified — settle in the Phase 2 spike.** Plan a JPEG/PNG fallback
  regardless.
- **Meshopt decoding in the scene** is already on through drei `useGLTF`.
- **Texture orientation.** `GLTFExporter` honours `texture.flipY` when it
  writes images (`processImage` flips on the canvas), so exported GLBs should
  be correct. WebGL ignores `UNPACK_FLIP_Y` for `ImageBitmap`, so a thumbnail
  rendered in the worker from `ImageBitmap` textures can come out upside down.
  Verify both in the spike.

## 5. Identity, units and cleanup rules

**Asset id vs storage key.**
- *Storage key* (unchanged): SHA-256 of the stored bytes.
- *Asset id* (new): `file:<sha256 of every input file + import settings>`.
  Input files = all files the user selected for this import (for OBJ: the
  `.obj`, the `.mtl` and every texture; for FBX/GLB: the model and any
  sidecar images), hashed individually, sorted by file name, then hashed
  together. Import settings = `{ unit, upAxis, optimizerVersion }`. Swapping
  one texture gives a new id; the same set with the same settings always gives
  the same id.
- Changing the unit in the import dialog **re-runs the pipeline** (new asset,
  new id). Resizing a placed object later only changes the placement.

**Units.** glTF = metres. FBX = `UnitScaleFactor` (cm per unit; default 1 cm).
OBJ has no units. Guess in this order and **always ask for confirmation**:

1. **Exporter comment** at the top of the `.obj`. `# Blender` → metres (Blender
   writes metres at its default scale). Other labels (3ds Max, SketchUp, Rhino,
   Maya) identify the tool but **not** the unit — each exports in the scene or
   user-chosen unit — so they only pick the fallback default: SketchUp →
   inches, Maya → centimetres, others → size table.
2. **Size table** on the largest bounding-box side `s` (fallback):

| Largest side `s` | Guess |
| --- | --- |
| `s < 10` | metres |
| `10 ≤ s < 30` | feet |
| `30 ≤ s < 600` | centimetres |
| `s ≥ 600` | millimetres |

`30–600` is genuinely ambiguous between cm and inches (a 120 cm table and a
72 in sofa both fall there); the table picks cm, the more common case. The
confirmation step shows the resulting size **under each candidate unit**
(“1200 mm if cm · 3048 mm if inches”) so the wrong guess is obvious. The unit
picker offers mm, cm, m, in, ft.

**Blob cleanup.** `pruneStoredAssets` must count as “in use” every document in:
the current editor, the saved-project index, every draft (Phase 1) and every
snapshot (Phase 7). A phase that adds a new place documents live must extend
this set in the same change.

---

## Phase 1 — Draft autosave, recovery, saved state

**Goal:** Work created from nothing survives a closed tab, a crash or a
reload, with no storage-quota errors.

1. New IndexedDB store `drafts` (same DB, version bump): one record per
   project id — `{ id, document, dwgPreviews, updatedAt, schemaVersion, lastFileSaveAt }`.
   This is the **only** draft store on both web and desktop (WKWebView keeps
   IndexedDB inside the app's data folder).
2. Save ~1.5 s after the last edit, and immediately on `visibilitychange` →
   hidden and `pagehide`. Unsaved-edit tracking uses a synchronous
   localStorage marker `cabinet-draft-pending:<id>`, set on the first edit
   after a completed save and cleared when the IndexedDB write commits. (It
   cannot live in the IndexedDB record: that write is async and can be lost
   exactly when it matters.)
3. The localStorage list shrinks to an index (`id, name, updatedAt,
   thumbnailKey`). Existing entries migrate on first load (reuse the
   `stashEmbeddedAssets` pattern). **Ships in the same change as step 10** —
   after migration `localStorageDocuments()` finds no documents, so without
   step 10 cleanup would delete models of saved projects that aren't open
   once they pass the 30-day grace.
4. DWG underlay: store `preview` in the draft record (`dwgPreviews`, keyed by
   underlay id); **stop saving `dataUrl`** and rebuild it on load with
   `dwgPreviewDataUrl(preview, hiddenLayers)`. Old projects with inline
   previews still load.
5. **Recovery behaviour per platform:**
   - *Web:* the draft is the only copy, so there is nothing to choose between.
     Always open the latest draft without asking. If the pending marker was
     still set, show a short notice: **Recovered from autosave at 4:58 PM**
     (the draft's `updatedAt`). Edits after that time were never written and
     cannot be recovered; the notice says the time so this is honest.
   - *Desktop:* for a project with a file path, when the draft's `updatedAt`
     is newer than `lastFileSaveAt`, ask **Restore unsaved changes from
     <time>?** — Restore (open the draft) / Discard (open the file). Here the
     two really differ.
6. Startup: `useSavedProjectBrowser` loads the index and drafts async; show
   a short loading state instead of reading localStorage in `useState`.
7. **Multiple tabs:** take a Web Lock (`navigator.locks`) named after the
   project id while it is open. A second tab opening the same project is
   blocked with **Open in another tab** and a **Take over** button. Take over
   tells the first tab (`BroadcastChannel`) to flush, release the lock, stop
   saving and show “Opened in another tab”; the second tab then acquires the
   lock and loads the draft. No read-only mode is built. Fallback where Web
   Locks are missing: `BroadcastChannel` ping only.
8. Status dock shows **Saved · just now** / **Saving…** / **Unsaved changes**.
9. Call `navigator.storage.persist()` once on the web build.
10. Add drafts to the `pruneStoredAssets` in-use set (§5), replacing
    `localStorageDocuments()`. Same change as step 3.

**Tests:** unit — localStorage → index + drafts migration; dataUrl rebuilt
from preview matches the old stored value; recovery rule per platform; prune
keeps blobs referenced only by a draft **after** migration; pending marker set
and cleared around a save. E2E — draw a room, import a GLB and a DWG, wait for
**Saved**, close the tab, reopen → everything back without a prompt; second
tab on the same project → blocked → Take over works.

**Done when:** the E2E passes, and a project with a large DWG no longer
raises the “too large for browser autosave” warning.

## Phase 2 — Import pipeline

**Goal:** One import pipeline that every format uses, off the main thread
where possible.

0. **Spike (1–2 days):** in a worker, load an FBX with embedded textures and
   an OBJ+MTL with external textures, using `ImageBitmapLoader` (or a patched
   `TextureLoader.load` that decodes with `createImageBitmap`). Export to GLB
   with `GLTFExporter`. Also check in WKWebView: WebGL on `OffscreenCanvas`
   (for thumbnails) and `convertToBlob({ type: "image/webp" })`.
   Checklist item: **texture orientation is correct in the exported GLB and
   in the worker thumbnail** (see §4; fix with `imageOrientation: "flipY"`
   on `createImageBitmap` if needed).
   **Outcome decides D2:** pass → everything in the worker; fail → textures on
   the main thread, geometry in the worker.
1. Worker receives `File[]` + import settings, returns
   `{ glb: ArrayBuffer, dimensions, thumbnail, warnings, sourceHash }`.
2. Normalize every model: bake root transforms into geometry → convert to
   millimetres (§5) → Z-up → Y-up only where the loader did not already →
   origin to bottom-centre → dimensions = bounding box size.
   The origin step duplicates `normalizeGlbFloorOrigin`, which runs at render
   time. **Keep the render-time version**: it still covers packaged catalog
   GLBs and models imported before this pipeline existed.
3. Asset id as defined in §5 (stable identity, not storage savings — bytes
   are already deduplicated).
4. 256 px thumbnail: worker `OffscreenCanvas` if the spike passed, otherwise
   render on the main thread. Encode WebP, fall back to JPEG.
5. The import dialog shows detected size and unit; changing the unit re-runs
   the pipeline.
6. GLB goes through this pipeline first, before new formats arrive.

**Module sketch** (each file ≤ 200 lines):

```
src/workers/modelImport/
  modelImport.worker.ts   message handling only
  protocol.ts             request/response types
  loaders/gltf.ts
  loaders/fbx.ts          Phase 3
  loaders/obj.ts          Phase 3 (OBJ + MTL + texture matching)
  loaders/textures.ts     ImageBitmap-based texture loading
  normalize.ts            bake transforms, units, up-axis, origin, bbox
  units.ts                unit table + OBJ guess
  identity.ts             source hash + settings → asset id
  exportGlb.ts            GLTFExporter wrapper
  optimize.ts             Phase 4
  thumbnail.ts            OffscreenCanvas render + encode fallback
src/domain/livingRoom/modelImportClient.ts   main-thread wrapper, replaces readImportedGlb
```

**Tests:** unit — unit table incl. inches/feet boundaries; asset id stable for
same source + settings, different when unit changes; normalize puts a
fixture's bbox minimum at y = 0. E2E — import a 2 m GLB → ~2000 mm wide, on
the floor.

**Done when:** a GLB of a 2 m sofa lands at about 2000 mm wide, on the floor,
and the editor stays responsive while importing.

## Phase 3 — FBX and OBJ

1. File picker accepts `.glb,.gltf,.fbx,.obj,.mtl` plus images.
2. FBX: apply `userData.unitScaleFactor`; do not re-rotate (§4). Embedded
   textures come through; referenced external textures are matched by file
   name against the images the user selected.
3. OBJ: `.mtl` and textures matched by the names referenced in the files;
   missing textures are warnings, not errors.
4. Messages for: unsupported file, `.max` (export hint), animated or skinned
   FBX (imported as the static first frame), missing textures.
5. Replace the “Convert FBX to GLB first” error in `readImportedGlb`.

**Tests:** unit — FBX fixture in cm lands at the right mm size and is not
double-rotated; OBJ texture name matching. E2E — FBX and OBJ+MTL import,
save to file, reopen.

**Done when:** a furniture FBX (cm) and an OBJ+MTL+textures set both import at
the right size with textures and survive save/reopen.

## Phase 4 — Optimize for performance

Runs in the worker after normalization, using `@gltf-transform` and
`meshoptimizer`.

1. `dedup`, `prune`, `weld`, `instance`, `flatten`.
2. `simplify` above a triangle budget (default 200k); show before/after
   triangle counts.
3. Textures: resize to at most 2048 px; WebP where encoding works, else JPEG
   (per the spike). KTX2 later.
4. `EXT_meshopt_compression` only (D7). The scene needs no change — drei
   `useGLTF` already decodes meshopt. Also call `useGLTF.setDecoderPath` with
   a locally bundled Draco decoder, so user GLBs that arrive Draco-compressed
   still open offline.
5. The 25 MB limit applies to the **optimized** GLB; raw input up to ~150 MB
   is accepted.
6. Repeated placements already share **geometry** (`useGLTF` cache +
   `clone(true)`). **Materials are not shared**: `applyGlbSlotMaterials`
   builds new `MeshPhysicalMaterial`s per placement. Optional follow-up: cache
   built materials by `(asset, slot, material id, render mode)` so identical
   placements reuse them — only if profiling shows material count or shader
   compile time matters.

**Tests:** unit — optimizer output is smaller than input and keeps the bbox;
output contains no `KHR_draco_mesh_compression`. Render QA — 20 imported
objects stay at interactive frame rates.

**Done when:** a typical FBX sofa stores 5–20× smaller than the raw file and
the render QA scene holds its frame rate.

## Phase 5 — `.cabinet` zip project file

1. Layout (built with `fflate`):
   ```
   project.json          document with idb: refs rewritten to relative paths
   models/<sha256>.glb
   textures/<sha256>.<ext>
   underlays/<id>.json   DWG preview path data
   thumbnail.png
   ```
2. **File type:** extension `.cabinet`, MIME `application/vnd.cabinet-studio+zip`;
   open/save dialog filters list `.cabinet` first and `.json` for older
   files; browser downloads use the same MIME.
   Tauri `fileAssociations` in `tauri.conf.json` only makes the OS hand the
   file to the app. The app must also **receive** it:
   - macOS: handle `RunEvent::Opened { urls }` in the `run` callback
     (covers both cold launch and already running);
   - Windows/Linux: read the path from command-line arguments on launch, and
     add `tauri-plugin-single-instance` so a second double-click forwards the
     path to the running window instead of starting another app.
3. **Desktop binary I/O (Rust):**
   - `load_project_bytes` returns `tauri::ipc::Response::new(bytes)`. A plain
     `Vec<u8>` return is serialized as a JSON array of numbers — worse than
     base64.
   - The save command takes raw bytes (`tauri::ipc::Request`, body
     `InvokeBody::Raw`; path passed in a header) instead of base64, so
     25–100 MB files are not inflated.
4. **Browser open:** `pickBrowserFile` branches on extension —
   `.cabinet` → `file.arrayBuffer()`, `.json` → `file.text()`.
5. Opening a `.cabinet` puts binaries into the blob store and the document
   into a draft. Old JSON files open unchanged (`parseProjectFileText`).
6. Missing-model warnings keep working (`missingStoredAssetsMessage`).
7. Raise or remove `assertPortableProjectFileByteLimit` for the zip path.

**Tests:** unit — zip round-trip preserves document and every blob; old JSON
file opens; missing blob reported. Rust — binary read/write round-trip.
E2E — save and reopen a project with 3 imported models and a DWG underlay.

**Done when:** that project opens identically on another machine or browser
and is noticeably smaller than the equivalent JSON file.

## Phase 6 — Desktop (Tauri) save workflow

1. **Cmd+S** saves to the current path, **Cmd+Shift+S** is Save As; the
   window title shows `•` when there are unsaved changes.
2. **Safe write in Rust** (`lib.rs`, not the frontend — `fs:default` does
   not allow renaming arbitrary user paths): write `<name>.cabinet.tmp` in the
   same folder, call `File::sync_all()` on it, then `fs::rename` over the
   original (replaces atomically on macOS/Linux; replaces an existing file on
   Windows). Without `sync_all` a power cut can still leave an empty file.
3. **Backups in the app data folder**, not next to the user's file:
   `<appData>/backups/<projectId>/1..3.cabinet`, rotated on each save.
4. Drafts stay in IndexedDB (Phase 1) — there is no second draft store in the
   app data folder.
5. Recent files list (`recentFiles.ts`) points at `.cabinet` paths.

**Tests:** Rust — interrupted write leaves the original intact; backup
rotation keeps 3. Manual — force-quit during save, reopen, file intact.

**Done when:** force-quitting during a save never corrupts the file, and a
bad save can be rolled back from a backup.

## Phase 7 — Snapshots and later work

1. Snapshot every 10 minutes of active editing and at milestones (room
   closed, first cabinet placed, render made); keep the last 20 per project.
2. **Version history** list in the project menu: preview and restore.
3. Every stored document carries `schemaVersion` with forward migrations.
4. Add snapshots to the `pruneStoredAssets` in-use set (§5).
5. *Optional:* `InstancedMesh` for assets placed many times. It makes
   selecting and editing single copies harder, so only if profiling shows a
   need.

**Tests:** unit — snapshot restore; prune keeps blobs used only by a
snapshot; migration from each older `schemaVersion`.

---

## 6. Out of scope

- `.max` import (D6).
- 3D solids from DWG; DWG/DXF export (see `DWG_EXPORT_EVAL.md`).
- Cloud sync and sharing (see the SaaS notes). The Phase 1 draft store is the
  local cache any later sync builds on.
- FBX animation playback.
- Resizing objects already saved with the 1000 mm placeholder (D3).

## 7. New dependencies

| Package | Phase | License | Why |
| --- | --- | --- | --- |
| `@gltf-transform/core`, `/functions`, `/extensions` | 4 | MIT | GLB optimization |
| `meshoptimizer` | 4 | MIT | Simplify + meshopt compression |
| `fflate` | 5 | MIT | Zip project file |

FBX, OBJ, MTL, DAE, STL loaders and `GLTFExporter` already ship with
`three`; meshopt decoding already ships with drei. All MIT, compatible with
this GPLv3 repo.

## 8. Order

Phase 1 first (safety, smallest change). Then Phase 2 step 0 (spike) →
2 → 3 → 4 (import). Then 5 → 6 (file). Then 7.
