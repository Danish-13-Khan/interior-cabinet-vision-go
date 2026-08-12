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

“Bridge workshop truth ↔ living-room preview” is only defensible if workshop-side value stays visible:

| Horizon | Must show progress |
|---|---|
| Now (Phase 1) | Procedural millwork stays dimensional truth in the living-room scene |
| Near-term (parallel / next) | Explicit roadmap item for BOM / dimensional constraints / pricing or fab-ready hooks from InteriorProject — even if thin |
| Do not claim | Full manufacturing MES before the client preview loop is trusted |

If workshop outputs stall for multiple releases, rewrite positioning to “living-room viz with millwork placeholders” until the bridge is real.

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
| 1 | Lock ICP (this doc), freeze 3 benchmark rooms × 2 cameras, write Phase 1 scorecard tests/fixtures, confirm schema/migration rules in code/docs |
| 2 | Highest-ROI visuals only: window key light, contact shadows, eye-level framing defaults, calibrated top materials |
| 3 | Export QA on benchmarks; prove Draft ≠ Client Preview without photoreal claims |
| 4 | StillJob **design spike only** (no AI magic): prove camera/material/scene handoff stays truthful per trust contract |

Stop Phase 1 polish when the scorecard passes — then either ship or start the StillJob spike, not both endlessly.
