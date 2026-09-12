# SaaS E — Design UX polish foundations (shipped vs deferred)

**Branch:** `feat/saas-business-scope`  
**Spec:** `docs/BUSINESS_PRODUCT_SCOPE.md` §8 (design scope), §§11–12 Phase **E**  
**Depends on:** A0–D notes; UI workflow redesign (`docs/UI_WORKFLOW_REDESIGN.md`, interiors shared shell)  
**Date:** 2026-09-13 (IST)

## Reality check

Interiors already has a five-area shared shell (`interiorsWorkflowArea`), Present journey helpers (`interiorsPresentAndSend`), Draw Room / Cabinet Run chrome, Light drafting studio CSS (`is-drafting-studio`), and File → Canvas appearance (`light` / `dark-frame`). Phase E **does not** rewrite the app UI or reopen the quarantine 2D Room reference track.

Phase E ships **foundations + light wiring**: chrome visibility matrix, compact plan toolbar catalog, Present client-strip helpers, and domain-owned drafting appearance persistence. Full visual redesign polish remains deferred.

## Shipped in E

| Item | Location |
| --- | --- |
| Drafting appearance domain (light / dark-frame; surface stays light) | `desktopUx/draftingAppearance.ts`; hook `useDraftingAppearance` reads it |
| Shared-shell chrome matrix (tool rail / catalog / Present strip) | `desktopUx/designUxShell.ts` |
| Compact 2D plan toolbar entry catalog + secondary groups | `desktopUx/planToolbar.ts` |
| Present chrome surfaces + journey progress / client caption | `desktopUx/presentChrome.ts` |
| Light wiring | `LivingRoomPlanCatalogRail` (rail gates), `LivingRoomPlanWorkspace` (shell classes), `InteriorsPresentTitlebar` / `InteriorsPresentChrome` |
| Docs + tests | this file; `designUxShell` / `planToolbar` / `presentChrome` / `draftingAppearance` tests |

### Shell rules (locked to existing UX)

- Present / client strip → no tool rail, no catalog, no edit tools; Present titlebar + tray on.
- Review → no tool rail; catalog/review panel + inspector stay.
- Room / Cabinets / Materials → authoring chrome; compact plan toolbar catalog applies.
- Both canvas appearances keep the **plan surface light** (UI redesign A/B).

## Deferred

| Phase | Item |
| --- | --- |
| **E UI** | Full Light drafting studio inspector frames / live issue footer polish beyond current CSS |
| **E UI** | Mount every `PLAN_TOOLBAR_ENTRIES` control in chrome (catalog + gates ready; handlers already exist) |
| **E UI** | Dual-chrome density unify (Interiors vs Cabinets ribbon) — parked per `ui-workflow-FOLLOW_UPS.md` |
| **F** | Optional BOQ packs + engineer / Report Center bridge |
| Out of scope | Rewriting entire UI redesign branch · payment gateway · Stripe |

## How to test

```bash
npm test -- src/domain/desktopUx/designUxShell.test.ts src/domain/desktopUx/planToolbar.test.ts src/domain/desktopUx/presentChrome.test.ts src/domain/desktopUx/draftingAppearance.test.ts
# full unit suite:
npm test
```

## Out of scope (explicit)

Payment gateway · Stripe · rewriting the UI redesign branch · GitHub fetch/push/PR from this phase.
