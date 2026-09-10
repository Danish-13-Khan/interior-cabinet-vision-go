# UI workflow redesign — open follow-ups

After build steps 1–8 on `codex/feat/ui-workflow-redesign`. These are **not**
part of the completed build sequence. Keep them as separate design or product
tracks so shell CSS work does not rebuild from stale concept screenshots.

## Design (blocking for “redesign finished,” not for UI-workflow merge)

1. **2D Room reference** — [2D visual review](mockups/interiors-2d-review/README.md)
   appearance approved **A — Light drafting studio** as default (B optional);
   10 September 2026. Chrome/layout only — do not remove camera/perspective or
   other domain commands. Still open before implementation: complete header,
   area-specific tools/inspector, left library, selection inspectors, full
   layer/export command map, zoom and issue footer. Replace or update
   [workflow-review](mockups/workflow-review/README.md) so Room shows measured
   plan, draw/measure/snap, underlay/PDF, room management, runs, and plan export
   with unnumbered nav and File/Save/Undo/Redo. Until that refinement lands, the
   interactive mock stays **layout-only / quarantine**.
2. **Commercial dialogs** — detailed quotation, freeze, approval, save/recovery,
   and export screens. Step 7 only surfaced existing gates and journey CTAs;
   Present still shows live quote/commercial fields intentionally.
3. **Inspector detail pass** — empty/room/wall/opening/run inspectors to match
   the accepted selection model (concept still shows a cabinet inspector on Room).

## Product / chrome (separate tracks)

4. **Dual chrome** — Interiors five-area shell vs Cabinets engineering ribbon
   (Job / Drawings / Reports). Intentional split per
   [PRODUCT_DECISIONS](PRODUCT_DECISIONS.md). Do not unify density in this PR.
5. **Naming** — Interiors area label **Cabinets** means millwork design inside
   the room workflow. Engineering workbench mode **Cabinets** means CAD
   assembly/reports. Same word, different surfaces; bridge via Send to Engineering.
6. **Report Center discoverability** — parked; do not force into Interiors sales
   canvas.
7. **P0 shortcut remap parity** — Interiors plan hook hardcodes several keys;
   full remapping remains a separate track (see Step 1 shortcuts note).

## Verification leftovers

8. **Step 2 visual spot-check** — CSS state matrix is implemented in code; still
   spot-check Calm/Compact at 1280 / 1440 / ~200% zoom on device before release
   (see [step 2](ui-workflow-step2/README.md)).
9. **Pre-merge smoke** — `ui-workflow-step8-smoke` + `phase-5-present-send`
   (user-run). Full `test:golden` remains the manufacturing pointer suite.
