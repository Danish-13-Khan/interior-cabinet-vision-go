# Phase M — Post-Room 3D Editing and Materials

**Document role:** Active roadmap for editable 3D after room create  
**Product relationship:** Companion to [Cabinet Studio Product and Development Book](./CABINET_STUDIO_PRODUCT_BOOK.md) and successor to H–L in [Interior Design Tool Roadmap](./INTERIOR_DESIGN_TOOL_ROADMAP.md)  
**QA feedback date:** 2026-09-06  
**Baseline date:** 2026-09-06  
**Revised:** 2026-09-06 (command-set contract + pre-build clarifications)  
**Naming note:** Not “Phase 7” — that ID is already used in archive (Render Studio / V2 hardening). This program is **Phase M**.

Status vocabulary: `CURRENT` · `NEXT` · `LATER` · `EXCLUDED` · `DONE`

---

## 1. Source feedback (2026-09-06)

Consolidated QA + video feedback that this phase answers:

| # | Feedback | Maps to |
| --- | --- | --- |
| 1 | Perspective and isometric view icons not available | M1 |
| 2 | Material importing / textures to be done | M4 |
| 3 | One wall hiding on mouse right-click | M2 |
| 4 | Material importing from other websites | M6 |
| 5 | Colour shades as an option to be seen | M3 |
| 6 | After creating rooms, panelling and wonder walls to be flexible | M5 |

**North star:** After a room exists, the designer can fully edit the 3D scene — camera, wall visibility, materials/colours, and decorative panels — without rebuilding the room.

---

## 2. Product layers (non-negotiable)

Keep three separate layers so the room stays flexible:

| Layer | Owns | Examples |
| --- | --- | --- |
| **Room structure** | Topology and openings | Walls, floor, ceiling, doors, windows |
| **Design objects** | Placed interiors | Furniture, cabinets, panels, feature / wonder walls |
| **Appearance** | Look only | Materials, textures, colours, finishes |

A decorative / feature panel is a **design object attached to a structural wall**. Editing it must not mutate wall geometry.

### 2.1 Panel attachment model (M5 contract)

Exact property names (lock during M5 planning; do not invent synonyms):

| Property | Type intent | Purpose |
| --- | --- | --- |
| `wallId` | string | Structural wall the panel is attached to |
| `alongMm` | number (mm) | Offset along wall length from the wall start |
| `floorOffsetMm` | number (mm) | Height of panel bottom above floor |
| `wallSide` | `"interior"` \| `"exterior"` | Which face of the host wall |
| `visible` | boolean | Hide / show without deleting |

**Naming note:** Room walls already use `extensions.wallSide` as compass edge (`front` / `back` / `left` / `right`). Panel `wallSide` is a **different** concept (face of the host wall). Keep both; do not overload wall compass values onto panels.

When the host wall moves or resizes, panels re-resolve from this attachment data. Do not bake world XYZ as the only source of truth.

---

## 3. What already exists (do not rebuild)

| Area | Baseline |
| --- | --- |
| Camera presets | Perspective, Front, Side, Top, Dollhouse, Orbit, Walkthrough (`modelViewPresets`) — **no true orthographic Isometric yet** |
| 3D cutaway | Architectural cutaway — **not** the same as per-wall Hide |
| Materials | Catalog material browser / swatches (I5) |
| Texture import | Upload (PNG/JPEG/WebP), project-owned data URL save, 2 MB / project size caps, UV scale + rotation (`importedFinish`) |
| Feature walls | Catalog feature-wall pieces exist; post-create flexible attachment is incomplete |

Phase M is **finish + expose + persist**, then add the missing hide-wall and flexible-panel workflows.

---

## 4. Command model (object-based — not SketchUp)

**Do not implement SketchUp.** Ship the subset that supports:

```text
Room → openings → cabinets / interior objects → materials → presentation / rendering
```

Editor model:

```text
Room → Wall → Door / Window → Cabinet → Furniture → Wall Panel → Material
```

Commands understand the **selected object**. No vertex / edge / face / Push-Pull mesh editing.

### 4.1 Contextual command rail

| Selection | Commands shown |
| --- | --- |
| Nothing | Select · Draw Room · Measure · Camera |
| Wall | Edit · Material · Add Opening · Add Panel · Hide |
| Cabinet | Move · Rotate · Resize · Duplicate · Material · Delete |
| Feature panel | Move · Resize · Thickness · Offset · Material · Colour · Duplicate · Delete |

### 4.2 P0 command set (ship with M1–M3)

Shortcuts respect **existing** Interiors bindings where they already work (`M` = Measure, `R` = Rotate, `F` / `Shift+F` = Fit, `Cmd/Ctrl+D` = Duplicate, Undo/Redo). Prefer right-click for Hide. Number keys for camera apply in **Model** view only (Plan keeps `1` = Plan, `2` = Model).

| Command | Shortcut (ours) | Behaviour | Maps to |
| --- | --- | --- | --- |
| **Select** | click / `Esc` clears | Select wall, cabinet, door, window, panel, furniture | M1 / existing |
| **Move** | drag + arrow nudge | Move selected object; walls follow topology rules | existing + 3D parity |
| **Rotate** | `R` / `Shift+R` | Rotate cabinet / furniture / panel (±90°) — **not** `Q` | existing |
| **Delete** | `Del` / `Backspace` | Delete selected object / opening / panel where allowed | existing |
| **Measure** | `M` | Point-to-point / wall / object distance — **keep `M`**; do not steal for Move | existing (2D); 3D later if needed |
| **Pan** | `Space`+drag / middle mouse | Move camera without editing scene — **not** bare `H` | existing 2D; 3D polish in M1 |
| **Orbit** | mouse drag in Model | Orbit around room | existing |
| **Zoom** | wheel | Zoom in/out | existing |
| **Top** | `1` *(Model)* | Top / plan-like view | M1 |
| **Front** | `2` *(Model)* | Front elevation | M1 |
| **Side** | `3` *(Model)* | Side elevation (single side preset; Left/Right as later polish if needed) | M1 |
| **Isometric** | `4` *(Model)* | True orthographic isometric | M1 |
| **Perspective** | `5` *(Model)* | Perspective camera | M1 |
| **Fit Room** | `F` | Frame complete room | M1 |
| **Focus Selection** | `Shift+F` | Frame selected object | M1 |
| **Hide Selected** | right-click primary; `Cmd/Ctrl+H` optional | Hide wall/object via `visible` — **never** bare `H` (conflicts with Pan) | M2 |
| **Show All** | `Shift+Cmd/Ctrl+H` or Scene / Layers | Restore all walls/objects `visible = true` | M2 |
| **Material** | `B` or inspector | Open / apply material · colour | M3 |
| **Undo / Redo** | `Cmd/Ctrl+Z`, `Shift+Cmd/Ctrl+Z` | History | existing |

### 4.3 P1 command set (after P0 solid — mostly M3–M5)

| Command | Purpose | Maps to |
| --- | --- | --- |
| **Duplicate** | Copy cabinet / furniture / panel (`Cmd/Ctrl+D` already) | existing + M5 |
| **Scale / Resize** | Resize eligible objects | existing + M5 |
| **Align / Snap to Wall** | Orient / attach to wall | existing millwork + M5 |
| **Offset from Wall** | Exact clearance | M5 / inspector |
| **Add Wall Panel** | Wonder wall / feature panel | M5 |
| **Edit Panel** | Width, height, thickness, floor offset (`alongMm`, `floorOffsetMm`, …) | M5 |
| **Replace Material** | Change finish without geometry change | M3 |
| **Colour Picker** | Fixed shade groups + HEX/RGB | M3 |
| **Texture Upload** | PNG/JPG/WebP → project material | M4 |
| **X-Ray** | Temporary see-through (reuse / label cutaway) | M1 polish / P1 |
| **Walk Mode** | Eye-level walkthrough (already a preset) | expose clearly in M1 |
| **Duplicate Along Wall** | Cabinets / panels | M5 later |
| **Lock Object** | Prevent accidental move | P1 later |

### 4.4 Explicitly do **not** implement

| SketchUp-style tool | Why not |
| --- | --- |
| Eraser (mesh edges) | Select + Delete objects instead |
| Axes reposition | Not needed for kitchen / interior sales workflow |
| Back Edges | Wall visibility + X-Ray cover this |
| Generic Push/Pull | Destroys parametric room topology |
| Generic Offset | Use semantic ops: wall thickness, cabinet offset, panel offset |
| Face / vertex / edge editing | We are object-based, not a general modeller |

---

## 5. Phase inventory

### M1 — Camera and Navigation · `NEXT`

**Answers:** Feedback #1 · P0 camera / nav commands (§4.2)

- Expose visible **Perspective**, **Isometric**, **Front**, **Side**, and **Top** controls with clear icons **and** Model-view number shortcuts (§4.2).
- **Isometric** = true **orthographic** isometric camera. Keep **Dollhouse** as a separate perspective overview preset.
- Add **Fit Room** (`F`) and **Focus Selected** (`Shift+F`).
- Improve orbit, pan (`Space` / middle mouse), and zoom feel.
- Keep camera controls visible inside the 3D editor (not buried).
- Expose **Walkthrough** clearly (P1 Walk Mode — already a preset).

**Exit:** QA can switch Perspective, Isometric, Front, Side, and Top from obvious toolbar icons; Dollhouse remains available and distinct from Isometric.

**Tests:** Toolbar + Model shortcut preset switching; Isometric uses orthographic camera; Fit Room / Focus Selected frame correctly.

---

### M2 — Wall Selection and Visibility · `NEXT`

**Answers:** Feedback #3 · P0 Hide / Show All (§4.2)

- Select individual walls in 3D.
- Right-click **Hide Wall** → set that wall’s existing `wall.visible = false` (primary UX). Optional `Cmd/Ctrl+H` for Hide Selected.
- **Show Wall** → `wall.visible = true` for the target wall.
- **Show All Walls** → set **every** wall’s `visible` to `true` (Scene / Layers and/or `Shift+Cmd/Ctrl+H`).
- List walls with `visible === false` in Scene / Layers.
- Persistence is automatic via the existing `WallEntity.visible` field (already parsed/serialized).

**Implementation note:** Reuse `wall.visible`. Do **not** add a parallel `hiddenWallIds` (or similar) store. Scene compile already filters on `wall.visible`. Never bind Hide to bare `H` (Pan uses Space / middle mouse).

**Do not conflate** with existing cutaway. Cutaway is a viewing aid (P1 X-Ray label); Hide Wall is per-wall `visible` state.

**Exit:** Hide one wall → save → reopen → wall still hidden; Show All sets all walls visible.

**Tests (required):** Save-and-reopen for `wall.visible === false`; Show All leaves every wall `visible === true`.

---

### M3 — Material and Colour Library · `NEXT`

**Answers:** Feedback #5 · P0 Material + P1 Replace / Colour Picker (§4.2–4.3)

- Materials as visual thumbnails.
- **Colour shades v1:** fixed shade groups for the selected material family (not procedural infinite ramps).
- Custom colour picker with **HEX** and **RGB**.
- Recently used materials and colours.
- Apply to walls, floors, cabinets, furniture, and decorative panels.
- Replace on one object or multiple selected objects.

**Exit:** Designer can pick a material, choose a fixed shade, set a custom colour, and apply to selection; recent colours appear after use.

**Tests (required):** Apply shade / custom colour → save → reopen; multi-select replace where implemented.

---

### M4 — Local Texture Import · `NEXT`

**Answers:** Feedback #2 · P1 Texture Upload (§4.3)

**Already shipped (do not re-spec as new):** basic upload, project-owned save, size limits, UV scale, UV rotation.

**M4 focus:**

- Texture **preview** before apply
- Better transform UX (scale, position, rotation, repetition)
- Clearer file validation / unsupported-type warnings
- Overall import UX polish

**Exit:** Upload → preview → adjust transforms → apply → save → reopen still shows the texture with the same UV settings.

**Tests (required):** Save-and-reopen of imported finish + UV; reject oversized / unsupported files with a clear warning.

---

### M5 — Decorative and Feature Walls · `NEXT`

**Answers:** Feedback #6 · P1 Add/Edit Panel + contextual panel commands (§4.1, §4.3)

Feature / wonder wall / panelling is a **design object** on a structural wall using the §2.1 attachment model.

Users can:

- Add one or more decorative panels to an existing wall
- Move and resize the panel (along-wall + floor offset)
- Set width, height, thickness, and floor offset
- Change material and colour
- Duplicate, hide, replace, or delete
- Edit without changing the structural wall

**Exit:** After room create, add two panels on one wall, recolour one, hide one, save/reopen — structure unchanged; panels stay attached when the host wall moves.

**Tests (required):** Save-and-reopen; wall move keeps panel attachment; hide panel without hiding wall.

---

### M6 — Materials From Websites · `LATER`

**Answers:** Feedback #4 — deliver gradually; no arbitrary scraping.

| Step | Scope |
| --- | --- |
| M6.1 | Download texture elsewhere → upload manually (uses M4) |
| M6.2 | Import from a direct image URL — **copy image bytes into the project**; do not depend on the live URL after import |
| M6.3 | Selected manufacturer material catalogues |
| M6.4 | Later: brand, product code, dimensions, normal / roughness maps |

**EXCLUDED from first version:** scraping arbitrary websites; hotlinking remote texture URLs as project truth.

**Tests (required when built):** After URL import, project reopens offline / without the original host.

---

### M7 — Final QA and Workflow Testing · `LATER`

Full path:

```text
Create room → Open 3D → Change camera view → Hide walls
→ Apply materials / colours → Add feature walls → Edit objects
→ Save → Reopen → Render
```

M7 is integration / exit-journey coverage. **Per-phase save-and-reopen tests for M2–M5 are required at each phase**, not deferred to M7.

---

## 6. Delivery order

```text
P0 command surface (object-based + contextual rail)   ← with M1–M3
M1 Camera icons + true Isometric + Fit / Focus + Walk expose
M2 Hide Wall (right-click) + persist
M5 Flexible panels / wonder walls   ← after attachment model locked
M3 Material library + fixed shade groups + Material command
M4 Texture import UX polish
M6 Web / catalogue import (copy-into-project)  ← last
M7 End-to-end QA
```

Immediate implementation focus: **P0 Camera + Selection/Transform + Visibility + Materials**, then **P1 Feature Wall / panelling + advanced materials + Walk / X-Ray**.

---

## 7. Out of scope

- SketchUp-style mesh tools (Eraser, Axes, Back Edges, Push/Pull, generic Offset, face/vertex editing) — see §4.4
- Arbitrary website scraping
- Hotlinked remote textures as the only material source
- Substance-style PBR authoring (full material graph / map authoring studio)
- Turning the product into a texture marketplace
- Mutating structural walls when editing panels
- Rebuilding camera or material systems from scratch
- Treating Dollhouse as a substitute for Isometric
- Stealing existing shortcuts (`M` Measure, `R` Rotate, bare `H` for Hide)

---

## 8. First sprint (approved)

1. **M1** — visible camera icons, true orthographic Isometric (Dollhouse separate), Fit Room, Focus Selected, Model-view camera shortcuts (§4.2)  
2. **M2** — right-click Hide Wall, Show Wall, Show All, persistence + save/reopen tests  
3. **M5 planning only** — lock exact attachment property names in §2.1 (`wallId`, `alongMm`, `floorOffsetMm`, `wallSide`, `visible`); no full M5 build yet  
4. **Command contract** — keep object-based + contextual rail (§4); do not start SketchUp-parity tools

Ready to start **M1** and **M2**.
