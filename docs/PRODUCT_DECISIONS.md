# Product decisions (post cross-check)

Decisions locked after independent review of the MVP strategy brief. Keep this short and enforceable.

## Direction we keep

- **Plan → Model → Render** is the product shape. Do not rebuild as stills-first.
- Do **not** chase Synaps quality by endless `gl.render` polish.
- Do **not** ship premium stills UI before output quality exists.
- Phase 1 raises WebGL floor with a **hard scorecard**; Phase 2 is a **separate still pipeline** with a trust contract.

## First ICP (narrow wedge)

**Primary user:** custom cabinet shop salesperson / designer.  
**Primary job:** produce a revisable, client-facing living-room concept from a manufacturable layout (room + millwork + soft goods).  
**Primary output now:** honest WebGL Client Preview + package (PDF/PNG).  
**Not first:** consumer DIY marketplace, full-home staging SaaS, Synaps marketing stills.

## Cabinet-aware credibility

“Bridge workshop truth ↔ living-room preview” is only defensible if workshop-side value stays visible.

### Named near-term workshop deliverable (product truth, not slogan)

**`Living-room Millwork Schedule v1`**

- **What:** PDF or CSV export listing millwork/cabinet objects from the active living-room in `InteriorProject`
- **Fields (minimum):** object id, name/category, width×height×depth **mm**, material id(s), room id, quantity
- **Rule:** dimensions must match the same entities shown in Plan/Model (no separate “pretty” sizes)
- **When:** land as a parallel ticket **within one release of Phase 1 exit** (does not block the WebGL scorecard, but blocks calling the product “cabinet-aware” in marketing until it ships)
- **Not this deliverable:** full BOM pricing, CNC toolpaths, or MES

| Horizon | Must show progress |
|---|---|
| Now (Phase 1) | Procedural millwork stays dimensional truth in the living-room scene |
| Near-term (named) | **Millwork Schedule v1** above |
| Later | Pricing hooks / fab-ready exports built on that schedule |
| Do not claim | Full manufacturing MES before the client preview loop is trusted |

If Millwork Schedule v1 slips more than one release after Phase 1, rewrite positioning to “living-room viz with millwork placeholders” until the bridge is real.

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

## Next 2–4 weeks (execution)

| Week | Focus |
|---|---|
| 1 | Lock ICP (this doc), freeze 3 benchmark rooms × 2 cameras, write Phase 1 scorecard tests/fixtures, confirm schema/migration rules; open ticket for **Millwork Schedule v1** |
| 2 | Highest-ROI visuals only: window key light, contact shadows, eye-level framing defaults, calibrated top materials |
| 3 | Export QA on benchmarks under **locked latency environment**; prove Draft ≠ Client Preview without photoreal claims |
| 4 | StillJob **design spike only** (no AI magic): prove camera/material/scene handoff within **numeric tolerances** in the trust contract |

**Phase 1 exit (2026-08-14):** Accepted on `main`. Presentation-floor work + proof automation + PNG baselines shipped. Locked Tauri latency budgets remain follow-up debt (browser substitute over budget — not an official latency pass). Stop Phase 1 polish loops; do not reopen endless WebGL tuning.

**Current named ticket:** [Living-room Millwork Schedule v1 + Model inspector](./MILLWORK_SCHEDULE_V1.md) — workshop CSV/PDF from live Plan/Model millimetres, plus W×H×D and material slots in 3D Model. This is the cabinet-aware credibility deliverable; it is not another render-quality loop.

## Interiors V2 vs Cabinets CAD shell (UI chrome)

**Decision:** Keep an **intentional product split**. Do not unify header density, save controls, or view chrome between the Interiors V2 planner and the classic Cabinets/Job CAD shell in this release.

| Surface | Role | Chrome policy |
|---|---|---|
| **Interiors V2** (`lr-product-shell-v2`) | Living-room concept workflow: Project → Build → Design → Review | Dark green product shell, step rail, compact Save / 2D·3D |
| **Cabinets / Job / Drawings** | Engineering CAD: wall runs, elevation, assembly, reports | Light dense ribbon, tool rail, engineering inspector |

**Share:** `InteriorProject` / room–cabinet data truth, millimetres, undo, open/save file formats, and workbench mode switching.  
**Do not share yet:** visual tokens, header layout, or inspector typography — forcing one chrome would dilute both jobs.

**Revisit when:** a single salesperson workflow regularly hops Interiors ↔ Cabinets in one session *and* user testing shows chrome mismatch as a top friction. Until then, treat dual chrome as acceptable product framing, not debt.

Related: [UI_DISCREPANCY_ROADMAP.md](./UI_DISCREPANCY_ROADMAP.md) Phase 2 (C9).
