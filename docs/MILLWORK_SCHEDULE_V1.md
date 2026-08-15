# Living-room Millwork Schedule v1 + Model inspector

**Status:** In development on this release (`milwork-schedule-v1`).  
**Why:** Phase 1 WebGL is closed. Phase 2 stills already exist. The named workshop deliverable in [PRODUCT_DECISIONS.md](./PRODUCT_DECISIONS.md) is still what makes the product cabinet-aware.

## What we are building

One millimetre-true millwork takeoff, plus the ability to set **W × H × D** and **material slots** while looking at the piece in **3D Model**. Plan, Model, schedule, and StillJob millwork gates all read the same `InteriorProject` objects.

Not a prettier WebGL pass. Not a client brochure. Not a cutlist, price, or CNC program.

## Story (end to end)

1. Salesperson places a Low TV Unit and Open Bookcase in **Plan**.
2. In **Model**, they select the TV unit. The inspector shows the same width/height/depth mm and carcass/fronts materials. Changing 2000 → 2200 mm grows the procedural box. Undo still works.
3. **Millwork Schedule v1** CSV/PDF lists that unit: id, name, category, room, 2200 × 520 × 440 mm, material ids, quantity 1.
4. Soft goods (sofa, rug, lamp) can be sized in Model but **do not** appear on the schedule.
5. Client Preview stills may look nicer but cannot disagree with those millimetres (existing StillJob `millwork_size` gate).

## Millwork definition (v1)

Same rule as StillJob: `kind === "cabinet"` **or** category `media-unit` / `storage`.

Starter living room millwork is the TV unit (`media-unit`). Bookcase (`storage`) is included when placed.

One row per instance. Quantity is always 1. No SKU collapsing.

## Inspector

- Visible on **Plan** and **Model**, not on Render (presentation stays locked).
- Shared size + material editors: `resizeLivingRoomObject` and `setInteriorObjectMaterial`.
- Plan also keeps room size, X/Z, rotation, layout checks.
- Model empty state: “Select a piece in the room to set size and finish.”

## Export

- **Schedule CSV** / **Schedule PDF** in the living-room title bar.
- Domain: `src/domain/livingRoom/millworkSchedule/` (`buildLivingRoomMillworkSchedule`, CSV, PDF).
- Honesty line on the PDF: sizes match Plan/Model; not a cutlist, price, or CNC program.
- Separate from the client preview package.

## Out of scope

Pricing, hardware BOM, CNC, MES, hero cabinet GLBs, editing sizes on Render, photoreal claims.

## Done when

Resize millwork in Model → Plan numbers and schedule millimetres match; sofa never appears on the schedule; empty millwork still exports a valid empty table.
