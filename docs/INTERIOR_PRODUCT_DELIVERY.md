# Interior product delivery

This branch implements the whole-interior product direction agreed with the owner:
living rooms, bedrooms, kitchens, and other spaces share one design, materials,
lighting, costing, and project-management workflow. It is not a kitchen-only product.

Branch: `codex/interior-product-roadmap`. Current base: local `main`, `633bb85`.
The original interior checkpoint was rebased onto the completed SaaS merge without conflicts.
All work is local. No publishing, pushing, or merging is part of this delivery.
The completed `feat/saas-business-scope` work is now included through main (PR #33).
All subsequent interior development belongs on this isolated roadmap branch.

## Delivery status

“Existing” means code was found, not that a phase has passed its release gate.
Commercial code is now inherited from main. Its presence does not by itself establish
that the broader roadmap release gates below have been met.

| Phase | Existing foundation / current status | Remaining release gate |
| --- | --- | --- |
| 0 — Product foundation | Initial source audit and this delivery tracker | Reconcile older millwork-first documents with whole-interior direction against the merged SaaS scope |
| 1 — Room planning | Existing topology, room/wall/opening editing, 2D/3D, history and file persistence | Verify representative multi-room homes, undo/reopen, and topology edge cases |
| 2 — Furnishing | Existing catalogue, room starters, imported models and cabinet adapters | Verify living-room, bedroom and kitchen placement/resize/material workflows and catalogue gaps |
| 3 — Materials | First checkpoint: physical box-face UVs, square repeats, complete material-change invalidation | Curated finish responses, cylinder/GLB scale policy, grain direction, broader visual comparison |
| 4 — Lighting | First checkpoint: saved editable ceiling, pendant, under-cabinet and cove fixtures in 3D and Render Studio | Direct placement/snapping, cabinet attachment, light budgets, coherent sun and exposure, representative-room visual QA |
| 5 — Interior costing | Existing cabinet costing; merged price-book work | Integrate area/length/count/component rules and fixture accessories without duplicate charges |
| 6 — Quotes/presentation | Existing render, proposal and export paths; merged quote work | Verify room-wise and consolidated proposals against final pricing integration |
| 7 — Designer launch | Merged account/entitlement work | Onboarding, recovery, real customer pilot and release checks |
| 8 — Professional | Merged payment/client implementation | Integrate and verify payment allocation, overdue, history, and downgrade data access |
| 9 — Company | Planned integration stage | Team persistence, permissions, shared rates, approvals, owner reporting and tenant isolation |
| 10 — Production handoff | Existing engineering reports and cutlists | Verify cabinet/wardrobe outputs and contractor-specific handoff for whole projects |
| 11 — Expansion | Backlog | Prioritise paid-customer evidence, catalogue breadth, integrations and performance |

## Checkpoint 1: material scale and room-light authoring

### Material scale

- Box and rounded-box faces now use one UV unit per metre, so a finish keeps the
  same physical scale on narrow and tall panels. The shared geometry is prepared once.
- Texture repeat no longer squashes the vertical axis or clamps large patterns to
  a minimum repeat. Invalid tile sizes fall back to one metre.
- Material memoisation includes all compiled fields, including normal/roughness
  texture URLs, opacity, kind and asset binding, rather than a partial field list.
- Existing imported GLB source UVs are not regenerated. Replacement-map repeat
  becomes square; physically calibrated scaling on arbitrary GLBs remains open.
- Cylinders retain their existing mapping; they are not claimed physically calibrated.

### Lighting

Open a project, choose **3D**, then **Room lights**. The same controls are available
in Render Studio. Add a fixture, then adjust its position in millimetres, rotation,
colour, brightness and (for strips) length. Toggle or remove it independently.

- Four presets: ceiling downlight, pendant, under-cabinet LED strip, cove LED strip.
- A saved `LightEntity` owns both the visible fixture and its actual illumination.
- Downlights aim along the fixture's rotated local -Z axis. Strips emit from the
  same transform as their diffuser. Off fixtures remain visible.
- Mutations go through existing project patch/history handling. Preset changes
  preserve custom fixtures. Editing/removal is scoped to the active room.
- Numeric inputs are validated; fixture type and unrelated light records are protected.

Limitations: placement starts at the room bounding-box centre and is manually
adjusted; concave rooms may require repositioning. No ceiling/cabinet attachment,
drag handles, fixture catalogue mesh, automatic cost line, photometric unit claim,
or guaranteed area-light occlusion is included in this checkpoint. Brightness is a
renderer control, not a calibrated lumen value. Fixtures are preview geometry.

### Validation

- TypeScript check and Vite production build pass (existing large-chunk warning).
- 45 targeted tests pass across rendering, finish import, HDRI and fixture persistence.
- Browser test covers the normal 3D entry point, adding a strip, changing length,
  height and brightness, toggling, removal, and absence of page errors.
- Visual QA checks panel layout; it is not a photorealism certification.
- Tests require a current Node runtime: the shell's Node 18 lacks `File` and is too
  old for installed Playwright. Validation uses the bundled modern Node runtime.

## Integration rules

Preserve every paid plan's saving and basic quote revisions. Professional owns
client/payment tools; Company adds collaboration and richer reporting. Record
client payments without collecting or processing money.

With the SaaS work now inherited from main, review shared UI composition and project
patch handling, then integrate fixture quantity/length into the customer's price
book. A separate worktree prevents checkout interference, not future merge conflicts.
Do not mark phases 5–9 complete merely because corresponding files exist.
