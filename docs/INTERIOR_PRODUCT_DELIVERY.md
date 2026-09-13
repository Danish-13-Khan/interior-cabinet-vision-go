# Interior product delivery

**Full phase specification:** [Whole-interior product roadmap](./INTERIOR_PRODUCT_ROADMAP.md). This file tracks implementation evidence and remaining gaps.

This branch implements the whole-interior product direction agreed with the owner:
living rooms, bedrooms, kitchens, and other spaces share one design, materials,
lighting, costing, and project-management workflow. It is not a kitchen-only product.

Branch: `codex/interior-product-roadmap`. Current base: local `main`, `633bb85`.
The original interior checkpoint was rebased onto the completed SaaS merge without conflicts.
All work is local. No publishing, pushing, or merging is part of this delivery.
The completed `feat/saas-business-scope` work is now included through main (PR #33).
All subsequent interior development belongs on this roadmap branch, checked out in
`cabinet-designer-mvp`. The secondary worktree is detached and is no longer the active workspace.

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
| P — Commercial platform | None. No server exists in `src/`; persistence is local files plus `localStorage`; billing entry points return `provider_not_configured` | Hosting, identity, tenancy, server-side entitlement and a real subscription provider |

## Phase 0 audit inventory

Source audit of the current tree, recorded so phases are not read as unbuilt work. "Implemented" means code exists and is exercised by tests; it still does not mean a release gate has passed.

| Area | Status | Evidence |
| --- | --- | --- |
| Wall authoring, split/join/offset/raise | Implemented | `src/domain/interiorProject/wallEditing*.ts`, `wallTransform.ts`, `wallEditing.test.ts` |
| Doors and windows | Implemented | `openingCatalog.ts` (12 items), `openingCommands.ts`, `OpeningInspector.tsx` |
| Room topology, multi-room, split/merge | Implemented | `planTopology.ts`, `roomDrawing.ts`, `roomSplit.ts`, `roomOperations.ts`; 17 tests in `interiorProject/` |
| Snapping, selection, undo/redo | Implemented | `planSnapping.ts`, `planInspectTarget.ts`, `useEditorHistory.ts` |
| Save/reopen and legacy migration | Implemented | `fileFormat.ts` (schema v2, migrates legacy cabinet shapes), `useProjectFileIo.ts` |
| Furniture catalogue | Partial | 140 items in `catalog/data/builtin-catalog.v1.json` — every model in the Kenney pack, now room-tagged and room-filterable via `catalogRooms.ts`. No wardrobe model exists in the pack; wardrobes are parametric `almirah` millwork, not a prop. Kitchen cabinets are still presentation props |
| Parametric cabinet engineering | Implemented | `cabinetConstruction/`, `cabinetComposition/`, `hardwareSystem/` (20 items), `productionCutlist.ts`, `sheetYield/` |
| Machine export | Partial by design | `machineExport/derive.ts` emits `status: "preview"` intent operations, not production CAM |
| Materials and PBR spine | Implemented (core) | Acrylic, wallpaper and tile kinds plus seed materials. Grain and UV rotation apply on curated, GLB and cloned procedural maps. Interior finish rates live on `PriceBook.interiorRates` |
| Lighting | Implemented (core) | Kelvin stored and converted. Strip accessories (driver / profile / diffuser) emit estimate lines. Brightness remains a renderer control |
| Light and object cost lines | Implemented (uncommitted) | `interiorEstimate/measure.ts` emits `lm` for strips, `each` for fixtures and non-cabinet objects |
| Costing bases | Implemented | `interiorEstimate/measure.ts` (area with opening deductions, length, count, per-line waste, `source`/`measured`, `category`, `rateSource`), `boq/fromReport.ts` (component), `costing.ts`. Category rates resolve object and light lines via `setEstimateCategoryRate` |
| Commercial modifiers | Implemented | `projectQuote.ts`, `quoteSettings.ts`, `priceBook/` (labour, waste, markup, discount, tax, finish premium) |
| Optional finish packs | Partial — overlap now detected | `interiorEstimate/reconcile.ts` flags optional `area_finish` SKUs and custom m² lines that repeat a geometry-derived surface; the estimate panel shows each conflict. Packs still have no caller that adds them to a project |
| Quote freeze, revisions, BOQ, invoice | Implemented | `quoteExport/cabinetFreeze.ts`, `proposal/liveQuote.ts`, `invoiceDocument.ts`, `invoicePdf.ts`. `QuoteSnapshot.detailLines` retains issued per-line detail and the frozen CSV exports it; older snapshots label the gap |
| Payment ledger | Implemented (local) | `paymentLedger/schedule.ts`, `fifo.ts`, `outstanding.ts`, `syncFreezeToLedger.ts` |
| Client history | Partial | `clientHistory.ts`, `clientHistoryStore.ts`; `basicClient.ts` notes UX not fully wired |
| Company seats, permissions, owner dashboard | Partial | `company/seats.ts` (admin UI deferred), `permissions.ts`, `sharedProjects.ts`, `ownerDashboard.ts`, `premiumAudit.ts` |
| Approvals | Stub | `company/approvals.ts` — self-described workflow stubs |
| Plans and entitlements | Implemented locally, unenforceable | `saas/plans.ts`, `entitlements.ts`, `accountPersistence.ts` (localStorage) |
| Billing | Stub | `saas/billing.ts` returns `provider_not_configured`; `stubSetLocalPlan` |
| Dual document model | Decided (keep both) | Seam: `interiorProject/cabinetAdapter*.ts` — [DUAL_DOCUMENT_RULE.md](./DUAL_DOCUMENT_RULE.md) |

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
