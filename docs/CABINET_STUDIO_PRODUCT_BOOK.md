# Cabinet Studio Product and Development Book

**Document role:** Canonical product, workflow, domain, and delivery specification  
**Product focus:** Cabinet proposal-to-production  
**Baseline date:** 2026-08-30  
**Book version:** 1.0.0  
**Owner:** Product and engineering  
**Status:** Accepted strategic baseline; implementation status is recorded per requirement  
**Last implementation cross-check:** 2026-08-30  

---

## 0. How to use this book

### 0.1 Purpose

This book defines the product Cabinet Studio is intentionally becoming.

It exists to prevent five recurring failures:

1. Building disconnected features without improving the buyer's job.
2. Confusing implemented code with a market-ready workflow.
3. Confusing visual polish with cabinet-specific commercial value.
4. Allowing multiple data models to disagree about dimensions, materials, or price.
5. Reopening settled decisions without new customer evidence.

The book is intentionally detailed.

It should be usable by:

- Product owners deciding what to build next.
- Engineers implementing a requirement.
- Designers defining interaction and presentation behavior.
- QA engineers deriving acceptance tests.
- Reviewers checking whether a release improves the cabinet-sales wedge.
- Future contributors learning the product without reconstructing intent from code.

### 0.2 Canonical product promise

> A cabinet salesperson can measure a room, build a credible cabinet run, present it to a client, price it, and hand the same design to engineering without re-entering the design.

Everything in this book must strengthen that promise.

### 0.2A Related canonical book

Accounts, organizations, subscriptions, licensing, backend APIs, cloud sync,
cloud assets, security operations, and commercial-platform requirements are
defined in the [Backend, SaaS and Commercial Platform Book](./BACKEND_SAAS_COMMERCIAL_PLATFORM_BOOK.md).

That companion book does not redefine cabinet geometry or buyer workflow. This
book does not claim its hosted target capabilities are already shipped.

### 0.3 Document precedence

When sources disagree, use this order:

1. A newer explicit decision recorded in this book.
2. A domain ADR governing data safety or geometry correctness.
3. The current validated implementation and its tests.
4. Existing product-decision documents.
5. Historical phase roadmaps.
6. Screenshots, mockups, or informal notes.

This ordering does not permit the book to lie about shipped behavior.

If the target behavior differs from current behavior:

- The target must be labeled `NEXT` or `LATER`.
- The current behavior must be described honestly.
- The migration or transition must be recorded.

### 0.4 Status vocabulary

Every material capability should use one of these statuses.

| Status | Meaning |
| --- | --- |
| `SHIPPED` | Implemented and covered by meaningful automated or manual verification. |
| `HARDEN` | Implemented in some form, but correctness, reliability, usability, or release confidence is incomplete. |
| `NEXT` | Approved for the immediate cabinet proposal-to-production program. |
| `LATER` | Valuable after the current critical path, but not authorized for the immediate sprint. |
| `RESEARCH` | Requires customer or technical evidence before commitment. |
| `EXCLUDED` | Deliberately outside the current product strategy. |
| `REMOVED` | Previously present or proposed and intentionally retired. |

### 0.5 Requirement language

The words in this book have specific force.

- **Must** means mandatory when the requirement's governing milestone enters scope.
- A **must** blocks a release only when it is mapped to that release's active gate or P0 checklist.
- Requirements assigned to `LATER` or `RESEARCH` do not block the current release.
- **Should** means expected unless a documented tradeoff is approved.
- **May** means optional.
- **Must not** means prohibited.
- **Current** describes observed implementation.
- **Target** describes approved future behavior.

Appendix A and the gates in Section 42 define the current release-blocking set.

The presence of the word **must** elsewhere does not place every future requirement into the current sprint.

### 0.6 Requirement identifiers

Requirement IDs are stable references.

Prefixes:

- `STR` — strategy.
- `USR` — user and job.
- `WF` — end-to-end workflow.
- `IA` — information architecture.
- `DAT` — data and truth.
- `CAB` — cabinet authoring.
- `RUN` — cabinet runs.
- `VIS` — visual representation.
- `RND` — client rendering.
- `QTE` — costing and quotation.
- `ENG` — engineering handoff.
- `PRD` — production.
- `REV` — review and approval.
- `EXP` — export and package.
- `REL` — reliability and performance.
- `TST` — testing.
- `OBS` — observation and product analytics.
- `SEC` — security and privacy.
- `ACC` — accessibility.
- `AST` — 3D asset import and catalog.
- `OPS` — release and operations.

IDs must not be renumbered after implementation begins.

Deprecated IDs remain in the book with a replacement reference.

### 0.7 Change process

A material change to this book must include:

1. The decision being changed.
2. The customer or technical evidence.
3. The requirements affected.
4. The migration impact.
5. The test impact.
6. The release impact.

Pure editorial fixes do not require a decision record.

Routine feature-register maintenance also does not require a decision record.

The following use the status-update template in Appendix B:

- Status changes supported by implementation evidence.
- Evidence-link updates.
- Test-reference updates.
- Known-limitation updates.
- `SHIPPED` to `HARDEN` corrections.
- `HARDEN` to `SHIPPED` promotions after verification.

Decision records are reserved for changes to strategy, product segment, architectural ownership, requirement meaning, scope boundary, or release policy.

### 0.8 Definition of source of truth

This book is the source of truth for product intent.

The project document is the source of truth for a user's authored design.

Generated artifacts are views of that truth.

They are not alternate editable truths.

---

## 1. Executive product definition

### 1.1 Product category

Cabinet Studio is a cabinet-sales and cabinet-engineering workflow with an interior context.

It is not primarily:

- A consumer home-decoration application.
- A furniture marketplace.
- A real-estate floor-plan service.
- A generic architectural BIM platform.
- A photoreal image generator.
- A complete manufacturing execution system.

### 1.2 Primary customer

The primary customer is a custom cabinet or millwork business.

The primary daily user is a salesperson-designer who:

- Visits or receives measurements from a site.
- Turns measurements into a cabinet concept.
- Reviews the concept with a client.
- Revises cabinet sizes, fronts, materials, and layout.
- Creates a price or proposal.
- Hands approved work to an engineer or workshop.

### 1.3 Secondary users

Secondary users include:

- Cabinet engineer.
- Production planner.
- Workshop manager.
- Business owner.
- Interior designer working with a cabinet shop.
- Client reviewing a proposal.

### 1.4 Primary job

The primary job is:

> Convert a measured room and cabinet brief into an approved, priced, and technically reusable cabinet proposal.

### 1.5 Primary business outcome

The product should reduce:

- Time from measurement to proposal.
- Duplicate data entry.
- Quotation mistakes.
- Visual misunderstandings.
- Engineering redraw work.
- Production changes caused by sales-design drift.

### 1.6 Primary product outcome

The same cabinet configuration must drive:

- 2D footprint.
- Elevation representation.
- 3D geometry.
- Cabinet schedule.
- Cost calculation.
- Selling-price calculation.
- Cutlist.
- Hardware schedule.
- Material summary.
- Production packet.
- Future machining intent.

### 1.7 Current buyer-weighted baseline

As of the baseline date:

| Lens | Score | Interpretation |
| --- | ---: | --- |
| General interiors | 6.1 / 10 | Capable MVP, materially behind mature category leaders. |
| Cabinet-sales wedge | 6.5 / 10 | Promising narrow advantage, not yet validated or defensible. |

These scores are strategic baselines.

They are not telemetry.

They must not be presented as customer research.

### 1.8 Target position

The near-term target is not general-interiors parity.

The target is:

> The fastest trustworthy proposal-to-engineering workflow for a small custom cabinet shop.

### 1.9 Strategic requirements

- `STR-001` — The product must optimize for cabinet-sales completion before general-interiors breadth.
- `STR-002` — Every major feature must state which primary workflow step it improves.
- `STR-003` — A feature that improves no primary workflow metric must not enter the immediate roadmap.
- `STR-004` — The product must not claim category parity with Floorplanner, Planner 5D, or RoomSketcher.
- `STR-005` — The cabinet-sales advantage must be treated as provisional until validated with real users.
- `STR-006` — Cabinet truth must be reusable downstream without manual re-entry.
- `STR-007` — Visual output must be credible enough for a client meeting.
- `STR-008` — Production output must be labeled according to its actual verification level.
- `STR-009` — AI decoration is excluded from the current critical path.
- `STR-010` — A large general furniture catalog is excluded from the current critical path.

---

## 2. Competitive boundary

### 2.1 Why broad competition is rejected

Mature general-interiors competitors already have substantial advantages in:

- Generic room authoring.
- Catalog breadth.
- Cloud project sharing.
- Consumer onboarding.
- Cross-platform availability.
- Photoreal output.
- 360-degree presentation.
- Real-estate deliverables.
- Retail integrations.
- Public templates and content ecosystems.

Attempting to match all of those advantages would dilute the product.

### 2.2 Competitor strengths to respect

#### Floorplanner

Floorplanner is strong in:

- Fast 2D space planning.
- Large product and material libraries.
- 2D and 3D exports.
- High-resolution rendering.
- Interactive tours.
- Retail and enterprise integration.
- Portable floor-plan data through FML.

#### Planner 5D

Planner 5D is strong in:

- Consumer-friendly design.
- Large decor catalog.
- High-quality rendering.
- Cross-platform use.
- CAD-oriented professional export.
- Price and specification tools.
- Business catalogs and itemized sales data.

#### RoomSketcher

RoomSketcher is strong in:

- Professional floor plans.
- Blueprint-based creation.
- Measurement and total-area workflows.
- Branded outputs.
- Live 3D.
- 360-degree views.
- Real-estate presentation.

### 2.3 Chosen competitive gap

Cabinet Studio should own the continuity between:

```text
Measured room
  → configured cabinet
  → cabinet run
  → client-approved visual
  → priced proposal
  → engineering model
  → production information
```

### 2.4 What is not a moat

The following are not sufficient moats by themselves:

- Millimetre storage.
- A cabinet-shaped box.
- A CSV containing width, height, and depth.
- A large number of internal validation tests.
- Render provenance.
- A dark professional-looking interface.
- A feature checklist.
- An isolated cutlist generator.

### 2.5 What can become a moat

The combination can become defensible when:

- Cabinet configuration is structurally correct.
- Sales visuals represent the same configuration.
- Price responds to the same construction.
- Engineering can continue without recreation.
- Workshop outputs can be traced to the approved revision.
- The workflow is faster than manual CAD-plus-spreadsheet practice.

### 2.6 Competitive guardrails

- `STR-020` — Do not prioritize furniture count as a headline KPI.
- `STR-021` — Do not prioritize AI room decoration before the cabinet loop is validated.
- `STR-022` — Do not chase 360 tours before client proposal completion is reliable.
- `STR-023` — Do not build a second editable scene for presentation.
- `STR-024` — Do not hide incorrect cabinet semantics behind attractive geometry.
- `STR-025` — Do not expose workshop exports as verified CNC unless verified CNC exists.
- `STR-026` — Do not claim quote accuracy without configurable local rates and user review.
- `STR-027` — Do not market a narrow lead as a proven market lead.

---

## 3. Users and responsibilities

### 3.1 Salesperson-designer

The salesperson-designer owns:

- Customer brief.
- Site dimensions or imported room information.
- Initial room layout.
- Cabinet selection.
- Cabinet run composition.
- Client-facing materials and fronts.
- Proposal views.
- Commercial allowances.
- Proposal generation.
- Revision conversation.

The salesperson-designer should not need to own:

- Part-level machining.
- CNC post-processing.
- Detailed workshop nesting decisions.
- Hidden schema repair.
- Manual synchronization between presentation and engineering.

### 3.2 Cabinet engineer

The cabinet engineer owns:

- Construction method.
- Detailed opening composition.
- Joinery.
- Hardware compatibility.
- Appliance clearances.
- Part validation.
- Technical drawing approval.
- Production-release readiness.

### 3.3 Production planner

The production planner owns:

- Material confirmation.
- Sheet stock.
- Yield review.
- Edge-banding review.
- Hardware procurement review.
- Machining interpretation.
- Production packet release.

### 3.4 Business owner

The business owner owns:

- Costing presets.
- Markup policy.
- Tax policy.
- Discount policy.
- Standard inclusions.
- Standard exclusions.
- Quote validity.
- Approval permissions.

### 3.5 Client

The client should be able to understand:

- What is proposed.
- How it fits the room.
- What materials and fronts are selected.
- What is included.
- What is excluded.
- What the price is.
- Which revision is being approved.

The client should not see:

- Internal debugging data.
- Unsupported manufacturing certainty.
- Render provenance jargon.
- Incomplete technical controls.

### 3.6 User requirements

- `USR-001` — Sales users must be able to finish the golden workflow without entering the engineering workbench.
- `USR-002` — Engineers must be able to continue from the approved sales design without recreating cabinets.
- `USR-003` — Production users must be able to identify the revision behind every workshop artifact.
- `USR-004` — Clients must receive a presentation artifact that is understandable without the application.
- `USR-005` — Business owners must be able to configure commercial rules without modifying code.
- `USR-006` — Role boundaries must not create separate dimensional truths.

---

## 4. Golden workflow

### 4.1 Workflow summary

The golden workflow is:

```text
Job
  → Room
  → Cabinet Run
  → Review
  → Proposal
  → Approval
  → Engineering
  → Production
```

### 4.2 Step 1 — Create job

Required information:

- Customer name.
- Project number.
- Revision.
- Job status.
- Notes.

Expected behavior:

- A job begins in Draft.
- Creation time is recorded.
- Project number can be blank during exploration.
- Proposal release should require a customer or project identifier.

### 4.3 Step 2 — Define room

The user may:

- Start from a room template.
- Draw a rectangular room.
- Draw a polygonal room.
- Import and calibrate an underlay.
- Place doors and windows.
- Set wall height and thickness.
- Confirm measurement units.

The room must remain editable after cabinets are placed.

Cabinets must reflow or raise explicit warnings when their host wall changes.

### 4.4 Step 3 — Build cabinet run

The user:

- Selects a cabinet family.
- Places cabinets against a wall.
- Snaps cabinets into a run.
- Adjusts width, height, and depth.
- Adds or removes fronts, drawers, and shelves.
- Selects materials.
- Adds fillers.
- Adds countertop where applicable.
- Resolves collisions and clearance warnings.

### 4.5 Step 4 — Review in 3D

The user:

- Switches to 3D without conversion.
- Sees cabinet-specific geometry.
- Selects the same cabinet object.
- Verifies proportions and room relationship.
- Chooses client-facing materials.
- Saves proposal cameras.

### 4.6 Step 5 — Price proposal

The user:

- Reviews workshop cost.
- Reviews cabinet line prices.
- Adjusts permitted commercial settings.
- Confirms markup.
- Confirms discount.
- Confirms tax.
- Confirms inclusions and exclusions.
- Sees the final selling total.

### 4.7 Step 6 — Create proposal

The proposal contains:

- Customer and project identity.
- Revision.
- Named proposal views.
- Cabinet summary.
- Material summary.
- Cabinet line pricing or chosen commercial summary.
- Total price.
- Validity date.
- Inclusions.
- Exclusions.
- Approval field.

### 4.8 Step 7 — Capture approval

Approval must:

- Identify the revision.
- Freeze a comparison fingerprint.
- Record approver name when available.
- Record timestamp.
- Preserve open warnings.
- Block production release when blockers remain.

### 4.9 Step 8 — Send to engineering

The engineering handoff must carry:

- Room geometry.
- Openings.
- Cabinet identities.
- Cabinet types.
- Cabinet configuration.
- Cabinet placement.
- Materials.
- Hardware.
- Run membership.
- Fillers.
- Countertops.
- Approved revision.
- Commercial context where permitted.

### 4.10 Step 9 — Prepare production

Production preparation may include:

- Cabinet marks.
- Cabinet schedule.
- Cutlist.
- Hardware schedule.
- Material summary.
- Sheet-yield estimate.
- Technical drawings.
- Production packet.
- Machine-intent preview.

### 4.11 Workflow requirements

- `WF-001` — The golden workflow must be completable in one project file.
- `WF-002` — No step may require manual re-entry of cabinet dimensions.
- `WF-003` — No step may create an unlinked copy of a cabinet.
- `WF-004` — Every output must identify project and revision.
- `WF-005` — Every blocking conflict must be visible before proposal or production release.
- `WF-006` — Proposal generation must not silently omit selected cabinets.
- `WF-007` — Engineering handoff must preserve stable cabinet IDs.
- `WF-008` — A sales revision must be comparable with the previously quoted revision.
- `WF-009` — Production release must be a distinct action from proposal generation.
- `WF-010` — The application must explain whether an output is sales-ready, engineering-ready, or preview-only.

---

## 5. Success metrics

### 5.1 North-star metric

**Median elapsed time from validated room start to proposal-ready cabinet job.**

Initial target:

- Less than 15 minutes for the Golden Cabinet Run v1 benchmark.

### 5.2 Primary workflow metrics

- Time to first valid cabinet run.
- Time to first client-ready 3D view.
- Time to priced proposal.
- Number of dimensional re-entry events.
- Number of blocking issues at proposal time.
- Number of engineering corrections caused by handoff loss.
- Percentage of proposals completed without application restart.
- Percentage of projects reopened without data repair.

### 5.3 Quality metrics

- Cabinet type round-trip accuracy.
- Dimension round-trip accuracy.
- Material round-trip accuracy.
- Front and opening round-trip accuracy.
- Quote reproducibility for the same revision and settings.
- Cutlist reproducibility for the same revision.
- Proposal-to-engineering object identity preservation.

### 5.4 Commercial metrics

- Proposal turnaround time.
- Proposal revision turnaround time.
- Quote acceptance rate.
- Average revisions before approval.
- Sales-to-engineering handoff time.
- Percentage of approved jobs released without redraw.

### 5.5 Research metrics

- System Usability Scale or equivalent task questionnaire.
- User confidence in shown cabinet geometry.
- User confidence in quote completeness.
- Client comprehension of proposal.
- Engineer confidence in handoff completeness.

### 5.6 Anti-metrics

The following must not be used as primary success metrics:

- Number of catalog objects.
- Number of toolbar commands.
- Number of automated tests alone.
- Number of render presets.
- Number of document pages.
- Number of roadmap items marked done.
- Number of AI features.

### 5.7 Metric requirements

- `OBS-001` — The golden workflow must have a repeatable timed benchmark.
- `OBS-002` — Benchmark timing must separate user think time from application wait time where possible.
- `OBS-003` — A run must record corrections, errors, and abandoned actions.
- `OBS-004` — At least five real cabinet-sales users must complete the benchmark before claiming a validated wedge.
- `OBS-005` — At least two cabinet engineers must review handoff artifacts.
- `OBS-006` — Score changes must reference observed evidence.

---

## 6. Information architecture

### 6.1 Workbench model

The current application contains these workbench modes:

1. Job.
2. Room.
3. Interiors.
4. Cabinets.
5. Drawings.
6. Production.
7. Reports.

The target keeps these capabilities but makes the golden workflow obvious.

### 6.2 User-facing workflow labels

Recommended primary navigation:

1. Job.
2. Room.
3. Design.
4. Review.
5. Proposal.
6. Engineering.
7. Production.

Internal workbench names may remain in code during migration.

### 6.3 Mapping

| User-facing step | Current workbench or surface | Product purpose |
| --- | --- | --- |
| Job | Job | Customer, project, revision, status. |
| Room | Room + Interiors Build | Measured shell and openings. |
| Design | Interiors Design + Cabinets | Cabinet run authoring. |
| Review | Interiors 3D + Render | Client visual review. |
| Proposal | Reports + client package | Commercial presentation. |
| Engineering | Cabinets + Drawings | Detailed cabinet definition. |
| Production | Production + Reports | Workshop preparation. |

### 6.4 Navigation rules

- `IA-001` — The primary workflow order must be visible.
- `IA-002` — Users may move backward without losing downstream work.
- `IA-003` — Moving forward must surface unresolved blockers.
- `IA-004` — The current revision and job status must remain visible.
- `IA-005` — The selected room must remain visible.
- `IA-006` — The selected cabinet must remain stable across compatible 2D and 3D views.
- `IA-007` — Production-only controls must not crowd the sales design surface.
- `IA-008` — Advanced controls must remain discoverable from the relevant cabinet.
- `IA-009` — Export actions must use outcome names, not file-format names as the primary label.
- `IA-010` — “Create Proposal” must be more prominent than raw CSV export.

---

## 7. Canonical data truth

### 7.1 Core rule

There is one canonical authored project.

All views and artifacts derive from it.

### 7.2 Current transition

The repository currently includes:

- `InteriorProject` for interior and room authoring.
- `CabinetProject` for detailed cabinet engineering and workshop domains.
- A compatibility adapter between them.

The target is not to maintain two competing truths.

The target is a canonical project with lossless cabinet detail.

### 7.3 Truth hierarchy

For each domain:

| Domain | Authoritative source |
| --- | --- |
| Room geometry | Canonical project room topology. |
| Cabinet identity | Stable cabinet entity ID. |
| Cabinet family | Explicit cabinet family/type field. |
| Dimensions | Cabinet configuration in millimetres. |
| Placement | Canonical cabinet transform and host relation. |
| Front composition | Structured opening composition. |
| Construction | Cabinet construction specification. |
| Hardware | Cabinet hardware specification. |
| Material | Stable material IDs and build rules. |
| Price | Derived from configuration plus versioned commercial settings. |
| Cutlist | Derived from cabinet construction. |
| Render mesh | Derived from cabinet configuration or linked asset binding. |

### 7.4 Prohibited derivations

The product must not infer technical identity from presentation labels when an explicit field can exist.

Examples of prohibited behavior:

- Inferring cabinet type from a generic category such as `storage`.
- Inferring wall attachment only from current Y position.
- Inferring a cabinet SKU from its display name.
- Inferring material thickness from a color swatch.
- Inferring quote revision from export time.

### 7.5 Stable identity

Stable IDs must survive:

- Save and reopen.
- 2D to 3D switching.
- Proposal generation.
- Engineering handoff.
- Revision snapshots.
- Cutlist generation.
- Production packet generation.

### 7.6 Units

- Project geometry is stored in millimetres.
- UI may display configured units.
- Conversion occurs at the presentation boundary.
- Derived outputs must state units.
- No silent unit conversion is permitted.

### 7.7 Data requirements

- `DAT-001` — Every cabinet must have an explicit cabinet type.
- `DAT-002` — Every cabinet must have a stable ID.
- `DAT-003` — Every cabinet must carry or resolve a complete normalized cabinet configuration.
- `DAT-004` — Generic display category must not replace cabinet type.
- `DAT-005` — Catalog ID, SKU, cabinet type, and category must be separate concepts.
- `DAT-006` — Cabinet configuration must be JSON-safe.
- `DAT-007` — Saved projects must carry a schema version.
- `DAT-008` — Schema changes must include migrations.
- `DAT-009` — Old projects must open without manual JSON editing.
- `DAT-010` — Derived outputs must not mutate the authored project.
- `DAT-011` — Pricing settings must be stored separately from dimensional truth.
- `DAT-012` — Quote snapshots must freeze commercial results for a revision.
- `DAT-013` — Production artifacts must be reproducible from project revision and settings.
- `DAT-014` — The adapter must report lossy conversions.
- `DAT-015` — Silent fallback to a different cabinet family is prohibited.

---

## 8. Cabinet object model

### 8.1 Cabinet identity fields

Every cabinet object should contain or resolve:

- Stable object ID.
- Catalog item ID.
- SKU where applicable.
- Cabinet type.
- Cabinet family.
- Human-readable name.
- Room ID.
- Run ID where applicable.
- Placement.
- Dimensions.
- Composition.
- Construction.
- Hardware.
- Materials.
- Commercial metadata where permitted.

### 8.2 Cabinet type vocabulary

Current supported technical types include:

- Base.
- Wall.
- Tall.
- Drawer.
- Sink.
- Corner.
- Open shelf.
- Almirah or wardrobe.

Non-storage scene types may exist in the shared project but must not be treated as production cabinets.

### 8.3 Cabinet family versus type

Cabinet type describes technical behavior.

Cabinet family describes a reusable product or construction family.

Example:

```text
Type: base
Family: frameless-standard-base
SKU: BS-900-2D1DR
Display name: Base Cabinet 900 · 2 Doors + 1 Drawer
```

### 8.4 Cabinet dimensions

Required dimensions:

- Width.
- Height.
- Depth.
- Board thickness.
- Back-panel thickness.

Additional structural dimensions may include:

- Toe-kick height.
- Toe-kick inset.
- Face-frame stile width.
- Face-frame rail width.
- Appliance envelope.

### 8.5 Composition

Composition may include:

- Doors.
- Drawers.
- Shelves.
- Openings.
- Dividers.
- Appliance gaps.
- Open shelf zones.

The structured opening model is authoritative over flat display counts when both exist.

Flat counts may remain as compatibility fields during migration.

### 8.6 Construction

Construction includes:

- Frameless or face-frame carcass.
- Case joinery.
- Door mount.
- Shelf mount.
- Drawer-box style.
- Face-frame dimensions.

### 8.7 Hardware

Hardware may include:

- Hinges.
- Drawer slides.
- Handles.
- Legs.
- Brackets.
- Shelf pins.
- Accessories.
- Appliance insert.

### 8.8 Material slots

Minimum cabinet material roles:

- Carcass.
- Fronts.
- Back.
- Shelves.
- Drawer boxes.
- Countertop where applicable.
- Edge treatment where applicable.

### 8.9 Cabinet requirements

- `CAB-001` — Base, wall, tall, drawer, sink, corner, open-shelf, and wardrobe types must remain distinguishable.
- `CAB-002` — Type must survive save, reopen, adapter conversion, and export.
- `CAB-003` — Width, height, and depth edits must update all derived representations.
- `CAB-004` — Door, drawer, and shelf edits must update 3D and production derivations.
- `CAB-005` — Construction changes must update cut parts.
- `CAB-006` — Hardware changes must update hardware schedule and cost.
- `CAB-007` — Material changes must update visuals, cutlist labels, and cost where configured.
- `CAB-008` — Unsupported combinations must produce explicit validation.
- `CAB-009` — Cabinet defaults must be family-specific.
- `CAB-010` — A catalog item must not rely on a generic fallback for its technical type.
- `CAB-011` — Cabinet copies must receive new stable IDs.
- `CAB-012` — Cabinet marks are derived per revision and must remain traceable to IDs.
- `CAB-013` — Wall cabinets must preserve wall attachment.
- `CAB-014` — Floor cabinets must preserve floor attachment.
- `CAB-015` — Corner cabinets must identify their corner relationship.

---

## 9. Golden Cabinet Run v1

### 9.1 Purpose

Golden Cabinet Run v1 is the first market-hardened slice.

It is deliberately smaller than the complete catalog.

### 9.2 Locked first-pilot segment

The first pilot is a **straight kitchen-style cabinet run authored inside the Interiors room workflow**.

This is a product decision, not an open segment question.

The first pilot is not:

- A living-room media-wall pilot.
- A wardrobe-internals pilot.
- A whole-kitchen planning pilot.
- A general interiors pilot.

The room may use the existing Interiors shell and room-authoring capabilities.

The cabinet brief is kitchen-style because it exercises the product's most important technical continuity:

- Floor cabinets.
- Wall-mounted cabinets.
- Tall storage.
- Drawer hardware.
- Fillers.
- Countertop.
- Pricing.
- Cut parts.
- Engineering reuse.

### 9.3 Included cabinet families

The first run includes:

- Standard base cabinet.
- Drawer base cabinet.
- Standard wall cabinet.
- Standard tall cabinet.
- Left filler.
- Right filler.
- Continuous countertop over eligible floor cabinets.

### 9.4 Deferred from the first run

- Sink cabinet.
- Blind corner.
- Diagonal corner.
- Appliance tower.
- Curved fronts.
- Radius end cabinet.
- Integrated lighting.
- Complex wardrobe internals.
- Island layout.

These are `LATER` unless required by pilot evidence.

### 9.5 Golden room

The benchmark room should contain:

- One straight usable wall.
- One adjacent wall.
- One door.
- One window or obstruction.
- Metric dimensions.
- A known wall length that forces filler calculation.

### 9.6 Golden brief

The benchmark brief should require:

- One tall unit.
- Two base units.
- One drawer unit.
- Two wall units.
- Fillers at both ends where needed.
- One material change.
- One cabinet width revision.
- One saved proposal camera.
- One priced proposal.
- One engineering handoff.

### 9.7 Golden output

The benchmark must produce:

- Validated room plan.
- Cabinet run.
- 3D client view.
- Cabinet schedule.
- Quote.
- Branded proposal PDF.
- Engineering-ready project state.
- Cutlist preview.
- Production readiness summary.

### 9.8 Golden acceptance

- `WF-020` — A trained salesperson must complete the benchmark in under 15 minutes.
- `WF-021` — No cabinet dimension may be re-entered after initial configuration.
- `WF-022` — Every cabinet must retain its technical type.
- `WF-023` — The 3D view must visibly distinguish base, wall, drawer, and tall units.
- `WF-024` — The quote must update after the required width revision.
- `WF-025` — The cutlist must update after the required width revision.
- `WF-026` — Engineering must open the same cabinet IDs.
- `WF-027` — Saving and reopening must preserve the workflow state.
- `WF-028` — Proposal and production artifacts must identify the same revision.

---

## 10. Job management features

### 10.1 Current capability

Current job metadata includes:

- Customer name.
- Project number.
- Revision.
- Status.
- Notes.
- Created timestamp.
- Updated timestamp.
- Quoted timestamp.
- Approved timestamp.
- Production timestamp.

### 10.2 Job statuses

Supported status sequence:

```text
Draft → Quoted → Approved → Production
```

Backward transitions may be allowed with an audit event.

### 10.3 Target behavior

- Job identity is created once.
- Job identity appears on proposal and workshop outputs.
- Status changes are explicit.
- Quoting creates or updates a frozen quote snapshot.
- Approval freezes a revision snapshot.
- Production release requires release gates.

### 10.4 Job requirements

- `WF-030` — New jobs default to Draft.
- `WF-031` — Quoted status must record a quote timestamp.
- `WF-032` — Approved status must record an approval timestamp.
- `WF-033` — Production status must record a production timestamp.
- `WF-034` — Status changes must not silently rewrite earlier timestamps.
- `WF-035` — Proposal output must display customer, project number, and revision when present.
- `WF-036` — Production output must require a project number.
- `WF-037` — Production release must require an approved or explicitly overridden state.
- `WF-038` — Override actions must be recorded.

---

## 11. Room authoring features

### 11.1 Room creation

The product supports or targets:

- Blank room.
- Rectangular draw.
- Polygon draw.
- Starter templates.
- Underlay import.
- Underlay calibration.

### 11.2 Wall authoring

Wall features include:

- Draw wall.
- Move wall.
- Move node.
- Split wall.
- Join nodes.
- Delete wall.
- Set thickness.
- Set height.
- Shared-edge behavior.
- Room splitting.
- Room merging with known limitations.

### 11.3 Openings

Opening features include:

- Door placement.
- Window placement.
- Wall attachment.
- Offset editing.
- Width editing.
- Height editing.
- Sill-height editing.
- Swing direction where relevant.

### 11.4 Measurement behavior

- Dimensions must state units.
- Wall lengths must be derived from topology.
- Cabinet runs must use the same wall geometry.
- Underlay calibration must not alter existing cabinet millimetres silently.

### 11.5 Room requirements

- `WF-040` — A wall used by a cabinet run must have stable identity.
- `WF-041` — Moving a host wall must reflow or invalidate attached cabinets explicitly.
- `WF-042` — Deleting a host wall must not orphan cabinets silently.
- `WF-043` — Openings must participate in cabinet collision and clearance checks.
- `WF-044` — Room split and merge operations must preserve valid cabinet ownership.
- `WF-045` — Hole-bearing room merges remain blocked until correctness is implemented.
- `WF-046` — Underlay scale must be inspectable.
- `WF-047` — Room dimensions in proposal and engineering must agree.
- `WF-048` — Wall thickness and height changes must appear in 3D.

---

## 12. Cabinet catalog features

### 12.1 Catalog purpose

The cabinet catalog is not a furniture marketplace.

It is a controlled set of technically meaningful starting configurations.

### 12.2 Catalog item requirements

Every cabinet catalog item must define:

- Catalog ID.
- Display name.
- Cabinet type.
- Cabinet family.
- Default width.
- Default height.
- Default depth.
- Placement behavior.
- Default composition.
- Default construction.
- Default hardware.
- Default materials.
- SKU where applicable.
- Visual compiler or geometry source.

### 12.3 Catalog search

Search should match:

- Display name.
- SKU.
- Cabinet type.
- Family.
- Common synonym.

### 12.4 Favorites and recents

`LATER` capabilities:

- Favorite families.
- Recently used cabinets.
- Shop-specific defaults.
- User templates.

### 12.5 Catalog governance

- `CAB-020` — A cabinet catalog item cannot ship without technical type mapping.
- `CAB-021` — A cabinet catalog item cannot ship with a misleading stand-in visual.
- `CAB-022` — A catalog item must include a round-trip test.
- `CAB-023` — A catalog item must include cutlist smoke coverage.
- `CAB-024` — A catalog item must include quote smoke coverage.
- `CAB-025` — Generic decor items must not enter cabinet production outputs.
- `CAB-026` — Shop-created templates must preserve normalized configuration.

---

## 13. Cabinet placement and editing

### 13.1 Placement

The user must be able to:

- Place a cabinet on a wall.
- Place a floor cabinet.
- Move a cabinet.
- Rotate a cabinet.
- Duplicate a cabinet.
- Delete a cabinet.
- Align cabinets.
- Snap cabinets into a run.

### 13.2 Dimensional editing

The user must be able to edit:

- Width.
- Height.
- Depth.
- Elevation or mounting height where applicable.
- Position along wall.

### 13.3 Structured editing

Engineering-capable editing includes:

- Shelves.
- Doors.
- Drawers.
- Opening structure.
- End panels.
- Toe kick.
- Construction method.
- Hardware.
- Appliance insert.

### 13.4 Sales editing versus engineering editing

Sales editing should expose:

- Common sizes.
- Front layout presets.
- Material selections.
- Simple hardware tier.
- Price effect.

Engineering editing may expose:

- Detailed opening tree.
- Joinery.
- Part construction.
- Hardware IDs.
- Build rules.
- Manufacturing constraints.

### 13.5 Editing requirements

- `CAB-030` — Sales presets must resolve to full technical configurations.
- `CAB-031` — Sales presets must not create incomplete engineering objects.
- `CAB-032` — Advanced engineering edits must remain visible in sales representation.
- `CAB-033` — Unsupported sales simplifications must be labeled.
- `CAB-034` — Every dimension edit must be undoable.
- `CAB-035` — Duplicate must preserve configuration and replace identity.
- `CAB-036` — Delete must update run, filler, countertop, quote, and production derivations.
- `CAB-037` — Selection must remain synchronized between plan, model, and inspector.

---

## 14. Cabinet run authoring

### 14.1 Run definition

A run is an ordered set of cabinets attached to a common wall direction or approved corner transition.

### 14.2 Run capabilities

Run authoring includes:

- Detect run membership.
- Snap cabinet to run.
- Align fronts.
- Align bases.
- Control gaps.
- Add fillers.
- Add countertops.
- Split countertop.
- Recognize corner transition.
- Reflow after wall changes.

### 14.3 Filler behavior

Fillers must:

- Belong to a run.
- Identify side.
- Have derived or explicit width.
- Remain traceable in technical output.
- Recalculate after relevant cabinet movement.

### 14.4 Countertop behavior

Countertops must:

- Cover eligible cabinets.
- Respect breaks.
- Respect corner behavior.
- Use configured overhang.
- Exclude ineligible wall and tall cabinets.

### 14.5 Run validation

Validation includes:

- Cabinet overlaps.
- Cabinet outside room.
- Cabinet crossing opening.
- Invalid wall attachment.
- Insufficient filler.
- Countertop discontinuity.
- Unsupported corner transition.
- Height conflict.
- Appliance clearance.

### 14.6 Run requirements

- `RUN-001` — Run order must be deterministic.
- `RUN-002` — Run membership must survive save and reopen.
- `RUN-003` — Run edits must be undoable.
- `RUN-004` — Filler calculation must use canonical wall and cabinet dimensions.
- `RUN-005` — Reflow must not silently change cabinet widths.
- `RUN-006` — Reflow failure must produce an actionable warning.
- `RUN-007` — Countertop derivation must be reproducible.
- `RUN-008` — Corner transitions outside supported geometry must be blocked or labeled.
- `RUN-009` — Run length must be available in proposal and engineering summaries.
- `RUN-010` — The Golden Cabinet Run must not require manual X/Z coordinate entry.

---

## 15. 2D plan experience

### 15.1 Product goal

The 2D plan is the fastest place to establish room fit and cabinet placement.

It is not a debug graph viewer.

### 15.2 Required visual hierarchy

The plan should distinguish:

- Room boundary.
- Walls.
- Openings.
- Cabinet footprints.
- Cabinet fronts.
- Cabinet labels or marks.
- Active run.
- Selected cabinet.
- Dimensions.
- Warnings.

### 15.3 Interaction expectations

- Selection should feel immediate.
- Drag should remain attached to intended wall.
- Snap feedback should be visible.
- Invalid placement should be visible before drop where possible.
- Dimension editing should not require opening multiple panels.
- Undo should reverse one user intention.

### 15.4 Plan requirements

- `CAB-040` — Cabinet type must have a recognizable plan symbol.
- `CAB-041` — Wall and floor cabinets must be visually distinguishable.
- `CAB-042` — Selected cabinet dimensions must be visible.
- `CAB-043` — Snap target and result must be visible.
- `CAB-044` — Blocking overlap must be visible on canvas.
- `CAB-045` — Cabinet mark display must be optional before proposal freeze.
- `CAB-046` — Plan labels must avoid unreadable overlap at benchmark zoom.
- `REL-010` — Pointer response should remain interactive for the golden benchmark project.

---

## 16. 3D cabinet representation

### 16.1 Product goal

The 3D model is a client-confidence surface and a configuration verification surface.

### 16.2 Current critical gap

Golden base, wall, drawer, and tall families compile through shared cabinet geometry.

Decorative bookcases may still use the bookcase silhouette. Production families must not.

### 16.3 Target geometry rule

Cabinet 3D geometry must derive from the same normalized cabinet configuration used by engineering and production.

### 16.4 Minimum visible fidelity

The 3D view must show:

- Correct cabinet envelope.
- Correct mounting type.
- Correct toe kick where applicable.
- Correct doors.
- Correct drawers.
- Correct open shelves.
- Correct end panels.
- Correct material roles.
- Correct countertop relationship.
- Correct filler relationship.

### 16.5 Visual quality priorities

Priority order:

1. Semantic correctness.
2. Proportion correctness.
3. Material-role correctness.
4. Clear edges and separations.
5. Lighting and grounding.
6. Decorative detail.

### 16.6 Visual requirements

- `VIS-001` — Base, wall, drawer, and tall cabinets must be distinguishable without labels.
- `VIS-002` — Cabinet geometry must use normalized cabinet configuration.
- `VIS-003` — A dimension edit must update the 3D object in the same session.
- `VIS-004` — A front-layout edit must update the 3D object.
- `VIS-005` — A material-role edit must update the corresponding geometry group.
- `VIS-006` — Wall cabinets must appear at the configured mounting height.
- `VIS-007` — Fillers must not appear as full cabinets.
- `VIS-008` — Countertops must not pass through tall cabinets.
- `VIS-009` — Selection in 3D must resolve to the canonical cabinet ID.
- `VIS-010` — A safe fallback must be visibly labeled in development and blocked from proposal release.
- `VIS-011` — Imported visual assets must not override dimensional truth.
- `VIS-012` — Client views must not show internal debug labels by default.

---

## 17. 3D navigation and review

### 17.1 Review modes

Supported review modes include:

- Dollhouse.
- Orbit.
- Front.
- Top.
- Perspective.
- Walkthrough.

### 17.2 Client review expectations

- Entry view should be predictable.
- Controls should be explained once.
- Camera movement should not lose the room.
- Selection should remain available where appropriate.
- Saved cameras should have human-readable names.

### 17.3 Review requirements

- `VIS-020` — Review opens on a useful default view.
- `VIS-021` — Walkthrough must have an obvious exit.
- `VIS-022` — Camera reset must be available.
- `VIS-023` — Saved cameras must preserve pose and field of view.
- `VIS-024` — Camera names must appear in proposal-view selection.
- `VIS-025` — A client can navigate the golden room without developer instruction.
- `REL-020` — Navigation must remain responsive in the golden project.

---

## 18. Materials and finishes

### 18.1 Material roles

Materials are assigned to semantic slots.

They are not merely colors painted on arbitrary meshes.

### 18.2 Required cabinet roles

- Carcass.
- Fronts.
- Back.
- Shelves.
- Countertop.
- Hardware finish where supported.

### 18.3 Material metadata

A material may include:

- Stable ID.
- Name.
- Kind.
- Display color.
- Roughness.
- Metalness.
- Texture references.
- Cost rate.
- Sheet stock relationship.
- Finish rate.

### 18.4 Material requirements

- `CAB-050` — Material IDs must be stable.
- `CAB-051` — Material slots must survive adapter conversion.
- `CAB-052` — Visual materials and costing materials must resolve from the same semantic selection.
- `CAB-053` — Missing cost data must be disclosed in quote review.
- `CAB-054` — Missing visual asset must use a safe material fallback without changing cost identity.
- `CAB-055` — A material substitution must update quote and production summary where rates differ.

---

## 19. Layout validation

### 19.1 Validation classes

Validation is divided into:

- Room topology validation.
- Placement validation.
- Cabinet configuration validation.
- Manufacturing validation.
- Commercial completeness validation.
- Proposal readiness validation.
- Production readiness validation.

### 19.2 Severity model

Suggested severities:

- Info.
- Warning.
- Error.
- Blocker.

### 19.3 Blocking principles

A condition blocks proposal when it makes the client representation materially misleading.

A condition blocks production when it makes workshop output unsafe or undefined.

The two gates are not identical.

### 19.4 Proposal blockers

Examples:

- Cabinet outside room.
- Major cabinet overlap.
- Missing cabinet visual compiler.
- Missing proposal view.
- Empty cabinet design.
- Invalid price calculation.

### 19.5 Production blockers

Examples:

- Unknown cabinet type.
- Lossy cabinet adapter result.
- Unsupported construction combination.
- Missing production material.
- Invalid part dimension.
- Unresolved manufacturing blocker.
- Unapproved revision unless explicitly overridden.

### 19.6 Validation requirements

- `REV-001` — Every issue must include code, severity, message, and affected object where applicable.
- `REV-002` — Every blocker must include an action or explanation.
- `REV-003` — Proposal and production gates must be separate.
- `REV-004` — Resolved manual review notes must retain history.
- `REV-005` — Adapter loss must be a production blocker.
- `REV-006` — Missing cabinet-specific visual must be a proposal blocker for the golden families.
- `REV-007` — Export buttons must not fail silently.
- `REV-008` — Gate override must identify user, time, and reason when identity is available.

---

## 20. Costing

### 20.1 Costing purpose

Costing estimates workshop cost from the configured cabinet and business settings.

It is not an accounting ledger.

### 20.2 Current costing inputs

Current settings include:

- Waste percentage.
- Labour percentage.
- Hardware allowance.
- Labour allowance.
- Material-rate multiplier.
- Finish-rate multiplier.
- Default hinge.
- Default drawer slide.
- Default handle.

### 20.3 Current presets

- Economy.
- Standard workshop.
- Premium.

### 20.4 Cost components

Cost may include:

- Material.
- Finish.
- Hardware.
- Labour.
- Waste.
- Allowances.

### 20.5 Costing requirements

- `QTE-001` — Cost must derive from the current cabinet configuration.
- `QTE-002` — Cost must update after dimensional changes.
- `QTE-003` — Cost must update after construction changes.
- `QTE-004` — Cost must update after hardware changes.
- `QTE-005` — Cost must update after material-rate changes.
- `QTE-006` — Missing rate data must be visible.
- `QTE-007` — Costing presets must be reviewable before quote release.
- `QTE-008` — Cost settings must be versioned with a frozen quote snapshot.
- `QTE-009` — Currency must be explicit.
- `QTE-010` — Cost rounding rules must be deterministic.

---

## 21. Quotation

### 21.1 Quote purpose

The quote translates workshop cost into a client-facing commercial proposal.

### 21.2 Current quote settings

- Markup percentage.
- Tax percentage.
- Discount percentage.
- Validity days.
- Labour allowance.
- Finish premium percentage.
- Inclusions.
- Exclusions.
- Currency label.

### 21.3 Current quote outputs

- Workshop subtotal.
- Finish premium.
- Labour allowance.
- Hardware allowance.
- Markup.
- Discount.
- Tax.
- Sell total.
- Cabinet lines.
- Hardware rollup.
- Summary cards.

### 21.4 Quote freeze

Freezing a quote should preserve:

- Quote ID.
- Revision.
- Quote time.
- Customer.
- Project number.
- Workshop total.
- Sell total.
- Cabinet count.
- Commercial settings.
- Summary lines.

### 21.5 Quote requirements

- `QTE-020` — The sales workflow must show a live estimated total before proposal generation.
- `QTE-021` — The user must review markup, tax, and discount before quote freeze.
- `QTE-022` — Quote freeze must create an immutable snapshot.
- `QTE-023` — Changing the design after quote freeze must show that the live design differs from the quote.
- `QTE-024` — Proposal generation must identify the quote snapshot used.
- `QTE-025` — A quote must have a validity date or disclose that none applies.
- `QTE-026` — Inclusions and exclusions must appear in the proposal.
- `QTE-027` — Discount must not silently exceed configured bounds.
- `QTE-028` — Currency and tax labels must be configurable by market.
- `QTE-029` — Quote totals must be reproducible for the same snapshot.
- `QTE-030` — Quote line visibility must support summary-only and itemized proposal policies.

---

## 22. Client proposal

### 22.1 Proposal purpose

The proposal is the primary client-facing commercial artifact.

It is distinct from:

- Raw project JSON.
- Millwork schedule.
- Cutlist.
- Production packet.
- Machine-intent preview.

### 22.2 Proposal contents

Required:

- Brand.
- Customer.
- Project number.
- Revision.
- Proposal date.
- Valid-until date.
- Room name.
- Named client views.
- Cabinet summary.
- Material and finish summary.
- Price summary.
- Total.
- Inclusions.
- Exclusions.
- Approval area.

Optional:

- Itemized cabinet pricing.
- Design notes.
- Alternative option.
- Measurement disclaimer.
- Installation disclaimer.

### 22.3 Proposal views

Proposal views should include:

- One hero perspective.
- One useful elevation or front view.
- One plan or dollhouse view when it adds clarity.

The Golden Cabinet Run requires at least one saved client view.

### 22.4 Proposal requirements

- `EXP-001` — “Create Proposal” is the primary sales export action.
- `EXP-002` — Proposal must be readable without the application.
- `EXP-003` — Proposal must identify revision and quote snapshot.
- `EXP-004` — Proposal cabinet counts must match the approved project state.
- `EXP-005` — Proposal views must be generated from the approved project state.
- `EXP-006` — A missing view must block final proposal release.
- `EXP-007` — Draft-quality output must be visibly labeled.
- `EXP-008` — Proposal must not include workshop-only jargon by default.
- `EXP-009` — Proposal generation failure must preserve the project and explain recovery.
- `EXP-010` — Proposal file names must be deterministic and filesystem-safe.

---

## 23. Render and presentation

### 23.1 Render role

Rendering supports client comprehension and confidence.

It does not define cabinet truth.

### 23.2 Render tiers

The product may distinguish:

- Draft preview.
- Client preview.
- Accepted enhanced still.

### 23.3 Render priorities

For the current program:

1. Correct cabinet representation.
2. Reliable capture.
3. Predictable camera framing.
4. Material readability.
5. Grounding and lighting.
6. Higher realism.

### 23.4 Still trust

Enhanced stills may improve presentation.

They must not change:

- Cabinet count.
- Cabinet dimensions.
- Openings.
- Wall geometry.
- Camera identity beyond allowed tolerance.
- Material identity beyond approved presentation behavior.

### 23.5 Render requirements

- `RND-001` — Client preview generation must be repeatable for the golden project.
- `RND-002` — Render failure must not block saving or engineering handoff.
- `RND-003` — Accepted still must reference project revision and camera.
- `RND-004` — Draft still must not enter a final proposal without visible labeling.
- `RND-005` — Enhanced still acceptance must be explicit.
- `RND-006` — Render provenance is an internal trust mechanism, not primary client copy.
- `RND-007` — Presentation improvement must not mutate authored design.
- `RND-008` — Render latency must be measured on a declared environment.

---

## 24. Engineering handoff

### 24.1 Handoff purpose

The handoff turns the approved sales design into an editable engineering starting point.

It is not a flat export.

For P0, “Send to Engineering” means an explicit **same-project workbench transition**:

1. The user starts in the Interiors shell.
2. The application runs cabinet-adapter and release diagnostics.
3. The application shows a handoff summary and blocks lossy golden-family mappings.
4. The application preserves the current project, revision, room, cabinet IDs, and normalized cabinet configurations.
5. The application switches workbench mode to the existing Cabinets engineering shell.
6. The engineer continues editing the same project state.

P0 does not require visually unifying the Interiors and Cabinets shells.

P0 must not create a second project, require export/import, or recreate cabinets.

### 24.2 Handoff contract

The handoff carries:

- Canonical cabinet IDs.
- Cabinet types.
- Cabinet dimensions.
- Cabinet placement.
- Run relationship.
- Composition.
- Construction.
- Hardware.
- Materials.
- Room and opening context.
- Revision identity.
- Approval state.

### 24.3 Handoff warnings

The handoff must report:

- Fallback cabinet types.
- Dropped fields.
- Unsupported room topology.
- Unsupported placement rotation.
- Unsupported attachment.
- Missing material mapping.
- Missing construction mapping.

### 24.4 Current adapter risk

The compatibility adapter no longer derives cabinet type from display category.

Native catalog cabinets keep `category` as a merchandising label (including `storage`) and carry an explicit `cabinetType` / `familyId`. Unidentified cabinet-looking objects are skipped and reported; they do not fall back to `base`.

This is `HARDEN` for P0-A. Silent fallback remains prohibited.

### 24.5 Handoff requirements

- `ENG-001` — Cabinet type mapping must be explicit.
- `ENG-002` — Lossy handoff must be reported.
- `ENG-003` — Silent family fallback is prohibited.
- `ENG-004` — Handoff must preserve stable cabinet IDs.
- `ENG-005` — Handoff must preserve room ownership.
- `ENG-006` — Handoff must preserve wall or floor attachment.
- `ENG-007` — Handoff must preserve composition.
- `ENG-008` — Handoff must preserve construction.
- `ENG-009` — Handoff must preserve hardware.
- `ENG-010` — Handoff must preserve material roles.
- `ENG-011` — Handoff must preserve approved revision identity.
- `ENG-012` — Handoff must have round-trip fixture coverage for every golden family.

---

## 25. Engineering workspace

### 25.1 Engineering purpose

The engineering workspace refines an approved cabinet design without severing its identity.

### 25.2 Engineering capabilities

Current domain capabilities include:

- Cabinet family editing.
- Structured openings.
- Doors and drawers.
- Shelves.
- Construction specifications.
- Hardware specifications.
- Appliance inserts.
- Manufacturing validation.
- Technical views.
- Elevation editing.
- Cabinet assembly representation.

### 25.3 Engineering requirements

- `ENG-020` — Engineer edits must update derived cutlist and cost.
- `ENG-021` — Material commercial impact must remain visible when relevant.
- `ENG-022` — Engineering changes after approval must create revision drift.
- `ENG-023` — Engineering must not overwrite the frozen approved snapshot.
- `ENG-024` — Returning to Review must show the current engineered state.
- `ENG-025` — Proposal regeneration after engineering changes must require a new review.
- `ENG-026` — Advanced configuration controls must validate family capability.

---

## 26. Drawings

### 26.1 Drawing purpose

Drawings communicate technical intent to engineering, installation, and workshop users.

### 26.2 Drawing types

Supported or targeted drawing types include:

- Plan.
- Elevation.
- Cabinet front.
- Section.
- Detail.
- Report sheet.

### 26.3 Drawing contents

May include:

- Cabinet marks.
- Overall dimensions.
- Cabinet dimensions.
- Opening dimensions.
- Material notes.
- Hardware notes.
- Construction notes.
- Revision block.
- Customer and project identity.

### 26.4 Drawing requirements

- `ENG-030` — Drawing dimensions must derive from canonical geometry.
- `ENG-031` — Cabinet marks must match schedule and production packet.
- `ENG-032` — Drawing revision must match project revision.
- `ENG-033` — Stale drawings must be detectable after design changes.
- `ENG-034` — Drawing export must state scale or not-to-scale status.
- `ENG-035` — Drawing sheets must preserve named view configuration.

---

## 27. Production cutlist

### 27.1 Current cutlist fields

The production cutlist currently supports:

- Shop reference.
- Cabinet.
- Part.
- Category.
- Material.
- Finish.
- Edge banding.
- Thickness.
- Quantity.
- Length.
- Width.
- Grain.
- Notes.

### 27.2 Cutlist derivation

The cutlist derives from cabinet construction.

It must not derive from the visible bounding box alone.

### 27.3 Cutlist grouping

Current grouping supports:

- Material.
- Thickness.
- Cabinet.
- Flat list.

### 27.4 Cutlist requirements

- `PRD-001` — Every cutlist line must identify its cabinet.
- `PRD-002` — Every cutlist line must identify its part.
- `PRD-003` — Part dimensions must be deterministic.
- `PRD-004` — Quantity must reflect construction.
- `PRD-005` — Edge-banding information must be explicit.
- `PRD-006` — Grain direction must be explicit.
- `PRD-007` — Unsupported or non-flat parts must not be silently flattened.
- `PRD-008` — Cutlist must identify project and revision at export boundary.
- `PRD-009` — Cutlist generation must be blocked by unknown cabinet type.
- `PRD-010` — Golden family cutlists require reviewed fixtures.

---

## 28. Hardware schedule

### 28.1 Hardware categories

Current categories include:

- Hinges.
- Slides.
- Handles.
- Legs.
- Brackets.
- Shelf pins.
- Accessories.
- Consumables.

### 28.2 Hardware behavior

Hardware quantity derives from cabinet configuration.

Examples:

- Door count influences hinge quantity.
- Drawer count influences slide quantity.
- Handle policy influences handle quantity.
- Shelf policy influences pin quantity.

### 28.3 Hardware requirements

- `PRD-020` — Hardware lines must identify stable catalog IDs.
- `PRD-021` — Hardware quantity must be reproducible.
- `PRD-022` — Per-cabinet hardware must roll up to project schedule.
- `PRD-023` — Hardware changes must affect cost.
- `PRD-024` — Missing hardware catalog entries must block verified production output.
- `PRD-025` — Appliance inserts must carry envelope dimensions.

---

## 29. Material summary and sheet yield

### 29.1 Material summary

Material summary groups cut parts by:

- Material.
- Thickness.
- Total area.
- Estimated boards.
- Line count.

### 29.2 Sheet stock

Current stock definitions include:

- 2440 × 1220 mm.
- 2100 × 900 mm.
- 1220 × 1220 mm.

### 29.3 Optimizer settings

Current settings include:

- Sheet definition.
- Kerf.
- Trim.
- Rotation permission for free-grain material.

### 29.4 Yield requirements

- `PRD-030` — Yield must use cutlist parts, not cabinet envelope area.
- `PRD-031` — Kerf and trim must be explicit.
- `PRD-032` — Grain restrictions must be respected.
- `PRD-033` — Estimated yield must be labeled as an estimate until reviewed.
- `PRD-034` — Stock selection must be recorded with the output.
- `PRD-035` — Parts larger than usable sheet size must raise blockers.

---

## 30. Production packet

### 30.1 Packet purpose

The production packet assembles reviewed workshop information for a revision.

### 30.2 Packet sections

Current or intended sections include:

- Job cover.
- Review and revisions.
- Cabinet schedule.
- Run summary.
- Material summary.
- Hardware schedule.
- Cutlist.
- Costing summary where permitted.
- Technical drawings.
- Release status.

### 30.3 Packet requirements

- `PRD-040` — Packet must identify project, customer, and revision.
- `PRD-041` — Packet must identify generation time.
- `PRD-042` — Packet must identify approval and release status.
- `PRD-043` — Packet cabinet marks must match drawings and cutlist.
- `PRD-044` — Packet must list unresolved warnings.
- `PRD-045` — Packet must not claim CNC readiness.
- `PRD-046` — Packet regeneration must be deterministic for the same revision and settings.
- `PRD-047` — Production release must freeze the packet fingerprint.

---

## 31. Machine export intent

### 31.1 Current boundary

Machine export is currently an intent and preview layer.

It is not verified CNC output.

### 31.2 Current operation vocabulary

- Cut outline.
- Drill.
- Groove.
- Rebate.
- Pocket.
- Joinery note.
- Hardware intent.

### 31.3 Current statuses

- Intent.
- Preview.
- Unverified.

### 31.4 Machine requirements

- `PRD-050` — Every machine-intent artifact must carry the unverified disclaimer.
- `PRD-051` — Preview operations must identify source cabinet and part.
- `PRD-052` — Tool hints must not be represented as verified tool selection.
- `PRD-053` — A future verified adapter requires machine-specific fixtures and sign-off.
- `PRD-054` — Generic JSON or CSV preview must not be renamed to CNC export.
- `PRD-055` — Machine geometry must use the same cut-part dimensions.

---

## 32. Revision, review, and approval

### 32.1 Review notes

Review notes support:

- Info.
- Warning.
- Error.
- Blocker.
- Manual source.
- Manufacturing source.
- Validation source.
- Resolution state.

### 32.2 Revision fingerprint

Current fingerprint concepts include:

- Cabinet count.
- Room count.
- Part-line count.
- Workshop total.
- Sell total.
- Error count.
- Warning count.
- Blocker count.
- Cabinet names.
- Material keys.

### 32.3 Revision snapshot

A snapshot includes:

- ID.
- Revision.
- Time.
- Status.
- Note.
- Approver.
- Production-release state.
- Fingerprint.
- Change log.
- Open issues.

### 32.4 Review requirements

- `REV-020` — Quote freeze and design approval must be distinct events.
- `REV-021` — Approval must reference a revision fingerprint.
- `REV-022` — Design changes after approval must invalidate production release.
- `REV-023` — Revision comparison must summarize material changes.
- `REV-024` — Blockers must remain visible in frozen snapshots.
- `REV-025` — Production release requires no unresolved blockers.
- `REV-026` — Manual override requires a reason.
- `REV-027` — Revision history must remain bounded and migration-safe.
- `REV-028` — Proposal must indicate if it no longer matches the live project.

---

## 33. File, save, and migration behavior

### 33.1 File principles

- Projects are JSON-safe.
- Projects are schema-versioned.
- Old projects migrate on load.
- Stable IDs are preserved.
- Runtime objects are excluded.
- Absolute local asset paths are excluded from canonical project truth.

### 33.2 Save behavior

The application should support:

- Explicit Save.
- Save As.
- Autosave or recovery state.
- Recent projects.
- Dirty-state indication.
- Safe close behavior.

### 33.3 File requirements

- `DAT-020` — Save must be atomic where platform support allows.
- `DAT-021` — Failed save must preserve the in-memory project.
- `DAT-022` — Dirty state must remain visible after failed save.
- `DAT-023` — Migration must return diagnostics for repaired or dropped fields.
- `DAT-024` — Unsupported future schema versions must not be silently downgraded.
- `DAT-025` — Project reopen must preserve the golden workflow state.
- `DAT-026` — Recovery state must not overwrite a newer explicit save without confirmation.
- `DAT-027` — Export artifacts must not be loaded as editable project truth.

---

## 34. Reliability and performance

### 34.1 Reliability goals

The golden workflow must be boringly reliable.

The user should not need to understand rendering or schema internals to recover.

### 34.2 Performance budgets

Initial benchmark budgets should be measured and then locked for:

- Project open.
- Room-to-3D switch.
- Cabinet placement response.
- Cabinet resize response.
- Quote recalculation.
- Cutlist recalculation.
- Proposal generation.
- Save.

### 34.3 Recommended initial budgets

These are target starting points, subject to measured environment declaration:

- Common pointer feedback: under 100 ms perceived response.
- Cabinet inspector edit to 3D update: under 250 ms.
- Quote recalculation for golden project: under 250 ms.
- Cutlist recalculation for golden project: under 500 ms.
- 2D to interactive 3D: under 2 seconds warm.
- Explicit save: under 1 second for golden project.
- Proposal PDF generation: under 5 seconds excluding enhanced still generation.

### 34.4 Reliability requirements

- `REL-001` — Golden workflow must pass sequential end-to-end execution.
- `REL-002` — Golden workflow must pass after a clean application launch.
- `REL-003` — Golden workflow must pass after save and reopen.
- `REL-004` — Render failure must be recoverable.
- `REL-005` — Export cancellation must not be reported as failure.
- `REL-006` — Derived report failure must identify the failing stage.
- `REL-007` — No unhandled error may destroy the project state.
- `REL-008` — Performance measurements must name hardware and build mode.
- `REL-009` — CI timing must not be presented as desktop user latency.

---

## 35. Accessibility and input

### 35.1 Accessibility goals

The desktop workflow should be usable without relying solely on color or precise pointer control.

### 35.2 Requirements

- `ACC-001` — Interactive controls must have accessible names.
- `ACC-002` — Keyboard focus must be visible.
- `ACC-003` — Blocking warnings must not rely only on color.
- `ACC-004` — Numeric fields must have explicit units.
- `ACC-005` — Dialogs must trap and restore focus appropriately.
- `ACC-006` — Escape must close transient menus and dialogs where safe.
- `ACC-007` — Canvas-only actions must have inspector or keyboard alternatives for the golden workflow.
- `ACC-008` — Text in generated proposals must remain legible when printed.

---

## 36. Security and privacy

### 36.1 Data scope

Projects may contain:

- Customer name.
- Project number.
- Site dimensions.
- Pricing.
- Notes.
- Local asset references by stable registry key.

### 36.2 Requirements

- `SEC-001` — Customer data must not be transmitted without an explicit feature and disclosure.
- `SEC-002` — Exported proposals must not contain hidden internal data unintentionally.
- `SEC-003` — Project JSON must not include credentials or tokens.
- `SEC-004` — Asset registry keys must not expose sensitive local paths.
- `SEC-005` — Diagnostic logs should avoid full customer details by default.
- `SEC-006` — External render services, if added later, require explicit data-flow documentation.

---

## 36A. 3D Asset Import and Personal Catalog

### 36A.1 Product purpose

Asset import lets a user add a visual object that is not in the built-in catalog.

It supports presentation breadth without turning imported meshes into cabinet engineering truth.

### 36A.2 Current baseline

The current product supports:

- GLB file selection.
- Optional PNG, JPEG, or WebP sidecar textures.
- Base-color, normal, roughness, and metallic filename recognition.
- Embedded GLB materials when sidecars are absent.
- A 25 MB model limit.
- Project-embedded data URLs for user-selected assets.
- A packaged starter asset set.
- Default imported dimensions of 1000 × 1000 × 1000 mm before user correction.

The current workflow is useful but not competitor-level catalog management.

### 36A.3 Supported format policy

P0 supported authoring format:

- Binary glTF `.glb`.

P0 sidecar image formats:

- `.png`.
- `.jpg` and `.jpeg`.
- `.webp`.

Deferred formats:

- `.gltf` with external buffers.
- `.fbx`.
- `.obj` and `.mtl`.
- `.stl`.
- SketchUp `.skp`.
- Collada `.dae`.

Deferred formats require conversion into normalized GLB before becoming reusable catalog assets.

### 36A.4 Coordinate and scale contract

Normalized assets use:

- Metres inside GLB.
- Millimetres in project dimensions.
- Positive Y as up.
- Positive Z as forward toward the room interior.
- Floor contact at Y = 0 for floor objects.
- Centered X/Z origin for freestanding objects.
- Explicit mounting origin for wall objects.

The import preview must let the user correct:

- Width.
- Height.
- Depth.
- Uniform scale.
- Up axis.
- Forward axis.
- Rotation.
- Floor or wall origin.

### 36A.5 Texture contract

Recognized PBR roles:

- Base color or albedo.
- Normal.
- Roughness.
- Metallic or metalness.
- Ambient occlusion when added later.
- Emissive when added later.

Texture assignment priority:

1. Explicit user slot mapping.
2. Embedded GLB material.
3. Recognized sidecar filename.
4. Safe material fallback.

Missing textures must not prevent dimensional placement.

Missing textures must produce a visible warning before saving to a reusable catalog.

### 36A.6 Material-slot mapping

The import flow should discover mesh and material names.

The user may map them to semantic roles such as:

- Carcass.
- Fronts.
- Frame.
- Upholstery.
- Legs.
- Top.
- Glass.
- Hardware.
- Generic surface.

Semantic slots are stored in project truth.

Raw runtime material objects are not stored in project truth.

### 36A.7 Import workflow

Target workflow:

1. Select Import 3D Asset.
2. Choose one GLB and optional texture images.
3. Validate file type and size.
4. Parse scene and materials.
5. Display model preview.
6. Show detected dimensions and axes.
7. Correct scale and orientation.
8. Choose floor, wall, or free placement.
9. Map material groups.
10. Review missing textures and unsupported features.
11. Choose project-only or Save to My Catalog.
12. Generate thumbnail.
13. Place the normalized object.

### 36A.8 Validation

Validation should detect:

- Empty scene.
- No renderable mesh.
- Oversized file.
- Excessive triangle count.
- Excessive texture dimensions.
- Missing external resource.
- Unsupported compressed geometry.
- Invalid or zero bounding box.
- Extreme scale.
- Incorrect up axis.
- Object below floor.
- Duplicate material names.
- Missing texture role.
- Unsupported animation.
- Unsupported skinning.
- Unsupported morph target.

### 36A.9 Optimization

Reusable assets should support an offline or import-time optimization pipeline:

- Remove unused nodes.
- Merge compatible meshes where safe.
- Generate normals when missing.
- Preserve hard edges.
- Compress textures.
- Limit texture resolution by product policy.
- Generate thumbnail.
- Record triangle count and file size.
- Preserve semantic material groups.

Optimization must never silently change the authored physical dimensions.

### 36A.10 Personal catalog

A saved personal catalog asset should contain:

- Stable asset ID.
- Owner or organization ID when SaaS exists.
- Display name.
- Category.
- Placement type.
- Native dimensions.
- Model version.
- Model content hash.
- Thumbnail.
- Semantic material groups.
- Texture references.
- Import warnings.
- Created and updated time.
- Source filename for traceability.

### 36A.11 Cabinet boundary

An imported cabinet-looking mesh is a presentation asset unless it resolves a complete Cabinet Studio cabinet configuration.

Imported geometry must not automatically generate:

- Cabinet type.
- Construction.
- Cutlist.
- Hardware schedule.
- Cost.
- Quote line.
- Machine intent.

To become a production cabinet, the asset must be linked to an explicit cabinet family and normalized configuration.

### 36A.12 Project portability

Project-only imports may remain embedded while the product is local-first.

Before cloud sync, the backend book must define:

- Object storage.
- Content hashing.
- Upload limits.
- Virus and content scanning.
- Signed download URLs.
- Organization ownership.
- Deletion and retention.

### 36A.13 Asset requirements

- `AST-001` — GLB is the supported P0 import format.
- `AST-002` — The importer must enforce the configured file-size limit.
- `AST-003` — The importer must show a preview before placement.
- `AST-004` — The user must be able to correct dimensions and scale.
- `AST-005` — The user must be able to correct orientation and placement origin.
- `AST-006` — Embedded GLB materials must remain available when valid.
- `AST-007` — Sidecar textures must map only to recognized PBR roles.
- `AST-008` — Missing textures must produce warnings and safe fallbacks.
- `AST-009` — Runtime GPU objects must not enter canonical project JSON.
- `AST-010` — Imported assets must have stable IDs and content hashes before cloud catalog use.
- `AST-011` — Thumbnail generation must be deterministic enough for catalog reuse.
- `AST-012` — Project-only and reusable-catalog imports must be distinct choices.
- `AST-013` — Imported mesh dimensions must not override cabinet dimensional truth.
- `AST-014` — Imported cabinet-looking assets must not enter production output without an explicit cabinet-family link.
- `AST-015` — FBX, OBJ, STL, and SKP require a documented conversion path before support is claimed.
- `AST-016` — Import warnings must persist with reusable asset metadata.
- `AST-017` — Asset deletion must not break existing projects silently.
- `AST-018` — Cloud assets require authorization and organization ownership checks.

### 36A.14 Delivery order

1. Harden GLB preview, scale, orientation, and material mapping.
2. Add project-only import metadata and warnings.
3. Add local My Catalog with thumbnails and stable IDs.
4. Add optimized asset packaging.
5. Add cloud organization catalog after backend asset storage exists.
6. Research additional source formats based on customer evidence.

---

## 37. Feature-state inventory

### 37.1 Existing domain libraries and foundations

The repository contains the following implemented domain libraries and supporting capabilities.

This list does **not** mean a salesperson can complete the Golden Cabinet Run from Interiors Review today.

Buyer-facing workflow status is governed by Appendix G, the P0 epics, and the release gates.

Existing libraries and foundations include:

- Versioned interior projects.
- Room topology.
- Wall drawing and editing.
- Doors and windows.
- Cabinet placement.
- Cabinet runs.
- Fillers and corners.
- Layout validation.
- 3D review modes.
- Selection parity.
- Client still workflow.
- Millwork schedule.
- Cabinet compatibility adapter.
- Cabinet construction.
- Structured composition.
- Hardware system.
- Cutlist.
- Costing.
- Quotation.
- Sheet-yield planning.
- Project reports.
- Revision review.
- Technical drawing domains.
- Machine-intent previews.

### 37.2 Hardening items

- Full browser-suite reliability.
- Still-generation timing.
- Hole-bearing room merges.
- Custom destructive-action dialogs.
- Cabinet-specific 3D representation.
- Adapter fidelity for native interior catalog cabinets.
- Sales discoverability of quote and production capability.
- Real-user timed workflow validation.

### 37.3 Immediate next program

The immediate program is Golden Cabinet Run v1.

It includes:

- Explicit cabinet identity.
- Lossless adapter behavior.
- Cabinet-specific shared geometry.
- Live quote visibility.
- Branded proposal.
- Engineering handoff.
- Golden benchmark automation.
- Pilot validation.

### 37.4 Explicit exclusions

- AI decoration.
- General furniture catalog expansion as a primary program.
- Real-estate package breadth.
- Whole-building BIM.
- Verified CNC without machine-specific engineering.
- Marketplace and shopping-cart breadth.
- Social design community.
- Mobile authoring parity.

---

## 38. Immediate implementation program

### 38.1 Program objective

Deliver the first trustworthy cabinet proposal-to-production loop.

### 38.2 Epic P0-A — Cabinet identity and adapter fidelity

Status: `HARDEN`

Requirements:

- `DAT-001` through `DAT-015`.
- `CAB-001` through `CAB-015`.
- `ENG-001` through `ENG-012`.

Work items:

1. Add explicit cabinet type to native interior cabinet definitions.
2. Add explicit family ID.
3. Separate category from technical type.
4. Persist normalized cabinet configuration.
5. Remove silent type fallback.
6. Add adapter diagnostics.
7. Add fixtures for base, wall, drawer, and tall cabinets.
8. Add save/reopen round-trip tests.
9. Add Interior-to-Cabinet-to-Interior round-trip tests where supported.
10. Block production on lossy conversion.

Exit criteria:

- Every golden cabinet retains type and configuration.
- No golden fixture uses generic base fallback.
- Adapter diagnostics are empty for the golden project.
- Production report uses the expected family for every cabinet.

### 38.3 Epic P0-B — Shared cabinet geometry

Status: `HARDEN`

Requirements:

- `VIS-001` through `VIS-012`.

Work items:

1. Define a rendering bridge from normalized cabinet construction to interior scene primitives.
2. Replace bookcase stand-ins for golden families.
3. Map semantic material slots.
4. Render toe kicks.
5. Render door fronts.
6. Render drawer fronts.
7. Render shelves where visible.
8. Render mounting height for wall cabinets.
9. Render end panels.
10. Render fillers and countertops coherently.
11. Add golden visual fixtures.
12. Add screenshot or scene-structure assertions.

Exit criteria:

- A reviewer can distinguish every golden family without labels.
- 3D front composition matches engineering composition.
- Resizing updates 3D, quote, and cutlist from one edit.
- No golden cabinet uses `compileBookcase` as a stand-in.

### 38.4 Epic P0-C — Proposal surface

Status: `HARDEN`

Requirements:

- `QTE-020` through `QTE-030`.
- `EXP-001` through `EXP-010`.

Work items:

1. Add live estimated total to Review.
2. Add commercial-settings review.
3. Add quote freeze action.
4. Add stale-quote indicator.
5. Add branded proposal layout.
6. Add named view selection.
7. Add material summary.
8. Add configurable price detail level.
9. Add inclusions and exclusions.
10. Add approval block.
11. Add deterministic file naming.
12. Add proposal PDF verification.

Exit criteria:

- Golden project creates a readable proposal.
- Proposal total matches frozen quote.
- Proposal views match the frozen revision.
- Post-quote design change shows stale status.

### 38.5 Epic P0-D — Engineering handoff experience

Status: `HARDEN`

Work items:

1. Add “Send to Engineering.”
2. Run adapter diagnostics before transition.
3. Show handoff summary.
4. Block on lossy golden cabinet mapping.
5. Switch from Interiors to the Cabinets workbench using the same project state.
6. Preserve selection where possible.
7. Preserve revision identity.
8. Show post-approval drift.

Harden (review):

- Send requires an approved or production job plus a matching frozen revision.
- Re-handoff is rejected until a newly approved revision exists; snapshots are immutable per revision.
- Returning to Interiors rebuilds the canonical document from live cabinets.
- Post-approval drift uses a design-content fingerprint (placement, IDs, and full configuration).
- Golden lossless diagnostics compare raw planning/object fields vs adapted configuration, including material slots the adapter drops.

Exit criteria:

- Engineering opens the same cabinet IDs.
- No golden cabinet is recreated.
- Cabinet configuration is editable immediately.
- Production report builds without fallback warnings.

### 38.6 Epic P0-E — Golden workflow verification

Status: `SHIPPED`

Work items:

1. Create deterministic golden project fixture.
2. Create browser journey.
3. Add save and reopen segment.
4. Add cabinet width revision.
5. Assert 3D geometry semantics, including the derived run countertop.
6. Assert a numeric quote delta after the width revision.
7. Assert cutlist delta.
8. Assert proposal metadata.
9. Assert engineering IDs, including both run fillers.
10. Run sequentially with the full suite.
11. Change one cabinet finish on `planning.config.buildRules.finishId` (not door style, not blocking `object.materialSlots`).
12. Reopen from the downloaded JSON file, not in-memory recents.

Exit criteria:

- Journey passes locally (`npm run test:golden`).
- Pull-request CI runs unit tests, production build, the Golden journey, and the release-demo save/reopen path.
- The Release Candidate workflow remains the full sequential 40-test suite (`npm run test:e2e`).
- Journey has no arbitrary long waits.
- Failures identify the broken product stage.
- Fixture is versioned.
- Golden fixture includes fillers and a compiled countertop over eligible floor cabinets.
- Gate F (five sales users, two engineers, median ≤ 15 minutes) stays the market-validation gate and is not required to mark this epic `SHIPPED`.

---

## 39. Recommended development sequence

### 39.1 Sequence principle

Correctness precedes presentation.

Presentation precedes growth features.

### 39.2 Milestone 1 — Truth

Deliver:

- Explicit cabinet type.
- Explicit family.
- Complete config persistence.
- Adapter diagnostics.
- Golden fixtures.

Release gate:

- No silent cabinet-family fallback.

### 39.3 Milestone 2 — Credibility

Deliver:

- Shared cabinet geometry.
- Correct semantic materials.
- Correct fronts.
- Correct wall mounting.
- Correct fillers and countertop.

Release gate:

- Golden cabinets are client-credible in 3D.

### 39.4 Milestone 3 — Commercial completion

Deliver:

- Live total.
- Quote review.
- Quote freeze.
- Branded proposal.
- Stale-quote behavior.

Release gate:

- Golden project produces a correct proposal.

### 39.5 Milestone 4 — Reuse downstream

Deliver:

- Engineering handoff.
- Production readiness gate.
- Revision continuity.
- Production packet verification.

Release gate:

- Golden project reaches engineering without re-entry.

### 39.6 Milestone 5 — Market validation

Deliver:

- Timed benchmark protocol.
- Five salesperson sessions.
- Two engineer reviews.
- Findings and prioritization.
- Updated buyer-weighted score.

Release gate:

- Evidence supports or rejects the claimed wedge.

---

## 40. Detailed user stories

### 40.1 Job stories

#### Story JOB-01 — Start a customer job

As a salesperson,

I want to create a job with customer and project identity,

so that every later artifact is traceable.

Acceptance:

- Customer name is optional during exploration.
- Project number is optional during exploration.
- Revision defaults to A.
- Status defaults to Draft.
- Created time is recorded.
- Project can be saved.

#### Story JOB-02 — Move job to quoted

As a salesperson,

I want to freeze the commercial state of a proposal,

so that later changes do not rewrite what the client saw.

Acceptance:

- Quote snapshot is created.
- Quoted time is recorded.
- Quote settings are stored in the snapshot.
- Live design drift is detectable.

#### Story JOB-03 — Record approval

As a salesperson,

I want to record client approval against a revision,

so that engineering knows what was accepted.

Acceptance:

- Approval references revision fingerprint.
- Approver may be recorded.
- Approval time is recorded.
- Open issues remain visible.
- Production release remains separate.

### 40.2 Room stories

#### Story ROOM-01 — Draw measured room

As a salesperson,

I want to draw the measured room quickly,

so that cabinet fit is grounded in site dimensions.

Acceptance:

- Dimensions are shown in selected units.
- Wall IDs remain stable after save.
- Room appears in 3D.
- Plan dimensions and project data agree.

#### Story ROOM-02 — Place opening

As a salesperson,

I want to place a door or window on a wall,

so that cabinet layout respects the real room.

Acceptance:

- Opening stays attached to wall.
- Offset and dimensions are editable.
- Opening appears in 3D.
- Cabinet validation uses opening envelope.

#### Story ROOM-03 — Revise wall after cabinet placement

As a salesperson,

I want to correct a wall measurement,

so that I can revise the proposal without rebuilding it.

Acceptance:

- Attached run reflows when safe.
- Cabinet widths do not change silently.
- Unsafe result raises an actionable warning.
- Quote and cutlist update only for actual configuration changes.

### 40.3 Cabinet stories

#### Story CABINET-01 — Place a base cabinet

As a salesperson,

I want to place a standard base cabinet,

so that I can begin a run.

Acceptance:

- Object type is `base`.
- Default family is explicit.
- Cabinet snaps to wall.
- Toe kick is visible.
- Correct production construction resolves.

#### Story CABINET-02 — Place a wall cabinet

As a salesperson,

I want to place a wall cabinet at a useful height,

so that the design looks and engineers correctly.

Acceptance:

- Object type is `wall`.
- Wall attachment is explicit.
- Mounting height is preserved.
- 3D shows a wall-mounted cabinet.
- Cutlist uses wall-cabinet construction defaults.

#### Story CABINET-03 — Place a tall cabinet

As a salesperson,

I want to place a tall cabinet,

so that full-height storage is represented correctly.

Acceptance:

- Object type is `tall`.
- 3D shows a tall cabinet, not a bookcase stand-in.
- Countertop excludes the tall cabinet.
- Cutlist uses tall-cabinet construction.

#### Story CABINET-04 — Configure drawer base

As a salesperson,

I want to choose a drawer-front preset,

so that the client can see and price the intended front layout.

Acceptance:

- Drawer count updates structured composition.
- 3D updates.
- Slide hardware updates.
- Cost updates.
- Cutlist updates.

#### Story CABINET-05 — Change width

As a salesperson,

I want to change cabinet width once,

so that every output stays synchronized.

Acceptance:

- Plan footprint updates.
- 3D updates.
- Run reflows or warns.
- Quote updates.
- Cutlist updates.
- Saved project stores new width.

### 40.4 Run stories

#### Story RUN-01 — Build straight run

As a salesperson,

I want cabinets to snap into an ordered wall run,

so that layout is fast and consistent.

Acceptance:

- Cabinet fronts align.
- Order is deterministic.
- Run membership is saved.
- Run length is shown.
- Overlap is prevented or blocked.

#### Story RUN-02 — Fill remaining wall space

As a salesperson,

I want fillers calculated at run ends,

so that the proposal reflects installable fit.

Acceptance:

- Remaining space is calculated from canonical dimensions.
- Filler side is explicit.
- Filler width is shown.
- Filler appears in 3D.
- Filler appears in relevant technical output.

#### Story RUN-03 — Generate countertop

As a salesperson,

I want a continuous countertop over eligible cabinets,

so that the client sees a coherent run.

Acceptance:

- Base and drawer cabinets are covered.
- Wall and tall cabinets are excluded.
- Break-after settings are respected.
- 3D and technical summaries agree.

### 40.5 Review stories

#### Story REVIEW-01 — Inspect cabinet in 3D

As a salesperson,

I want to select the cabinet in 3D,

so that I can verify and revise it in context.

Acceptance:

- Selection resolves canonical cabinet ID.
- Inspector shows current dimensions.
- Material editing targets semantic slots.
- Change appears in plan and 3D.

#### Story REVIEW-02 — Save proposal view

As a salesperson,

I want to name and save a useful camera,

so that the proposal uses intentional views.

Acceptance:

- Pose and field of view are stored.
- Name is editable.
- View appears in proposal selection.
- Deleted camera is detected as stale.

### 40.6 Quote stories

#### Story QUOTE-01 — Review live total

As a salesperson,

I want to see the current estimated total,

so that I can discuss scope before producing the proposal.

Acceptance:

- Total updates after cabinet changes.
- Currency is visible.
- Missing rate warnings are visible.
- Live estimate is labeled as not yet frozen.

#### Story QUOTE-02 — Apply commercial settings

As an authorized user,

I want to review markup, tax, and discount,

so that the proposal follows business policy.

Acceptance:

- Values are bounded.
- Total updates deterministically.
- Settings are reviewable.
- Settings freeze with quote snapshot.

#### Story QUOTE-03 — Detect stale quote

As a salesperson,

I want to know when the design changed after quoting,

so that I do not resend an outdated price.

Acceptance:

- Fingerprint comparison detects relevant changes.
- UI labels the quote stale.
- Final proposal generation requires re-freeze or explicit override.

### 40.7 Proposal stories

#### Story PROPOSAL-01 — Create branded proposal

As a salesperson,

I want one client-ready PDF,

so that I can send a coherent proposal without assembling files manually.

Acceptance:

- Required identity is present.
- Saved views are present.
- Price matches quote snapshot.
- Inclusions and exclusions are present.
- Revision is present.
- PDF renders without clipping.

#### Story PROPOSAL-02 — Choose price detail

As a business owner,

I want to choose summary or itemized pricing,

so that proposals match company policy.

Acceptance:

- Summary mode shows total and approved summary lines.
- Itemized mode shows cabinet marks and prices.
- Hidden workshop cost never leaks unintentionally.

### 40.8 Engineering stories

#### Story ENGINEERING-01 — Continue approved design

As an engineer,

I want to open the approved design with full cabinet configuration,

so that I do not redraw it.

Acceptance:

- Cabinet IDs match.
- Cabinet types match.
- Dimensions match.
- Composition matches.
- Materials match.
- Adapter reports no loss.

#### Story ENGINEERING-02 — Refine construction

As an engineer,

I want to change construction details,

so that the design follows workshop standards.

Acceptance:

- Cutlist updates.
- Cost updates.
- Revision drift appears.
- Approved snapshot remains intact.

### 40.9 Production stories

#### Story PRODUCTION-01 — Review cutlist

As a production planner,

I want a grouped cutlist,

so that I can review parts by material, thickness, or cabinet.

Acceptance:

- Shop references are present.
- Cabinet marks are traceable.
- Part dimensions are present.
- Edge and grain are present.
- Revision is present at export.

#### Story PRODUCTION-02 — Review hardware

As a production planner,

I want a hardware rollup,

so that procurement quantities are visible.

Acceptance:

- Quantity derives from cabinet configuration.
- Per-cabinet traceability exists.
- Cost is visible where permitted.
- Missing items create blockers.

#### Story PRODUCTION-03 — Release production packet

As an authorized user,

I want to freeze a production packet,

so that the workshop receives one controlled revision.

Acceptance:

- Approval exists or override is recorded.
- No unresolved blocker exists.
- Packet fingerprint is recorded.
- Generated file identifies revision.

---

## 41. Test strategy

### 41.1 Test pyramid

The product uses:

- Pure domain tests.
- Adapter contract tests.
- Component interaction tests where useful.
- End-to-end workflow tests.
- Visual or structural scene tests.
- PDF render verification.
- Manual pilot protocols.

### 41.2 Domain tests

Domain tests must cover:

- Normalization.
- Validation.
- Geometry derivation.
- Construction.
- Cutlist.
- Hardware.
- Costing.
- Quote arithmetic.
- Revision fingerprint.
- Migration.

### 41.3 Adapter tests

Every golden family fixture must assert:

- ID.
- Type.
- Dimensions.
- Placement.
- Attachment.
- Composition.
- Construction.
- Hardware.
- Materials.
- Round-trip diagnostics.

### 41.4 Scene tests

Every golden family must assert semantic primitives or resolved geometry for:

- Carcass.
- Fronts.
- Drawers where applicable.
- Toe kick where applicable.
- Wall mounting where applicable.
- Material groups.

### 41.5 Quote tests

Quote tests must cover:

- Markup.
- Tax.
- Discount.
- Finish premium.
- Labour allowance.
- Hardware allowance.
- Currency label.
- Validity date.
- Snapshot reproducibility.

### 41.6 PDF verification

Generated proposal and production PDFs require:

- Text-content assertions.
- Page-count expectations.
- Render-to-image visual inspection for benchmark fixtures.
- No clipping.
- No blank required section.
- Legible fonts.
- Stable revision identifiers.

### 41.7 End-to-end tests

The golden journey must include:

1. Create or open benchmark job.
2. Confirm room.
3. Place golden cabinets.
4. Form run.
5. Add fillers.
6. Review in 3D.
7. Resize one cabinet.
8. Verify visual update.
9. Verify price update.
10. Save proposal view.
11. Freeze quote.
12. Generate proposal.
13. Save project.
14. Reopen project.
15. Send to engineering.
16. Verify IDs.
17. Generate cutlist.
18. Verify revision.

### 41.8 Test requirements

- `TST-001` — Every P0 requirement must map to at least one test or explicit pilot check.
- `TST-002` — Golden end-to-end test must not depend on third-party network services.
- `TST-003` — Test fixtures must be deterministic.
- `TST-004` — Time-sensitive values must be injectable where practical.
- `TST-005` — Adapter fallback must have a negative test.
- `TST-006` — Proposal stale-state must have an end-to-end test.
- `TST-007` — Save/reopen must be part of the golden journey.
- `TST-008` — Full-suite sequential execution must be a release gate.
- `TST-009` — A passing unit test alone cannot mark a client-facing feature market-ready.
- `TST-010` — Pilot acceptance must remain separate from automated correctness.

---

## 42. Release gates

### 42.1 Gate A — Data truth

Pass when:

- Golden cabinets have explicit types.
- Golden cabinets have complete configuration.
- Adapter produces no loss diagnostics.
- Save/reopen preserves identity.

### 42.2 Gate B — Visual credibility

Pass when:

- Golden cabinet families are visually distinct.
- Front composition matches configuration.
- Materials map correctly.
- No golden cabinet uses a misleading stand-in.

### 42.3 Gate C — Commercial correctness

Pass when:

- Quote arithmetic tests pass.
- Live total updates.
- Quote snapshot freezes.
- Stale quote is detected.
- Proposal matches snapshot.

### 42.4 Gate D — Engineering continuity

Pass when:

- Engineering receives same IDs.
- No dimensions are re-entered.
- Config is editable.
- Cutlist derives successfully.

### 42.5 Gate E — Release reliability

Pass when:

- Build passes.
- Unit suite passes.
- End-to-end suite passes sequentially.
- Golden journey passes after clean launch.
- Golden journey passes after reopen.
- Proposal PDF verification passes.

### 42.6 Gate F — Market validation

Pass when:

- Five cabinet-sales users complete the benchmark.
- Median completion time is at or below target.
- Major failure patterns are addressed.
- Two engineers accept the handoff as a usable starting point.

### 42.7 Release labels

- Internal prototype: Gates A partially complete.
- Engineering alpha: Gates A and B complete.
- Sales pilot: Gates A through E complete.
- Validated wedge release: Gates A through F complete.

---

## 43. Definition of done

### 43.1 Feature done

A feature is done when:

- Requirement is implemented.
- Domain behavior is tested.
- User interaction is tested where relevant.
- Error and empty states exist.
- Save/reopen behavior is defined.
- Derived outputs are updated.
- Documentation is updated.
- Status in this book is updated.

### 43.2 Cabinet family done

A cabinet family is done when:

- Type is explicit.
- Defaults are normalized.
- Catalog entry exists.
- Plan representation exists.
- 3D representation exists.
- Inspector editing exists.
- Adapter coverage exists.
- Construction exists.
- Cutlist exists.
- Hardware exists where applicable.
- Costing exists.
- Quote smoke coverage exists.
- Save/reopen passes.

### 43.3 Proposal done

A proposal feature is done when:

- Content is correct.
- PDF renders correctly.
- Frozen quote is referenced.
- Revision is visible.
- Stale state is blocked or disclosed.
- File name is deterministic.
- Failure recovery is clear.

### 43.4 Production feature done

A production feature is done when:

- Source revision is explicit.
- Source cabinet IDs are traceable.
- Validation gate exists.
- Verification level is labeled.
- Output is reproducible.
- Fixtures are reviewed.

---

## 44. Prioritized backlog

### 44.1 P0 — Must build now

1. Explicit cabinet type and family in Interiors catalog.
2. Lossless cabinet adapter with diagnostics.
3. Golden family round-trip fixtures.
4. Shared cabinet geometry in Interiors 3D.
5. Removal of golden bookcase stand-ins.
6. Golden run plan and 3D semantics.
7. Live quote total in Review.
8. Quote freeze and stale detection.
9. Branded proposal PDF.
10. Send-to-Engineering transition.
11. Golden end-to-end benchmark.
12. Sequential release reliability.

### 44.2 P1 — Build after P0 gates

1. Sink cabinet.
2. Corner cabinet hardening.
3. Appliance tower.
4. Shop-specific cabinet templates.
5. Improved wall and opening clearance rules.
6. Proposal alternatives.
7. Installation notes.
8. Improved revision compare.
9. Production-packet layout hardening.
10. Pilot feedback fixes.

### 44.3 P2 — Later

1. Advanced wardrobe internals.
2. Islands.
3. Curved and radius cabinetry.
4. Expanded countertop fabrication.
5. Multi-user review.
6. Order-system integration.
7. Supplier-specific hardware catalogs.
8. Supplier-specific board catalogs.
9. Verified machine adapter research.
10. Customer web review portal.

### 44.4 Excluded from current roadmap

1. AI room decoration.
2. Generative floor planning.
3. General furniture marketplace.
4. Social feed.
5. Real-estate listing automation.
6. Whole-building BIM authoring.
7. Mobile feature parity.
8. Unverified CNC claims.

---

## 45. Pilot protocol

### 45.1 Participants

Minimum:

- Five cabinet salespeople or salesperson-designers.
- Two cabinet engineers.
- One production reviewer where possible.

### 45.2 Sales task

Participant receives:

- Measured room brief.
- Cabinet requirements.
- Material choice.
- Commercial policy.

Participant must:

- Create room.
- Build run.
- Review 3D.
- Revise width.
- Create quote.
- Create proposal.
- Send to engineering.

### 45.3 Recorded observations

- Completion time.
- Assistance requested.
- Mis-clicks.
- Undo use.
- Invalid states.
- Confusing terminology.
- Confidence in visual.
- Confidence in price.
- Confidence in handoff.

### 45.4 Engineer task

Engineer must:

- Open handed-off project.
- Inspect cabinet types.
- Inspect dimensions.
- Inspect composition.
- Change construction detail.
- Generate cutlist.
- Identify missing information.

### 45.5 Pilot pass criteria

- Median sales completion under 15 minutes.
- No participant re-enters cabinet dimensions for handoff.
- At least four of five complete without facilitator takeover.
- No type corruption.
- No quote mismatch.
- Both engineers call the handoff a usable starting point.

### 45.6 Pilot honesty

The pilot is not passed by positive comments alone.

Observed task completion controls the decision.

---

## 46. Risk register

### 46.1 Risk R-01 — Two truths

Risk:

Interior and cabinet models diverge.

Impact:

Wrong visuals, quotes, or production outputs.

Mitigation:

- Explicit canonical ownership.
- Lossless adapter.
- Round-trip tests.
- Block silent fallback.

### 46.2 Risk R-02 — Attractive but wrong cabinets

Risk:

Client views look credible while technical configuration differs.

Impact:

Approval disputes and engineering redraw.

Mitigation:

- Shared geometry derivation.
- Semantic material mapping.
- Proposal gate.

### 46.3 Risk R-03 — Hidden value

Risk:

Cutlist, costing, and quote capabilities remain buried in advanced surfaces.

Impact:

Sales users perceive no wedge advantage.

Mitigation:

- Live total.
- Create Proposal.
- Send to Engineering.
- Outcome-oriented navigation.

### 46.4 Risk R-04 — False production confidence

Risk:

Preview outputs are mistaken for verified machine output.

Impact:

Manufacturing errors.

Mitigation:

- Strong labeling.
- Release gates.
- No CNC language for previews.

### 46.5 Risk R-05 — Scope expansion

Risk:

The roadmap expands into generic interiors features.

Impact:

Golden workflow has automated sequential coverage; salesperson timing remains Gate F.

Mitigation:

- P0 freeze.
- Requirement-to-metric mapping.
- Competitive guardrails.

### 46.6 Risk R-06 — Architecture scoring

Risk:

Internal correctness is mistaken for buyer value.

Impact:

Inflated readiness claims.

Mitigation:

- Buyer-weighted release gates.
- Timed pilot.
- Separate automated and market validation.

### 46.7 Risk R-07 — Quote trust

Risk:

Incomplete or generic rates produce misleading totals.

Impact:

Commercial loss.

Mitigation:

- Missing-rate warnings.
- Configurable policies.
- Frozen settings.
- Review step.

### 46.8 Risk R-08 — Performance collapse

Risk:

Shared detailed geometry slows interactive editing.

Impact:

Sales workflow becomes unusable.

Mitigation:

- Geometry caching.
- Level of detail.
- Warm-path budgets.
- Golden-project profiling.

---

## 47. Decision log

### DEC-001 — Cabinet-sales wedge

Decision:

Prioritize cabinet proposal-to-production over general-interiors parity.

Status:

Accepted.

### DEC-002 — No AI decoration program

Decision:

AI decoration is excluded from the immediate roadmap.

Status:

Accepted.

### DEC-003 — One cabinet truth

Decision:

Plan, 3D, quote, cutlist, and production must derive from one normalized cabinet configuration.

Status:

Accepted.

### DEC-004 — Shared cabinet geometry

Decision:

Golden cabinet visuals must use cabinet-specific geometry, not bookcase stand-ins.

Status:

Accepted.

### DEC-005 — Quote before broader rendering

Decision:

Commercial proposal completion has priority over additional render modes.

Status:

Accepted.

### DEC-006 — Machine previews remain unverified

Decision:

Current machine output remains intent/preview only.

Status:

Accepted.

### DEC-007 — User validation required

Decision:

The 6.5 cabinet-sales score remains provisional until timed pilot validation.

Status:

Accepted.

### DEC-008 — First pilot segment

Decision:

The first pilot is one straight kitchen-style cabinet run authored inside the Interiors room workflow.

It includes base, drawer, wall, and tall cabinets, fillers, and countertop.

It does not attempt a whole-kitchen, wardrobe, or living-room media-wall pilot.

Status:

Accepted.

---

## 48. Open questions

Open questions do not authorize work automatically.

### 48.1 Product questions

- Is pricing shown itemized or summarized by default?
- Who may change markup and discount?
- Is client approval captured inside the application or externally?
- Which proposal branding fields are required?
- Which markets and currencies are first?

### 48.2 Engineering questions

- Should `InteriorProject` become the only canonical persisted schema?
- Which cabinet configuration fields move into first-class entity fields?
- How should adapter loss diagnostics be represented?
- Can existing cabinet geometry compile directly to interior scene primitives?
- How should run membership be represented canonically?
- How should wall attachment survive arbitrary topology?

### 48.3 Production questions

- Which construction presets match the first pilot shops?
- Which board catalogs are required?
- Which hardware catalogs are required?
- What level of cutlist verification will shops accept?
- Which production packet pages are essential?
- Is sheet yield informational or operational in the first pilot?

### 48.4 Research questions

- What is the current manual proposal turnaround time?
- Where does duplicate entry happen today?
- Which visual detail most affects client confidence?
- Which technical data does engineering most often correct?
- Which quote line items are required by pilot shops?

---

## 49. Traceability map

### 49.1 Product promise to requirements

| Promise segment | Primary requirements |
| --- | --- |
| Measure room | `WF-040`–`WF-048` |
| Build run | `RUN-001`–`RUN-010` |
| Credible presentation | `VIS-001`–`VIS-025`, `RND-001`–`RND-008` |
| Price | `QTE-001`–`QTE-030` |
| Proposal | `EXP-001`–`EXP-010` |
| Approval | `REV-020`–`REV-028` |
| Engineering reuse | `ENG-001`–`ENG-026` |
| Production | `PRD-001`–`PRD-055` |

### 49.2 P0 epics to gates

| Epic | Gates |
| --- | --- |
| Cabinet identity and adapter | Gate A, Gate D |
| Shared cabinet geometry | Gate B |
| Proposal surface | Gate C |
| Engineering handoff | Gate D |
| Golden verification | Gate E |
| Pilot | Gate F |

### 49.3 Existing implementation references

Key implementation areas:

- `src/domain/interiorProject/`
- `src/domain/interiorProject/cabinetAdapter.ts`
- `src/domain/livingRoom/catalogItems.ts`
- `src/domain/livingRoom/sceneAdapters.ts`
- `src/domain/cabinetDimensions/`
- `src/domain/cabinetComposition/`
- `src/domain/cabinetConstruction/`
- `src/domain/cabinetGeometry/`
- `src/domain/cabinetRuns/`
- `src/domain/hardwareSystem/`
- `src/domain/productionCutlist.ts`
- `src/domain/costing.ts`
- `src/domain/projectQuote.ts`
- `src/domain/projectReport/`
- `src/domain/projectReview/`
- `src/domain/machineExport/`
- `src/domain/pdfExport/`
- `src/hooks/useMillworkSchedule.ts`

### 49.4 Existing document references

- `docs/PRODUCT_DECISIONS.md`
- `docs/INTERIOR_DESIGN_TOOL_ROADMAP.md`
- `docs/MILLWORK_SCHEDULE_V1.md`
- `docs/FLOORPLANNER_D0_TOPOLOGY_ADR.md`
- `docs/STILLJOB_TRUST_CONTRACT.md`
- `docs/PHASE_2_HYBRID_STILLS_PIPELINE.md`

---

## 50. Glossary

### Accepted still

A presentation still explicitly accepted for inclusion in a client package.

### Adapter

A transformation between the interior authoring model and cabinet engineering model.

### Approval

A recorded acceptance of a specific project revision.

### Cabinet family

A reusable technical cabinet definition with defaults and capabilities.

### Cabinet mark

A human-readable revision-specific reference such as C01.

### Cabinet type

A technical behavior category such as base, wall, tall, drawer, or corner.

### Canonical project

The authoritative editable project state.

### Client preview

A client-facing render tier derived from authored truth.

### Composition

The structured arrangement of doors, drawers, shelves, openings, and dividers.

### Construction

The rules that determine how a cabinet and its parts are built.

### Cutlist

A derived list of production parts with dimensions and material information.

### Engineering handoff

The transition from approved sales design to detailed cabinet engineering without recreation.

### Filler

A run component that closes installation space between cabinet and boundary.

### Fingerprint

A compact summary used to detect meaningful revision changes.

### Golden Cabinet Run

The first controlled end-to-end benchmark and release slice.

### Handoff loss

Any source information that cannot be represented in the destination model.

### Hardware schedule

A derived rollup of hinges, slides, handles, legs, brackets, pins, and accessories.

### Millwork schedule

A high-level list of millwork objects, dimensions, materials, and quantities.

### Normalized cabinet configuration

A complete valid cabinet configuration after defaults and compatibility rules are applied.

### Production packet

A revision-specific set of reviewed workshop documents.

### Proposal

A client-facing commercial document combining design views, scope, and price.

### Quote snapshot

An immutable record of commercial totals and settings for a revision.

### Run

An ordered group of cabinets sharing a wall direction or supported transition.

### Semantic material slot

A material assignment tied to a role such as carcass or fronts.

### Source of truth

The authoritative state from which derived representations are generated.

### Stand-in mesh

A temporary visual representation that does not accurately express the cabinet family.

### Stale quote

A frozen quote that no longer matches the live project revision.

### Verified CNC

Machine-ready output validated for a specific machine, tooling, post-processor, and workflow.

### Wedge

A narrow customer job where the product can be meaningfully better than broad competitors.

---

## 51. Final governing statements

1. Cabinet Studio wins by connecting sales intent to cabinet truth.
2. The project must have one dimensional truth.
3. Cabinet type must be explicit.
4. A cabinet must look like the cabinet it represents.
5. Price must respond to construction.
6. Engineering must continue without redraw.
7. Production outputs must identify revision and verification level.
8. A feature is not market-ready because code exists.
9. A wedge is not validated because a scorecard says so.
10. The Golden Cabinet Run is the immediate development program.

---

## Appendix A — P0 requirement checklist

### A.1 Data truth

- [x] `DAT-001` Explicit cabinet type.
- [x] `DAT-002` Stable cabinet ID.
- [x] `DAT-003` Complete normalized configuration.
- [x] `DAT-004` Category is not type.
- [x] `DAT-005` Catalog ID, SKU, type, and category separated.
- [x] `DAT-006` JSON-safe configuration.
- [x] `DAT-007` Schema version.
- [x] `DAT-008` Migration coverage.
- [x] `DAT-009` Old-project compatibility.
- [x] `DAT-010` Derived output does not mutate source.
- [x] `DAT-014` Adapter loss reporting.
- [x] `DAT-015` No silent family fallback.

### A.2 Golden cabinets

- [x] Base cabinet fixture.
- [x] Drawer cabinet fixture.
- [x] Wall cabinet fixture.
- [x] Tall cabinet fixture.
- [x] Filler fixture.
- [ ] Countertop fixture.
- [x] Save/reopen coverage.
- [x] Adapter coverage.
- [x] 3D semantic coverage.
- [x] Cutlist coverage.
- [x] Quote coverage.

### A.3 Proposal

- [x] Live total.
- [x] Commercial review.
- [x] Quote freeze.
- [x] Stale quote.
- [x] Named proposal views.
- [x] Branded PDF.
- [x] Price-detail policy.
- [x] Inclusions.
- [x] Exclusions.
- [x] Approval area.
- [x] PDF render verification.

### A.4 Engineering handoff

- [x] Send-to-Engineering action.
- [x] Handoff diagnostics.
- [x] Same IDs.
- [x] Same types.
- [x] Same dimensions.
- [x] Same composition.
- [x] Same construction.
- [x] Same hardware.
- [x] Same material roles.
- [x] Same revision identity.

### A.5 Release

- [x] Domain suite green.
- [x] Build green.
- [x] Golden journey green.
- [x] Full sequential browser suite green.
- [ ] Proposal visual verification complete.
- [ ] Production packet verification complete.
- [ ] Five-user pilot complete.
- [ ] Two-engineer handoff review complete.

---

## Appendix B — Status update template

Use this template for every material implementation update.

```markdown
### Update: <title>

Date: YYYY-MM-DD
Owner: <name or team>
Requirements: <IDs>
Old status: <status>
New status: <status>

What changed:

- ...

Evidence:

- Tests: ...
- Manual verification: ...
- Pilot evidence: ...

Known limitations:

- ...

Migration impact:

- ...

Release impact:

- ...
```

---

## Appendix C — Decision record template

```markdown
### DEC-XXX — <decision name>

Date: YYYY-MM-DD
Status: proposed | accepted | superseded | rejected
Decision owner: <role>

Context:

<What is happening and why a decision is required.>

Decision:

<The chosen direction.>

Alternatives considered:

1. ...
2. ...

Consequences:

- Positive: ...
- Negative: ...
- Migration: ...

Evidence:

- ...

Affected requirements:

- ...
```

---

## Appendix D — Feature proposal template

```markdown
### Feature: <name>

Status: RESEARCH
Primary user: <role>
Workflow step: <step>
Metric moved: <metric>

Problem:

<Observed user problem.>

Proposed outcome:

<What becomes possible.>

Non-goals:

- ...

Data impact:

- ...

Derived-output impact:

- Plan: ...
- 3D: ...
- Quote: ...
- Cutlist: ...
- Production: ...

Acceptance:

- ...

Evidence required:

- ...
```

---

## Appendix E — Golden benchmark run sheet

### E.1 Preparation

- [ ] Use declared application build.
- [ ] Use declared hardware.
- [ ] Reset application state.
- [ ] Load benchmark brief.
- [ ] Start screen recording where consented.
- [ ] Start timer. Target median: under 15 minutes (`OBS-001`). A passing P0-E automation run is not a Gate F pass.

### E.2 Task sequence

- [ ] Create job.
- [ ] Confirm room.
- [ ] Place door.
- [ ] Place window or obstruction.
- [ ] Place tall cabinet.
- [ ] Place two base cabinets.
- [ ] Place drawer cabinet.
- [ ] Place two wall cabinets.
- [ ] Form run.
- [ ] Add fillers.
- [ ] Add countertop.
- [ ] Resolve blockers.
- [ ] Open 3D.
- [ ] Save client view.
- [ ] Change one cabinet width.
- [ ] Confirm 3D change.
- [ ] Confirm total change.
- [ ] Freeze quote.
- [ ] Generate proposal.
- [ ] Save project.
- [ ] Reopen project.
- [ ] Send to engineering.
- [ ] Generate cutlist.
- [ ] Stop timer.

### E.3 Observation sheet

- Completion time:
- Facilitator interventions:
- Errors:
- Undo actions:
- Abandoned actions:
- Confusing labels:
- Confidence in 3D, 1–5:
- Confidence in price, 1–5:
- Confidence in handoff, 1–5:
- Participant comments:
- Reviewer notes:

---

## Appendix F — Superseded framing

The following framing is superseded:

- “Compete with broad interior planners feature for feature.”
- “The cabinet wedge is already an 8.”
- “A millimetre schedule alone proves workshop value.”
- “Render provenance earns buyer-facing quality points by itself.”
- “Feature landed means market hardened.”

The accepted framing is:

> Cabinet Studio is a 6.1 general-interiors product and a provisional 6.5 cabinet-sales product. The immediate path to 8 is a trustworthy cabinet proposal-to-production loop, proven through the Golden Cabinet Run and real-user validation.

---

## Appendix G — Canonical feature register

This register is the compact inventory of user-visible and foundational capabilities.

The detailed sections above govern behavior.

### G.1 Job and project

| Feature | Status | Governing requirement or note |
| --- | --- | --- |
| Create project | `SHIPPED` | Canonical project creation exists. |
| Customer name | `SHIPPED` | `WF-035` |
| Project number | `SHIPPED` | `WF-036` |
| Revision label | `SHIPPED` | `WF-035` |
| Job notes | `SHIPPED` | Job metadata. |
| Draft status | `SHIPPED` | `WF-030` |
| Quoted status | `SHIPPED` | `WF-031`; quote workflow needs sales surfacing. |
| Approved status | `SHIPPED` | `WF-032`; approval UX remains hardening. |
| Production status | `SHIPPED` | `WF-033`; release gate remains hardening. |
| Status timestamps | `SHIPPED` | Job metadata domain. |
| Save project | `SHIPPED` | `DAT-020`–`DAT-022` require continued hardening. |
| Open project | `SHIPPED` | Versioned file loader. |
| Save As | `SHIPPED` | Desktop file workflow. |
| Recent projects | `SHIPPED` | Desktop UX domain. |
| Browser recovery | `SHIPPED` | Recovery behavior requires release verification. |
| Dirty-state indicator | `SHIPPED` | Must remain visible after failures. |
| Schema version | `SHIPPED` | `DAT-007` |
| Project migrations | `SHIPPED` | `DAT-008`–`DAT-009` |
| Migration diagnostics | `HARDEN` | `DAT-023` |
| Adapter-loss diagnostics | `HARDEN` | `DAT-014`, `ENG-002` |

### G.2 Room authoring

| Feature | Status | Governing requirement or note |
| --- | --- | --- |
| Blank room | `SHIPPED` | Room starter. |
| Rectangular room draw | `SHIPPED` | Room drawing domain. |
| Polygon room draw | `SHIPPED` | Closed-loop geometry. |
| Starter room templates | `SHIPPED` | Current starter projects. |
| Underlay import | `SHIPPED` | Usability remains `HARDEN`. |
| Underlay calibration | `HARDEN` | `WF-046` |
| Draw wall | `SHIPPED` | Wall command domain. |
| Move wall | `SHIPPED` | Wall-edit domain. |
| Move wall node | `SHIPPED` | Wall-edit domain. |
| Split wall | `SHIPPED` | Wall graph operations. |
| Join wall nodes | `SHIPPED` | Wall graph operations. |
| Delete wall | `SHIPPED` | Orphan handling remains a release concern. |
| Wall thickness editing | `SHIPPED` | `WF-048` |
| Wall height editing | `SHIPPED` | `WF-048` |
| Room split | `SHIPPED` | H1 implementation. |
| Room rename | `SHIPPED` | Multi-room management. |
| Room switch | `SHIPPED` | Active-room state. |
| Room delete | `SHIPPED` | Confirmation UX is `HARDEN`. |
| Simple room merge | `SHIPPED` | Multi-room operation. |
| Hole-bearing room merge | `HARDEN` | `WF-045` |
| Door placement | `SHIPPED` | Opening domain. |
| Door sizing | `SHIPPED` | Opening inspector. |
| Door swing | `SHIPPED` | Opening entity. |
| Window placement | `SHIPPED` | Opening domain. |
| Window sizing | `SHIPPED` | Opening inspector. |
| Window sill height | `SHIPPED` | Opening entity. |
| Surface zones | `SHIPPED` | Surface editing domain. |
| Structural columns | `SHIPPED` | Curated structural item. |
| Inner and outer dimensions | `SHIPPED` | Plan readability. |
| Display units | `SHIPPED` | Must remain explicit. |
| Opening-aware cabinet clearance | `HARDEN` | `WF-043` |

### G.3 Cabinet catalog and identity

| Feature | Status | Governing requirement or note |
| --- | --- | --- |
| Curated cabinet catalog | `SHIPPED` | Technical fidelity varies by item. |
| Base cabinet catalog item | `HARDEN` | Shared geometry; category remains merchandising. |
| Wall cabinet catalog item | `HARDEN` | Shared geometry at configured mount height. |
| Tall cabinet catalog item | `HARDEN` | Shared geometry; countertops do not pass through. |
| Wardrobe catalog item | `HARDEN` | Type mapping requires explicit contract. |
| Corner wardrobe catalog item | `HARDEN` | Corner representation exists; production semantics need review. |
| Feature-wall millwork | `SHIPPED` | Not part of Golden Cabinet Run. |
| Display niche | `SHIPPED` | Not part of Golden Cabinet Run. |
| Explicit cabinet type on native catalog item | `HARDEN` | `DAT-001`, `CAB-020` |
| Explicit cabinet family | `HARDEN` | `DAT-003`, `CAB-009` |
| Separate category and technical type | `HARDEN` | `DAT-004`–`DAT-005` |
| Persist normalized cabinet config | `HARDEN` | `DAT-003` |
| SKU field | `SHIPPED` | Present on selected items; governance is `HARDEN`. |
| Catalog type round-trip test | `HARDEN` | `CAB-022` |
| Catalog cutlist smoke test | `HARDEN` | Current coverage checks output existence. |
| Catalog quote smoke test | `NEXT` | `CAB-024` |
| Shop-specific cabinet templates | `LATER` | P1/P2 after Golden Run. |
| Favorite cabinet families | `LATER` | Not critical path. |
| Recent cabinet families | `LATER` | Not critical path. |
| General furniture marketplace | `EXCLUDED` | `STR-010` |

### G.4 Cabinet placement and run authoring

| Feature | Status | Governing requirement or note |
| --- | --- | --- |
| Place cabinet | `SHIPPED` | Plan interaction. |
| Select cabinet | `SHIPPED` | Plan and model selection. |
| Move cabinet | `SHIPPED` | Plan interaction. |
| Rotate cabinet | `SHIPPED` | Placement domain. |
| Resize cabinet | `SHIPPED` | Millimetre dimensions. |
| Duplicate cabinet | `SHIPPED` | Identity behavior must remain verified. |
| Delete cabinet | `SHIPPED` | Derived cleanup requires regression coverage. |
| Wall snap | `SHIPPED` | Freeform wall support. |
| Run detection | `SHIPPED` | Cabinet-run domain. |
| Run alignment | `SHIPPED` | Cabinet-run domain. |
| Run ordering | `SHIPPED` | Determinism requires golden fixture. |
| Run reflow | `SHIPPED` | Failure UX is `HARDEN`. |
| End fillers | `SHIPPED` | Golden Run includes both ends. |
| Corner transition | `SHIPPED` | Broader topology is `HARDEN`. |
| Countertop generation | `SHIPPED` | Cabinet CAD domain. |
| Countertop break | `SHIPPED` | Config field. |
| Run length summary | `SHIPPED` | Project report. |
| Manual coordinate-free Golden Run | `NEXT` | `RUN-010` |
| Opening clearance preview | `HARDEN` | `WF-043` |
| Appliance clearance | `HARDEN` | Requires pilot-family validation. |

### G.5 Cabinet configuration and engineering

| Feature | Status | Governing requirement or note |
| --- | --- | --- |
| Base type | `SHIPPED` | Cabinet domain. |
| Wall type | `SHIPPED` | Cabinet domain. |
| Tall type | `SHIPPED` | Cabinet domain. |
| Drawer type | `SHIPPED` | Cabinet domain. |
| Sink type | `SHIPPED` | Cabinet domain. |
| Corner type | `SHIPPED` | Cabinet domain. |
| Open-shelf type | `SHIPPED` | Cabinet domain. |
| Almirah type | `SHIPPED` | Cabinet domain. |
| Structured openings | `SHIPPED` | Cabinet composition. |
| Door configuration | `SHIPPED` | Composition and opening structure. |
| Drawer configuration | `SHIPPED` | Composition and opening structure. |
| Shelf configuration | `SHIPPED` | Composition. |
| Divider configuration | `SHIPPED` | Structured openings. |
| Toe-kick configuration | `SHIPPED` | Cabinet config. |
| End-panel configuration | `SHIPPED` | Cabinet config. |
| Frameless construction | `SHIPPED` | Construction spec. |
| Face-frame construction | `SHIPPED` | Construction spec. |
| Case joinery options | `SHIPPED` | Construction spec. |
| Door mount options | `SHIPPED` | Construction spec. |
| Shelf mount options | `SHIPPED` | Construction spec. |
| Drawer-box styles | `SHIPPED` | Construction spec. |
| Appliance inserts | `SHIPPED` | Hardware spec. |
| Engineering validation | `SHIPPED` | Manufacturing rules. |
| Sales preset to full configuration | `NEXT` | `CAB-030`–`CAB-031` |
| Send to Engineering | `HARDEN` | P0-D. |
| Lossless Interiors handoff | `HARDEN` | `ENG-001`–`ENG-012` |
| Post-approval drift indication | `HARDEN` | `ENG-022` |

### G.6 2D and 3D review

| Feature | Status | Governing requirement or note |
| --- | --- | --- |
| Cabinet plan footprint | `SHIPPED` | Plan object layer. |
| Cabinet selection highlight | `SHIPPED` | Plan selection. |
| Plan dimensions | `SHIPPED` | Plan readability. |
| Snap feedback | `SHIPPED` | Interaction feel is `HARDEN`. |
| Layout warnings | `SHIPPED` | Plan issues. |
| Dollhouse view | `SHIPPED` | 3D preset. |
| Orbit view | `SHIPPED` | 3D preset. |
| Front view | `SHIPPED` | 3D preset. |
| Top view | `SHIPPED` | 3D preset. |
| Perspective view | `SHIPPED` | 3D preset. |
| Walkthrough | `SHIPPED` | Client usability is `HARDEN`. |
| 3D selection | `SHIPPED` | Model pick path. |
| 3D inspector parity | `SHIPPED` | J2. |
| Camera bookmarks | `SHIPPED` | Package views. |
| Base cabinet-specific geometry | `HARDEN` | `VIS-001`–`VIS-004` |
| Wall cabinet-specific geometry | `HARDEN` | `VIS-001`, `VIS-006` |
| Drawer cabinet-specific geometry | `HARDEN` | `VIS-001`, `VIS-004` |
| Tall cabinet-specific geometry | `HARDEN` | `VIS-001`, `VIS-008` |
| Semantic material groups | `HARDEN` | `VIS-005` |
| Filler visual fidelity | `HARDEN` | Golden visual system. |
| Countertop visual fidelity | `HARDEN` | Golden run compiles a countertop over eligible floor cabinets; visual finish remains `HARDEN`. |
| Client navigation validation | `RESEARCH` | `VIS-025` |

### G.7 Render and client presentation

| Feature | Status | Governing requirement or note |
| --- | --- | --- |
| Draft preview | `SHIPPED` | Render-tier honesty. |
| Client preview | `SHIPPED` | Reliability remains `HARDEN`. |
| Still request | `SHIPPED` | StillJob foundation. |
| Still validation | `SHIPPED` | Trust gates. |
| Still review | `SHIPPED` | Accept/reject flow. |
| Accepted still packaging | `SHIPPED` | Client package. |
| Named package cameras | `SHIPPED` | K2. |
| Client package PDF | `SHIPPED` | Not yet full priced proposal. |
| Client package JSON | `SHIPPED` | Technical support artifact. |
| Render provenance | `SHIPPED` | Internal trust value. |
| Generate-still suite reliability | `HARDEN` | Known timing debt. |
| Golden client view | `HARDEN` | P0-C named views on the proposal. |
| Branded priced proposal | `HARDEN` | `EXP-001`–`EXP-010` |
| 360-degree tour | `EXCLUDED` | Not current critical path. |
| AI decoration | `EXCLUDED` | `STR-009` |

### G.8 Schedule, costing, and quotation

| Feature | Status | Governing requirement or note |
| --- | --- | --- |
| Millwork schedule CSV | `SHIPPED` | High-level sales/workshop schedule. |
| Millwork schedule PDF | `SHIPPED` | High-level sales/workshop schedule. |
| Cabinet schedule | `SHIPPED` | Project report. |
| Cabinet marks | `SHIPPED` | Report derivation. |
| Run summary | `SHIPPED` | Project report. |
| Material summary | `SHIPPED` | Project report. |
| Cost calculation | `SHIPPED` | Costing domain. |
| Cost presets | `SHIPPED` | Economy, standard, premium. |
| Waste setting | `SHIPPED` | Costing settings. |
| Labour setting | `SHIPPED` | Costing settings. |
| Hardware allowance | `SHIPPED` | Costing settings. |
| Material multiplier | `SHIPPED` | Costing settings. |
| Finish multiplier | `SHIPPED` | Costing settings. |
| Project quote calculation | `SHIPPED` | Project quote domain. |
| Markup | `SHIPPED` | Quote settings. |
| Tax | `SHIPPED` | Quote settings. |
| Discount | `SHIPPED` | Quote settings. |
| Quote validity | `SHIPPED` | Quote settings. |
| Inclusions and exclusions | `SHIPPED` | Quote settings. |
| Quote history | `SHIPPED` | Snapshot domain. |
| Live total in Interiors Review | `HARDEN` | `QTE-020` |
| Quote freeze in sales flow | `HARDEN` | `QTE-022` |
| Stale quote indicator | `HARDEN` | `QTE-023` |
| Configurable proposal detail | `HARDEN` | `QTE-030` |
| Missing-rate warning | `NEXT` | `QTE-006` |

### G.9 Production and reports

| Feature | Status | Governing requirement or note |
| --- | --- | --- |
| Production cutlist | `SHIPPED` | Construction-derived. |
| Cutlist CSV | `SHIPPED` | Secondary Interiors export exists. |
| Group cutlist by material | `SHIPPED` | Report center. |
| Group cutlist by thickness | `SHIPPED` | Report center. |
| Group cutlist by cabinet | `SHIPPED` | Report center. |
| Hardware schedule | `SHIPPED` | Hardware domain. |
| Per-cabinet hardware | `SHIPPED` | Hardware domain. |
| Sheet-yield estimate | `SHIPPED` | Sheet optimizer. |
| Kerf setting | `SHIPPED` | Sheet optimizer. |
| Trim setting | `SHIPPED` | Sheet optimizer. |
| Grain-aware rotation | `SHIPPED` | Sheet optimizer. |
| Production packet PDF | `SHIPPED` | Requires adapter and layout hardening. |
| Technical plan in packet | `SHIPPED` | Interior technical plan. |
| Project reports | `SHIPPED` | Report center. |
| Cabinet costing report | `SHIPPED` | Report center. |
| Quote report | `SHIPPED` | Report center. |
| Revision report | `SHIPPED` | Review domain. |
| Production readiness gate | `HARDEN` | `REV-025`, `PRD-042` |
| Golden cutlist fixture review | `NEXT` | `PRD-010` |
| Machine JSON preview | `SHIPPED` | Intent only. |
| Machine CSV operations preview | `SHIPPED` | Intent only. |
| Verified CNC | `EXCLUDED` | Requires a separate machine-specific program. |

### G.10 Review, approval, and release

| Feature | Status | Governing requirement or note |
| --- | --- | --- |
| Manual review notes | `SHIPPED` | Review domain. |
| Validation-derived notes | `SHIPPED` | Review domain. |
| Severity model | `SHIPPED` | Info through blocker. |
| Resolve note | `SHIPPED` | Resolution history. |
| Revision fingerprint | `SHIPPED` | Change detection. |
| Revision snapshot | `SHIPPED` | Freeze domain. |
| Revision compare | `SHIPPED` | Compare domain. |
| Quote snapshot | `SHIPPED` | Commercial freeze. |
| Approval record | `SHIPPED` | UX and permissions are `HARDEN`. |
| Release-for-production state | `SHIPPED` | Gate behavior is `HARDEN`. |
| Proposal gate | `HARDEN` | Existing pre-export checklist is narrower. |
| Separate production gate | `NEXT` | `REV-003` |
| Override reason | `NEXT` | `REV-008`, `REV-026` |
| Frozen production fingerprint | `NEXT` | `PRD-047` |

### G.11 Reliability, accessibility, and operations

| Feature | Status | Governing requirement or note |
| --- | --- | --- |
| Unit test suite | `SHIPPED` | Must remain green. |
| Browser end-to-end suite | `SHIPPED` | Sequential reliability is `HARDEN`. |
| Roadmap exit journey | `SHIPPED` | Broad workflow, not Golden Run. |
| Phase 2 still proof | `SHIPPED` | Trust proof. |
| Release build | `SHIPPED` | Build pipeline. |
| Golden Cabinet Run fixture | `SHIPPED` | Versioned `fixtures/golden-cabinet-run/v1.interior.json` includes the run, end fillers, and a derived countertop. |
| Golden Cabinet Run E2E | `SHIPPED` | Sequential journey with width, finish, quote, cutlist, and filler-ID stages. |
| Save/reopen Golden Run | `SHIPPED` | `TST-007` — file open after a cold reload, not recents. |
| Proposal visual verification | `NEXT` | PDF QA. |
| Production packet visual verification | `NEXT` | PDF QA. |
| Declared latency benchmark | `HARDEN` | `REL-008`–`REL-009` |
| Keyboard focus visibility | `HARDEN` | `ACC-002` |
| Canvas action alternatives | `HARDEN` | `ACC-007` |
| Five-salesperson pilot | `RESEARCH` | Gate F. |
| Two-engineer handoff review | `RESEARCH` | Gate F. |

### G.12 3D asset import and catalog

| Feature | Status | Governing requirement or note |
| --- | --- | --- |
| Packaged GLB starter assets | `SHIPPED` | Current starter pack. |
| User GLB selection | `SHIPPED` | `AST-001` |
| Sidecar PNG/JPEG/WebP selection | `SHIPPED` | Basic filename recognition. |
| Embedded GLB materials | `SHIPPED` | Used when sidecars are absent. |
| 25 MB model limit | `SHIPPED` | Current fixed limit. |
| Project-embedded imported asset | `SHIPPED` | Data URL persistence. |
| Import error message | `SHIPPED` | Basic failure feedback. |
| Model preview before placement | `HARDEN` | Current texture setup is not a full 3D normalization preview. |
| Detected bounding dimensions | `NEXT` | `AST-004` |
| Scale correction | `NEXT` | `AST-004` |
| Axis and orientation correction | `NEXT` | `AST-005` |
| Placement-origin correction | `NEXT` | `AST-005` |
| Mesh/material discovery | `NEXT` | Semantic slot mapping. |
| Manual texture-slot remapping | `NEXT` | `AST-007`–`AST-008` |
| Missing-texture diagnostics | `NEXT` | `AST-008` |
| Deterministic thumbnail | `NEXT` | `AST-011` |
| Local My Catalog | `LATER` | After Golden Run P0. |
| Cloud organization catalog | `LATER` | Requires backend asset service. |
| Asset optimization pipeline | `LATER` | Import-time or offline packaging. |
| FBX import | `RESEARCH` | Normalize to GLB first. |
| OBJ/MTL import | `RESEARCH` | Normalize to GLB first. |
| STL import | `RESEARCH` | Geometry-only and not useful for materials by default. |
| SketchUp import | `RESEARCH` | Requires conversion strategy. |
| Imported asset to production cabinet | `LATER` | Requires explicit family/configuration link. |
