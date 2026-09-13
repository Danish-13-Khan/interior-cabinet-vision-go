# Whole-interior product roadmap

**Status:** Planned delivery programme with an initial implementation checkpoint. Not a release certification.  
**Working branch:** `codex/interior-product-roadmap` in `cabinet-designer-mvp`. Work stays local until the owner requests otherwise.  
**Implementation evidence:** [Interior product delivery tracker](./INTERIOR_PRODUCT_DELIVERY.md).  
**Commercial rules:** [Business and product scope](./BUSINESS_PRODUCT_SCOPE.md).

## 1. Product promise

Design interiors, calculate costs using your own rates, present the design, and manage the project.

The product serves interior designers, independent studios, interior firms, and furniture workshops. Living rooms, bedrooms, and kitchens are all part of the first commercial milestone. Dining rooms, bathrooms, home offices, and other spaces extend the same foundation. Cabinets and wardrobes are important capabilities within the whole-interior product.

The workflow is:

```text
Create project and rooms
  → Draw and measure
  → Place furniture, millwork and fixtures
  → Assign surfaces and finishes
  → Place lights and review in 3D
  → Calculate quantities using customer rates
  → Freeze and present a proposal
  → Record acceptance, invoices and payments
  → Collaborate and hand off for execution
```

We earn through software subscriptions. Customers own their designs, rates, clients, commercial documents, and money collection. Recording client payments is in scope; collecting or processing those payments is not.

## 2. Plans and product boundaries

| Capability | Designer | Professional | Company |
| --- | --- | --- | --- |
| Room planning, furnishing, materials and lighting | Yes | Yes | Yes |
| Save/reopen, basic project records and client contact | Yes | Yes | Yes |
| Customer-controlled rates and design costing | Yes | Yes | Yes |
| Quotes, BOQ exports, frozen snapshots and basic revisions | Yes | Yes | Yes |
| Consolidated client history and commercial status reports | No | Yes | Yes |
| Payment schedules, receipts recorded by users, outstanding and overdue | No | Yes | Yes |
| Full payment-history retention | Not applicable | Yes | Yes |
| Shared projects, seats, roles and shared price books | No | No | Yes |
| Approvals, owner dashboard and richer audit reporting | No | No | Yes |

Exact subscription prices, seat limits, project limits, render allowances and specialist manufacturing packaging remain decisions to validate. This roadmap does not invent final prices or restrict basic saving to a higher plan. Billing readiness means real subscription enforcement, not merely a local plan selector.

The first release does not promise a marketplace, purchasing or fulfilment, full accounting software, electrical/plumbing execution design, competitor feature parity, or photorealism on every device.

## 3. Delivery sequence and status rules

Phase numbers are dependency order, not build order, and they do not describe equal amounts of work. Three corrections apply to any literal 1→11 reading:

- **Phases 5, 6 and 8 are wiring and hardening, not new construction.** Their domain layers exist and are tested: `src/domain/priceBook`, `src/domain/interiorEstimate`, `src/domain/boq`, `src/domain/projectQuote`, `src/domain/quoteExport/cabinetFreeze.ts`, `src/domain/paymentLedger` (schedules, FIFO allocation, outstanding/overdue rollups, freeze→ledger sync). The remaining work is user interface, journey verification and the specific holes named under each phase.
- **Phase 2 is the largest real gap**, not phase 1. See the catalogue inventory in that section.
- **Phases 7 and 9 are gated by the platform track below, not by phases 3–6.** No server exists in `src/`. Persistence is local files plus `localStorage`, and `startSaaSCheckout` / `openSaaSBillingPortal` return `provider_not_configured`. Client-side entitlement checks are not billing enforcement.

| Phase | Outcome | Dependency | Current evidence |
| --- | --- | --- | --- |
| 0 | Agreed scope, baseline and acceptance projects | None | Initial audit and tracker exist |
| 1 | Reliable room planning | 0 | Existing implementation; release verification remains |
| 2 | Furnished living rooms, bedrooms and kitchens | 1 | Existing catalogue/templates; gap audit remains |
| 3 | Believable, correctly scaled finishes | 1–2 | Physical box UV checkpoint implemented; broader finish work remains |
| 4 | Usable lighting and consistent visual presentation | 1–3 | Editable fixture checkpoint implemented; attachment and lighting calibration remain |
| 5 | Traceable whole-interior costing | Contracts start in 0; integrates 1–4 | Merged price-book/BOQ foundations; whole-interior integration remains |
| 6 | Consistent client proposals | 3–5 | Existing proposal/export foundations; combined acceptance remains |
| 7 | Paid Designer release | Gates for 1–6; account foundations start early | Merged SaaS foundations; production launch not certified |
| 8 | Professional job and payment management | 5–7 | Merged ledger/client foundations; complete workflow verification remains |
| 9 | Company collaboration and oversight | 7–8; tenancy design starts in 0 | Company release gate remains open |
| 10 | Reliable production and contractor handoff | 2, 3, 5, 6 | Existing engineering/cutlist foundation; expanded verification remains |
| 11 | Repeatable expansion and growth | Retained paying customers | Backlog |
| P | Commercial platform: accounts, tenancy, hosted persistence, billing | Design starts in 0; runs in parallel throughout | Local stubs only; no server exists |

Track P is a parallel work stream with its own lead time, not a step after phase 4. Start it during phase 0 or phases 7 and 9 will stall against it. Its detailed design lives in [Backend SaaS commercial platform book](./BACKEND_SAAS_COMMERCIAL_PLATFORM_BOOK.md); this roadmap only records the dependency.

These are dependency stages, not calendar promises. Establish time estimates after phase 0, based on actual gaps and team capacity. Costing contracts, tenancy, persistence and performance constraints must be designed early even when their full user interfaces ship later.

Existing code is reused and verified. A phase becomes complete only when its end-to-end acceptance gate has evidence. Unchecked items below are release requirements, not assertions that no implementation exists.

## Phase 0 — Scope, audit and shared contracts

**Outcome:** One executable plan aligned with whole-interior design.

- [ ] Inventory room editing, templates, catalogue, material import, lighting, costing, exports, SaaS and engineering features against this roadmap.
- [ ] Classify each feature as verified, implemented but unverified, partial, or missing; link evidence in the delivery tracker.
- [ ] Reconcile legacy millwork-first documents and navigation with living-room, bedroom and kitchen scope.
- [ ] Define stable project/room/object/material/light identifiers and units across design, costing, exports and history.
- [ ] Decide the target of the dual document model. `InteriorProject` and `CabinetProject` are separate documents bridged by `src/domain/projectRooms/cabinetAdapter.ts`, so every phase 2–6 feature is otherwise built twice. Record whether we consolidate, keep the adapter as the permanent seam, or split the products.
- [ ] Consolidate the overlapping planning documents rather than adding to them. `docs/` already holds ~12,000 lines across `INTERIOR_PRODUCT_ROADMAP`, `INTERIOR_DESIGN_TOOL_ROADMAP`, `INTERIOR_PRODUCT_DELIVERY`, `BUSINESS_PRODUCT_SCOPE`, `CABINET_STUDIO_PRODUCT_BOOK` and seven `SAAS_*_NOTES` files. Name one owner document per area and mark the rest superseded.
- [ ] Decide how saved local files, cloud copies and versions relate; document recovery and migration behaviour.
- [ ] Define production authentication, subscription authority, tenant ownership and server permission enforcement before Company work.
- [ ] Establish representative acceptance projects and baseline measurements on supported devices.

**Gate:** The feature inventory, shared data contracts, supported runtime targets and acceptance fixtures are recorded. No phase is declared complete from file presence alone.

## Phase 1 — Reliable room planning

**Outcome:** Designers can draw and reopen a complete home layout.

- [ ] Create, rename, select and organise multiple rooms within a project.
- [ ] Draw rectangular and irregular rooms; edit wall endpoints, thickness, height and joins.
- [ ] Support shared walls, openings, room splits and merges with consistent topology.
- [ ] Place and resize doors/windows with sill height, opening direction and wall attachment.
- [ ] Support measured underlays, dimensions, snapping, precise numeric entry, pan and zoom.
- [ ] Keep 2D, 3D and quantities derived from the same project data.
- [ ] Execute the phase-0 decision on the dual document model before phase 2 adds catalogue and costing surface area on top of the adapter.
- [ ] Verify undo/redo, autosave/recovery, manual save, reopen and older-file migration.
- [ ] Explain invalid edits without losing the last valid project state.

**Gate:** A multi-room fixture can be drawn, edited, split/merged, undone, saved and reopened without missing objects, orphaned openings or changed dimensions. A rotated or translated room works as reliably as a room centred at the origin.

## Phase 2 — Furnishing across room types

**Outcome:** A useful complete design in each initial room type.

| Room | Essential content |
| --- | --- |
| Living room | Sofas, chairs, coffee/side tables, TV units, shelving, curtains and rugs |
| Bedroom | Beds, wardrobes, bedside units, dressers, desks and curtains |
| Kitchen | Base/wall/tall cabinets, counters, sink, hob, appliances and backsplash |
| Dining | Tables, chairs, storage and pendant placement |
| Bathroom | Vanity, basin, mirror and basic fixtures; no execution-services promise |

**Measured catalogue state.** `src/domain/catalog/data/builtin-catalog.v1.json` holds 140 items, which is every model in `public/models/kenney-furniture/models_glb` — the manifest exposes the whole pack, so missing content means a missing asset, not a missing entry.

| Essential content | Present | Position |
| --- | --- | --- |
| Living room | sofas, 13 tables, TV cabinets, 5 bookcases | Adequate for a first design |
| Bedroom | beds (single, double, bunk), bedside units | **No wardrobe model exists in the pack** |
| Kitchen | 15 appliances, 10 cabinet meshes labelled "Presentation Prop", `kitchenBar` counters | Cabinet props are not linked to the parametric `CabinetType` engine |
| Dining | tables and chairs, reachable via the Dining room filter | No separate dining category, and none needed |
| Bathroom | 10 fixtures | Adequate |

Wardrobes are **not** a catalogue gap. `CabinetType` already includes `"almirah"` and `wardrobePlacement.ts` places them, so a wardrobe is parametric millwork that carries components, hardware and cost — a static GLB prop would be a regression. The open work is exposing wardrobe authoring in the interiors flow, not adding a mesh.

- [x] Tag every item with the rooms it serves and filter the browser by room — `src/domain/catalog/catalogRooms.ts`, `room` on `ObjectBrowserQuery`, room selector in `CatalogObjectBrowser.tsx`. Rooms are derived from category and subcategory, with an explicit `rooms` field or `room:*` tag as override.
- [ ] Route kitchen cabinet props through `createCabinetConstruction` rather than the Kenney overrides in `cabinetPropOverrides.data.json`, so a placed cabinet carries components, hardware and cost rather than only a mesh.
- [ ] Expose wardrobe/almirah authoring in the interiors flow alongside kitchen runs.
- [ ] Fill or remove the empty `curatedSlotsA/B/C.data.json` files.
- [ ] Search and filter the catalogue by object type and useful dimensions.
- [ ] Place, move, rotate, duplicate, group and remove objects with consistent controls.
- [ ] Distinguish resizable furniture from configurable millwork; do not distort hardware or stretch fixed appliances silently.
- [ ] Preserve object scale, floor origin, material slots and source attribution for imported assets.
- [ ] Make cabinet/wardrobe fronts, carcasses, worktops, hardware and interior parts independently addressable.
- [ ] Include clear door/drawer clearance guidance where supported.
- [ ] Provide useful living-room, bedroom and kitchen starters without requiring the user to start from a kitchen.

**Gate:** Each initial room fixture can be furnished, edited and reopened. Selected objects retain valid dimensions and finish assignments, and missing assets have recoverable fallbacks.

## Phase 3 — Materials and surface finishes

**Outcome:** Users can choose finishes that read correctly at room and close-up scale.

- [ ] Provide a curated initial library: matte/gloss laminate, acrylic, wood/veneer, paint, wallpaper, tile, stone, upholstery, flooring and ceiling finishes.
- [ ] Separate colour, roughness, normal/bump, reflection and clearcoat behaviour by finish type.
- [ ] Calibrate texture size on panels, floors, walls, counters and imported objects; define cylinder and GLB mapping policy explicitly.
- [ ] Support grain orientation, rotation, offset and intentional continuity across adjacent fronts.
- [ ] Support face/slot-level application without accidentally changing every object sharing a material.
- [ ] Import user/manufacturer textures with physical size and optional product metadata; retain map assets through save/reopen.
- [ ] Preserve normal and roughness maps during reassignment and import.
- [ ] Show material-load failures and fallbacks clearly; prevent silent missing textures in final exports.
- [ ] Link selected finishes to price-book entries without treating default catalogue prices as customer-approved rates.

**Gate:** A fixed comparison scene shows distinct matte laminate, gloss, wood, fabric, paint, stone and metal. A declared 600 mm pattern keeps that size on different panel dimensions. Editing one finish assignment does not unexpectedly change unrelated objects.

**Implemented checkpoint:** Physical UV scale for boxes/rounded boxes, square repeat factors and complete compiled-material invalidation. Remaining acceptance work is still open.

**Closed since the audit.**

- [x] `MaterialKind` now carries `acrylic`, `wallpaper` and `tile` alongside the existing families, with matching entries in `SURFACE_FINISHES`, contrast tuning in `materialContrast.ts`, clearcoat and environment response in `createPbrMaterial.ts`, and procedural map routing in `proceduralSurfaceMaps.ts`. Acrylic renders as a solid gloss front rather than borrowing wood grain.
- [x] Selectable seed materials for acrylic, wallpaper, tile and wall/ceiling paint ship in `catalog/materials/seedMaterialsSurfaces.data.json`. The existing ceramic tile entry moved from `kind: "stone"` to `kind: "tile"`.
- [x] `grainDirection` now rotates the map. `src/rendering/materials/grainRotation.ts` converts the cabinet vocabulary (`lengthwise`/`crosswise`) and the shorter room-preset vocabulary into a quarter turn, applied on both the curated box path and the GLB slot path.
- [x] `uvRotationDeg` and `uvOffsetU/V` now apply on the GLB slot path too (`glbTextureLoad.ts`), so imported objects honour the rotation and offset the inspector already offered.

**Still open.**

- Procedural wood and noise maps are generated once and shared by cache key, so grain rotation applies to curated and imported texture maps but not to procedurally generated ones. Rotating a shared cached texture would leak across materials; this needs per-material clones first.
- Acrylic and wallpaper have no price-book slot yet; `laminate-acrylic` in `priceBook/defaults.ts` is still `status: "todo"`.

## Phase 4 — Lighting and visual realism

**Outcome:** Light placement is part of the design and produces believable illumination.

- [ ] Calibrate daylight with a coherent sun direction, window fill, restrained ambient light and predictable exposure.
- [ ] Support ceiling downlights, pendants, wall/task lights, under-cabinet strips and cove lighting.
- [ ] Provide visible fixture geometry and actual illumination from the same saved entity.
- [ ] Add direct placement, selection, move/rotate controls and snapping to appropriate surfaces.
- [ ] Attach strips to cabinet undersides and cove segments; define follow, detach, duplicate and host-deletion behaviour.
- [ ] Adjust strip length, brightness, colour temperature/colour and beam settings where applicable.
- [ ] Keep lighting presets from overwriting individually authored fixtures.
- [ ] Improve contact and corner shadows, visible edge bevels, glass and room reflections where they materially help.
- [ ] Keep chosen finishes and lighting intent stable between viewport and export; quality tiers primarily change detail and sampling.
- [ ] Establish fixture/shadow budgets and graceful degradation on supported hardware.
- [ ] Generate one authoritative fixture count or strip length for costing, with separate driver/profile/diffuser accessories when selected.

**Gate:** Day and evening versions of the same kitchen, bedroom and living room can be saved and reopened. Under-cabinet lights visibly illuminate the counter and backsplash. Host movement preserves attachments. No duplicate cost is created by a fixture's visible mesh and light source. Performance and visual comparisons meet the baseline targets set in phase 0.

**Implemented checkpoint:** Four editable fixture presets in 3D/Render Studio with saved transforms, brightness, colour and strip length. Automatic attachment, photometric calibration, cost linkage and full visual certification remain open.

**Named open gaps.** Daylight recipes, downlights, pendants, cove and under-cabinet strips, shadow budgets by quality tier, and transmission/clearcoat glass all exist. What is actually missing:

**Closed since the audit.**

- [x] Colour temperature is real. `src/domain/livingRoom/lightColorTemperature.ts` stores Kelvin on the fixture (`parameters.colorTemperatureK`) and derives the colour through a Planckian approximation; the panel offers five labelled presets plus a numeric Kelvin field bounded to 1800–8000 K. Picking a colour by hand clears the saved Kelvin so the control never claims a temperature it does not have.
- [x] The tone control now reflects the saved value instead of resetting to a disabled placeholder.
- [x] Fixture cost linkage: `src/domain/interiorEstimate/measure.ts` emits one line per room light fixture, `lm` from `parameters.widthMm` for strips and `each` otherwise.

**Still open.** Brightness remains a renderer control, not a calibrated lumen value. Driver, profile and diffuser accessories are not costed.

## Phase 5 — Whole-interior costing

**Outcome:** Designers can explain every line of a room-wise or project-wide estimate.

| Item | Quantity basis | Required detail |
| --- | --- | --- |
| Cabinets and wardrobes | Components/materials/hardware | Thickness, finish faces, waste and labour |
| Paint, wallpaper and flooring | Area | Opening deductions, selected faces/zones and waste |
| Ceiling finishes | Area or explicit assembly | Coverage, openings and separation from light fixtures |
| Sofas, beds, appliances and fixtures | Count | Item definition and customer rate |
| LED strips, skirting and trims | Length | Segment totals, joins and accessories |
| Custom work and installation | Explicit line/allowance | Scope, unit and whether it is included |

- [ ] Define units, conversions, quantity precision, price precision and rounding boundaries.
- [ ] Provide customer-editable material, labour, fitting, fixture and service rates.
- [ ] Specify calculation order for waste, labour, allowances, markup, discount and tax.
- [ ] Flag missing rates; distinguish missing from an intentional zero; never silently issue an apparently complete underpriced quote.
- [ ] Link every automatic line to its source room, object/surface/light and measurement rule.
- [ ] Keep manual overrides explicit and preserve their reason and source.
- [ ] Prevent double counting of overlapping surface packs, cabinetry, finish faces, fixtures and accessories.
- [ ] Recalculate affected live estimates after design/rate changes while keeping issued snapshots unchanged.
- [ ] Produce room-wise, category-wise and consolidated summaries.

Area, length, count and component bases all exist, as do waste, labour, markup, discount, tax and finish premium, and `src/domain/interiorEstimate/measure.ts` already carries `source`, `measured`, `unit`, `rate` and per-line waste and deducts opening area from wall faces.

**Closed since the audit.**

- [x] Rates resolve by category. Every measured line now carries a `category` (`surface.wall`, `object.<catalogue-category>`, `light.strip`, and so on) and a `rateSource` of `line`, `category`, `entered` or `missing`. A customer enters one rate per category in the new rate editor and every line in that category resolves from it; a line rate still overrides its category. Clearing a category rate returns its lines to needing a rate rather than charging zero. See `interiorEstimate/categories.ts`, `setEstimateCategoryRate` in `state.ts`, and `InteriorEstimateRates.tsx`.
- [x] Double-charge detection. `interiorEstimate/reconcile.ts` flags custom m² lines and optional finish packs that price a surface the geometry already measured, and the estimate panel shows each conflict. It deliberately does not delete anything, because a second coat or a patch is a legitimate extra line; excluding either side resolves the warning.

**Still open.** Catalogue objects are priced `each × rate`, which matches the quantity-basis table, but a placed kitchen cabinet prop is not a `cabinet` kind and so never reaches component-based costing. That is the same coupling gap as phase 2.

**Gate:** Independently checked fixture quantities and totals match the app. Missing rates are visible before issue. Resizing a room, changing a finish and extending an LED strip each change the expected line once, with no unrelated changes.

## Phase 6 — Client proposals and presentation

**Outcome:** The designer can deliver a consistent, branded proposal from the project.

- [ ] Save named camera views by room and provide a clean client presentation mode.
- [ ] Export representative room images, material schedules, room-wise BOQs and consolidated quotes.
- [ ] Support customer business identity, client details, inclusions, exclusions and editable document references.
- [ ] Preserve quantities, rates, totals and document settings when a quote is frozen.
- [ ] Create explicit revisions and show stale live data without rewriting the issued version.
- [ ] Keep PDF, CSV/Excel and UI totals consistent; label export coverage and failures accurately.
- [ ] Retain image/camera/material provenance so a proposal does not silently mix old renders and new prices.
- [ ] Provide invoice document exports under the customer's identity, without an end-client checkout.

Freeze with fingerprints, revisions, BOQ, invoice documents and render-tier honesty disclaimers all exist.

**Closed since the audit.**

- [x] Frozen quotes keep their own per-line detail. `QuoteSnapshot.detailLines` captures each issued line's kind, label, amount and measurement detail (`quoteSnapshotDetail.ts`, `quoteSnapshotFromQuote.ts`), and the frozen CSV exports them. Snapshots frozen before this existed export totals only and say "Not captured on this revision" on the sheet rather than silently omitting the section. The issued document is now as traceable as the draft it came from.

**Gate:** A designer produces a proposal containing living-room, bedroom and kitchen views plus one reconciled total. Subsequent edits create a new revision; reopening/exporting the old one preserves the original commercial values.

## Phase 7 — Paid Designer release

**Outcome:** A customer can subscribe, learn the app and repeatedly complete real work.

**Blocked on track P.** Nothing in this phase is reachable from the current code: there is no server, plans persist to `localStorage` via `src/domain/saas/accountPersistence.ts`, plan changes go through `stubSetLocalPlan`, and both billing entry points return `provider_not_configured`. Client-side entitlement checks are bypassable and cannot gate paid features.

- [ ] Complete production account lifecycle, authentication, password/session recovery and subscription billing for our software only.
- [ ] Enforce plan entitlements at the authoritative service boundary; local demo controls are not billing enforcement.
- [ ] Provide onboarding, starter projects, guided rate setup and a first-proposal walkthrough.
- [ ] Define local/cloud persistence, upload limits, sync errors, backups, restore and account data export.
- [ ] Define failed renewal, cancellation and downgrade behaviour without silently deleting saved designs or ledger history.
- [ ] Establish error reporting, diagnostics, support intake and recovery instructions.
- [ ] Verify browser/desktop packaging, keyboard access and essential workflows on the supported device matrix.
- [ ] Run paid pilots and record first proposal, second project, support needs and renewal intent.

**Gate:** Phases 1–6 pass across the initial room types; subscription state is enforced; recovery is demonstrated; pilot customers complete a second real project. Production publishing remains a separate owner decision.

## Phase 8 — Professional project and payment management

**Outcome:** A solo business can manage the commercial progress of an interior project.

- [ ] Consolidate client details, project history and quote/document revisions.
- [ ] Distinguish quoted, accepted, invoiced, received and outstanding amounts.
- [ ] Maintain one current commercial obligation per project commercial thread; superseded documents remain historical.
- [ ] Record receipts into the customer's own accounts, including partial payments, payment date, method and reference.
- [ ] Apply receipts FIFO by instalment due date by default; explicit overrides are audited.
- [ ] Calculate overdue from unpaid past-due instalments only, excluding future instalments.
- [ ] Roll quote payments forward to an invoice once; preserve previous allocations on quote revision unless explicitly reallocated.
- [ ] Handle refund, correction, void, cancellation and overpayment/credit display with explicit rules.
- [ ] Retain complete payment create/correct/refund/void/reallocate history, including actor, timestamp and reason where applicable.
- [ ] Provide a basic chronological trail and clear outstanding/overdue reports without requiring Company seats.

**Gate:** The ₹20,000 past-due / ₹80,000 future schedule example, partial receipt, correction, refund, quote revision and quote-to-invoice conversion all reconcile after save/reopen. No payment or obligation is counted twice. Overpayments remain visible even when outstanding is zero.

## Phase 9 — Company collaboration and owner oversight

**Outcome:** A team can safely work on shared projects and owners can trust the reports.

**Blocked on track P.** Seat, permission, shared-project and owner-dashboard logic exists in `src/domain/company/*` with tests, but it operates on local records. `seats.ts` notes that the admin interface is deferred and `approvals.ts` describes itself as workflow stubs. Shared projects, tenant isolation and audit retention are not expressible on `localStorage`.

- [ ] Implement organisations, invitations, seat lifecycle and owner/admin recovery.
- [ ] Enforce tenant isolation and role permissions on the server, including exports and shared asset access.
- [ ] Share projects and price books with explicit ownership and override precedence.
- [ ] Define concurrent editing, version conflicts and change recovery before promising collaboration.
- [ ] Add quote approvals and an explicit policy for changes after approval.
- [ ] Permit payment entry/correction only for authorised roles; retain full history on all Professional+ accounts.
- [ ] Provide owner dashboards with quoted, accepted, invoiced, received, outstanding and overdue values kept separate.
- [ ] Add richer audit filters and reporting on retained data.
- [ ] Define member departure, transfer of ownership, seat reduction and Company downgrade behaviour.

**Gate:** Two separate organisations cannot access each other's data. Owner, designer and viewer journeys enforce their roles. Conflicting edits are recoverable, and owner totals reconcile to current project obligations.

## Track P — Commercial platform

**Outcome:** A hosted authority exists for identity, tenancy, entitlement and subscription state, so phases 7 and 9 can be enforced rather than simulated.

This is not a late phase. It has external lead time (provider onboarding, tax registration, hosting) and it constrains data contracts written in phases 5, 6 and 8, so its design belongs in phase 0 and its build belongs alongside phases 2–6.

- [ ] Choose the hosting and persistence model, and decide what remains local-first. The app is currently a Tauri/browser client with local project files; changing that changes save, recovery and export behaviour.
- [ ] Implement accounts, sessions and recovery as the authority for identity.
- [ ] Move plan and entitlement resolution behind that authority; keep `stubSetLocalPlan` as a development-only path with no production effect.
- [ ] Integrate a real subscription provider behind `startSaaSCheckout` / `openSaaSBillingPortal`, including renewal failure, cancellation and downgrade states.
- [ ] Define tenant ownership and enforce isolation server-side for projects, price books, exports and shared assets.
- [ ] Define sync, conflict, backup, restore and account data export for hosted projects.

**Gate:** A modified client cannot obtain paid capability. Two organisations cannot read each other's data. Subscription lapse and downgrade change capability without destroying saved designs or ledger history.

## Phase 10 — Production and contractor handoff

**Outcome:** Approved designs can be handed over without re-entering their basic information.

- [ ] Verify cabinet and wardrobe cutlists, board thicknesses, grain direction, edge treatment and hardware schedules.
- [ ] Produce labelled room/object drawings, measurements and assembly references where supported.
- [ ] Separate design estimates from manufacturing-ready quantities and explicit workshop assumptions.
- [ ] Generate contractor-specific schedules for finishes, lighting and installation quantities.
- [ ] Include document revision, units, exclusions and source project references in handoff exports.
- [ ] Review output with workshops/contractors using representative jobs before labelling it production-ready.

**Gate:** A workshop can trace each manufacturing line to the approved revision, and contractor quantities reconcile with the proposal. Unsupported services are clearly outside the handoff's coverage.

## Phase 11 — Expansion and repeatable growth

**Outcome:** Expand the product based on demonstrated repeat use and customer value.

- [ ] Prioritise additional room types and specialist libraries from paid-customer demand.
- [ ] Add reusable company templates and customer/manufacturer catalogue imports with provenance and asset rights recorded.
- [ ] Develop selected accounting/export integrations without introducing end-client payment processing.
- [ ] Improve large-project performance, asset loading and storage based on measured bottlenecks.
- [ ] Test onboarding, upgrade packaging and pricing with paying cohorts; document assumptions and results.
- [ ] Develop repeatable acquisition and customer education after retention evidence exists.
- [ ] Track support cost, infrastructure cost and margin alongside subscription growth.

**Gate:** Expansion has a named customer problem, adoption evidence and acceptable support/performance cost. A large catalogue or new feature count alone is not a success criterion.

## 4. Cross-phase acceptance suite

Maintain versioned projects and expected results rather than relying only on isolated unit tests.

| Fixture | Checks |
| --- | --- |
| Living room | Furniture layout, TV millwork, upholstery, wood/paint, daylight and evening lights |
| Bedroom | Wardrobe/bed clearances, independent finish slots, bedside lights and saved views |
| Kitchen | Cabinet quantities, laminate grain, worktop/backsplash, under-cabinet lighting and strip costs |
| Multi-room home | Shared topology, room-local edits, room-wise totals and consolidated proposal |
| Irregular/transformed room | Concave boundaries, holes, translated geometry, opening placement and fixture positioning |
| Commercial history | Freeze/revise/accept/invoice, FIFO overdue, correction/refund and audit retention |
| Company boundary | Roles, tenant isolation, concurrent edits and owner-report reconciliation |

### Gate verification commands

Every gate must name a command that a reviewer can run. Prose completion goals do not close a phase. The repository already carries this pattern; reuse it rather than inventing new evidence formats.

| Gate area | Command |
| --- | --- |
| Domain calculations and mutations | `npx vitest run src/domain/<area>` |
| Catalogue integrity and coverage | `npm run catalog:verify` |
| Room-to-proposal journey | `npm run test:golden` |
| Render/material scale and asset presence | `npm run qa:assets`, `npm run qa:render`, `npm run qa:smoke` |
| Presentation package output | `npm run presentation:check`, `npm run presets:check` |
| Performance and latency baselines | `npm run phase1:proof`, `npm run phase1:latency`, `npm run phase2:proof` |
| Full release candidate | `npm run release:check` |

Where no command exists for a gate — currently true for the phase-2 catalogue coverage targets, the phase-3 grain and rotation behaviour, and everything in track P — writing that check is part of the phase, not a follow-up.

For each feature, select checks proportionate to the risk: domain tests for calculations and mutations, browser tests for real user journeys, visual comparison for materials/lighting/documents, and persistence checks for saved data. Record device, runtime and fixture version. Set quantitative performance targets from phase-0 baselines; do not invent passing thresholds after testing.

## 5. Milestones and business evidence

| Milestone | Scope | Evidence required |
| --- | --- | --- |
| Design pilot | 1–4 | Users can furnish and present the three initial room types |
| Proposal pilot | 1–6 | Independently checked quantities, costs and reproducible proposals |
| Paid Designer | 7 plus gates for 1–6 **and track P** | Real subscriptions, successful recovery and repeated projects |
| Professional | 8 | Reconciled client/payment workflows used during actual jobs |
| Company | 9 | Trusted shared work, permissions and owner reports |
| Production expansion | 10–11 | Reviewed handoff outputs and retained-customer demand |

Measure time to first usable proposal, second-project completion, paid retention, app-caused quote corrections, support time per account and Professional/Company upgrades. Separate these from rendering speed and technical reliability. Subscription revenue is the business metric; homeowner payment volume is not our revenue.

## 6. Next implementation sequence

The first commercial milestone runs as three concurrent tracks, not as a walk from 1 to 7.

**Track A — catalogue and object costing (the real gap).** Add wardrobes, dining, counters and shelving; tag items by room; route kitchen and wardrobe units through the parametric cabinet engine so placement produces components, hardware and cost together; make flooring and wallpaper measure from room surfaces instead of manual BOQ SKUs.

**Track B — wiring over existing domains.** Surface the built price-book, estimate, quote-freeze, client-history and payment-ledger logic in the interface and verify the living-room, bedroom and kitchen design-to-proposal journeys end to end. Close the frozen-export line-detail hole. This is not new domain construction.

**Track C — platform.** Start track P now because of its lead time. Phases 7 and 9 cannot begin without it.

**Punch list — done.** The material and lighting items are closed: grain direction and UV rotation now reach the renderer on both paths, wallpaper, acrylic and tile are real material kinds with selectable seed materials, Kelvin is stored and converted, and fixture count and strip length emit cost lines. Category rate resolution, double-charge detection and frozen per-line detail landed with them. What remains of those areas is listed under each phase as "still open".

**Standing debt.** Execute the phase-0 decision on the dual document model before track A widens it. Roughly twenty source files exceed this repository's own 200-line ceiling, led by `src/hooks/useLivingRoomPlanEditor.ts` (924), `src/domain/livingRoom/index.ts` (913) and `src/App.tsx` (697); split them as the tracks touch them rather than in a separate cleanup pass.

Update the delivery tracker after each reviewable checkpoint with changed scope, test evidence and remaining limitations. Keep implementation local on the working branch. Commit, push, merge, deploy and paid-launch status must be reported separately; this document does not authorise an external launch.
