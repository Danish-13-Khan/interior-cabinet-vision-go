# Product decisions — cabinet proposal-to-production

Concise decisions supporting the canonical Product Book. Keep this file short and enforceable.

> **Canonical current direction:** [Cabinet Studio Product and Development Book](./CABINET_STUDIO_PRODUCT_BOOK.md).
> This file remains a concise historical decision record. Where product scope,
> priority, status language, or release gates differ, the Product Book governs.
> Backend, account, subscription, licensing, sync, and hosted asset decisions are
> governed by the [Backend, SaaS and Commercial Platform Book](./BACKEND_SAAS_COMMERCIAL_PLATFORM_BOOK.md).

## Direction we keep

- **Job → Room → Design → Review → Proposal → Engineering → Production** is the product workflow.
- The first pilot is one **straight kitchen-style cabinet run authored inside the Interiors room workflow**.
- Plan, 3D, quote, engineering, and production must preserve the same cabinet identity and configuration.
- Keep rendering as a client-confidence surface; do not rebuild the product as stills-first.
- Do **not** chase Synaps quality by endless `gl.render` polish.
- Do **not** prioritize AI decoration, general furniture breadth, 360 tours, or unverified CNC.
- The cabinet-sales wedge remains provisional until the Golden Cabinet Run passes timed user and engineering validation.

## First ICP (narrow wedge)

**Primary user:** custom cabinet shop salesperson / designer.

**Primary job:** turn a measured room and cabinet brief into an approved, priced, and technically reusable cabinet proposal.

**First pilot:** straight kitchen-style run with base, drawer, wall, and tall cabinets, fillers, and countertop.

**Primary output:** branded priced proposal plus same-project transition into the Cabinets engineering workbench.

**Not first:** consumer DIY marketplace, full-home staging SaaS, Synaps marketing stills.

## Cabinet-aware credibility

“Bridge workshop truth ↔ living-room preview” is only defensible if workshop-side value stays visible.

### Current named development program

**`Golden Cabinet Run v1`**

- **What:** one market-hardened straight cabinet run from measured room through proposal and engineering handoff.
- **Cabinets:** base, drawer, wall, and tall families plus fillers and countertop.
- **Truth rule:** the same normalized cabinet configuration drives plan, 3D, quote, cutlist, and production report.
- **Handoff rule:** “Send to Engineering” runs diagnostics and switches workbench mode on the same project; it does not export/import or recreate cabinets.
- **Validation rule:** no 8.0 claim until five sales users complete the timed run and two engineers accept the handoff.
- **Not this program:** whole-kitchen breadth, wardrobe internals, AI decoration, furniture marketplace, 360 tours, or verified CNC.

| Horizon | Must show progress |
|---|---|
| P0-A | HARDEN — explicit cabinet type/family, complete configuration, lossless adapter diagnostics |
| P0-B | HARDEN — cabinet-specific shared geometry; no Golden Run bookcase stand-ins |
| P0-C | HARDEN — live total, quote freeze, stale detection, branded proposal |
| P0-D | Same-project transition from Interiors to Cabinets engineering |
| P0-E | Save/reopen golden journey plus quote, proposal, and cutlist assertions |
| Gate F | Timed salesperson pilot and engineer handoff review |

`Living-room Millwork Schedule v1` is a shipped supporting capability, not the current named ticket and not sufficient proof of the wedge by itself.

## Data architecture rules (beyond “no Three / no paths”)

Already partially implemented via `schemaVersion`, migrations, and validators — treat as **first-class product rules**:

1. **Versioned schema** — every saved file has `schemaVersion`; bumps require a migration.
2. **Migrations on load** — old projects open; never require manual JSON surgery.
3. **Stable IDs** — entity ids and asset ids (material/model/environment) are stable references; registries resolve URLs at runtime.
4. **Units** — millimeter truth in project data; no silent unit flips.
5. **JSON-safe only** — no Three classes, GPU handles, or filesystem paths in saved projects.
6. **Backward compatibility** — additive fields preferred; breaking changes need migration + tests.

## Phase 2 trust (design now, build later)

See [STILLJOB_TRUST_CONTRACT.md](./STILLJOB_TRUST_CONTRACT.md).  
Still pipeline may enhance presentation **only** within that contract. Authoring scene remains editable truth.

## Current execution sequence

| Order | Focus |
|---|---|
| 1 | P0-A — cabinet identity, family, normalized config, adapter diagnostics |
| 2 | P0-B — shared cabinet geometry and semantic material roles |
| 3 | P0-C — HARDEN live quotation and branded proposal |
| 4 | P0-D — diagnosed same-project workbench transition to engineering |
| 5 | P0-E — golden end-to-end verification, save/reopen, full-suite reliability |
| 6 | Gate F — real salesperson timing and engineer acceptance |

## Historical presentation-phase record

**Phase 1 exit (2026-08-14):** Accepted on `main`. Presentation-floor work + proof automation + PNG baselines shipped. Locked Tauri latency budgets remain follow-up debt (browser substitute over budget — not an official latency pass). Stop Phase 1 polish loops; do not reopen endless WebGL tuning.

**Historical named ticket:** [Living-room Millwork Schedule v1 + Model inspector](./MILLWORK_SCHEDULE_V1.md) — shipped supporting work retained for context.

**Current named program:** [Golden Cabinet Run v1](./CABINET_STUDIO_PRODUCT_BOOK.md#9-golden-cabinet-run-v1).

## Interiors V2 vs Cabinets CAD shell (UI chrome)

**Decision:** Keep an **intentional visual product split**, but connect the workflows. Do not unify header density, save controls, or view chrome in P0. Add an explicit diagnosed mode transition from Interiors Review to the existing Cabinets engineering workbench using the same project state.

| Surface | Role | Chrome policy |
|---|---|---|
| **Interiors V2** (`lr-product-shell-v2`) | Living-room concept workflow: Project → Build → Design → Review | Dark green product shell, step rail, compact Save / 2D·3D |
| **Cabinets / Job / Drawings** | Engineering CAD: wall runs, elevation, assembly, reports | Light dense ribbon, tool rail, engineering inspector |

**Share:** `InteriorProject` / room–cabinet data truth, stable cabinet identities, normalized cabinet configuration, millimetres, undo, open/save file formats, and workbench mode switching.
**Do not share yet:** visual tokens, header layout, or inspector typography — forcing one chrome would dilute both jobs.

**P0 transition:** run handoff diagnostics, show the summary, block lossy Golden Run mappings, then switch workbench mode to Cabinets without creating a second project or requiring export/import.

**Revisit visual unification when:** pilot testing shows the chrome change is a top workflow failure. Until then, dual chrome is acceptable; disconnected data is not.

Related: [UI_DISCREPANCY_ROADMAP.md](../archive/UI_DISCREPANCY_ROADMAP.md) Phase 2 (C9).
