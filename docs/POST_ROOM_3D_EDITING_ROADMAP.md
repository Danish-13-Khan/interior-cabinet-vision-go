# Phase M — Post-Room 3D Editing and Materials

**Document role:** Active roadmap for editable 3D after room create  
**Product relationship:** Companion to [Cabinet Studio Product and Development Book](./CABINET_STUDIO_PRODUCT_BOOK.md) and successor to H–L in [Interior Design Tool Roadmap](./INTERIOR_DESIGN_TOOL_ROADMAP.md)  
**QA feedback date:** 2026-09-06  
**Baseline date:** 2026-09-06  
**Revised:** 2026-09-06 (pre-build clarifications)  
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

## 4. Phase inventory

### M1 — Camera and Navigation · `NEXT`

**Answers:** Feedback #1

- Expose visible **Perspective**, **Isometric**, **Front**, **Side**, and **Top** controls with clear icons.
- **Isometric** = true **orthographic** isometric camera. Keep **Dollhouse** as a separate perspective overview preset.
- Add **Fit Room** and **Focus Selected**.
- Improve orbit, pan, and zoom feel.
- Keep camera controls visible inside the 3D editor (not buried).

**Exit:** QA can switch Perspective, Isometric, Front, Side, and Top from obvious toolbar icons; Dollhouse remains available and distinct from Isometric.

**Tests:** Toolbar preset switching; Isometric uses orthographic camera; Fit Room / Focus Selected frame correctly.

---

### M2 — Wall Selection and Visibility · `NEXT`

**Answers:** Feedback #3

- Select individual walls in 3D.
- Right-click **Hide Wall** → set that wall’s existing `wall.visible = false`.
- **Show Wall** → `wall.visible = true` for the target wall.
- **Show All Walls** → set **every** wall’s `visible` to `true`.
- List walls with `visible === false` in Scene / Layers.
- Persistence is automatic via the existing `WallEntity.visible` field (already parsed/serialized).

**Implementation note:** Reuse `wall.visible`. Do **not** add a parallel `hiddenWallIds` (or similar) store. Scene compile already filters on `wall.visible`.

**Do not conflate** with existing cutaway. Cutaway is a viewing aid; Hide Wall is per-wall `visible` state.

**Exit:** Hide one wall → save → reopen → wall still hidden; Show All sets all walls visible.

**Tests (required):** Save-and-reopen for `wall.visible === false`; Show All leaves every wall `visible === true`.

---

### M3 — Material and Colour Library · `NEXT`

**Answers:** Feedback #5 (and part of materials UX)

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

**Answers:** Feedback #2

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

**Answers:** Feedback #6

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

## 5. Delivery order

```text
M1 Camera icons + true Isometric + Fit / Focus
M2 Hide Wall (right-click) + persist
M5 Flexible panels / wonder walls   ← after attachment model locked
M3 Material library + fixed shade groups
M4 Texture import UX polish
M6 Web / catalogue import (copy-into-project)  ← last
M7 End-to-end QA
```

---

## 6. Out of scope

- Arbitrary website scraping
- Hotlinked remote textures as the only material source
- Substance-style PBR authoring (full material graph / map authoring studio)
- Turning the product into a texture marketplace
- Mutating structural walls when editing panels
- Rebuilding camera or material systems from scratch
- Treating Dollhouse as a substitute for Isometric

---

## 7. First sprint (approved)

1. **M1** — visible camera icons, true orthographic Isometric (Dollhouse separate), Fit Room, Focus Selected  
2. **M2** — right-click Hide Wall, Show Wall, Show All, persistence + save/reopen tests  
3. **M5 planning only** — lock exact attachment property names in §2.1 (`wallId`, `alongMm`, `floorOffsetMm`, `wallSide`, `visible`); no full M5 build yet

Ready to start **M1** and **M2**.
