# SaaS F — Optional packs + engineer depth (shipped vs deferred)

**Branch:** `feat/saas-business-scope`  
**Spec:** `docs/BUSINESS_PRODUCT_SCOPE.md` §8 (optional packs), §10 (engineering), §§11–12 Phase **F**  
**Depends on:** A0–E notes; BOQ (`docs/SAAS_B_NOTES.md`); handoff / Report Center  
**Date:** 2026-09-13 (IST)

## Reality check

Core BOQ already builds from the project report cutlist (`buildBoqFromReport`). Present → Send already commits an engineering handoff and lands in the Cabinets workbench. Report Center already hosts packet / cutlist / costing tabs. Phase F **extends** those paths with typed optional BOQ packs and an Interiors→Report Center bridge — it does not invent a second cost engine or force Report Center into the sales canvas.

## Shipped in F

| Item | Location |
| --- | --- |
| Optional pack kinds: louvers · area finishes · fixtures | `boq/optionalPacks.ts` |
| Starter SKU catalog + default ₹ rates (editable per line) | `OPTIONAL_PACK_SKUS` |
| `buildOptionalBoqLine(s)` / group / sum helpers | `optionalPacks.ts` |
| Merge into BOQ views (`role: other`, `cabinetId: optional`) | `boq/mergeOptional.ts` |
| Post-handoff bridge intents (edit / packet / reports / production) | `engineerBridge/reportCenterBridge.ts` |
| Engineer depth checklist foundations | `buildEngineerDepthChecklist` |
| Light wiring | `App.tsx` (`resolvePostHandoffBridge`), `useEngineeringHandoff.bridgeTarget`, `EngineeringHandoffSection` hint |
| Docs + tests | this file; `optionalPacks.test.ts`; `reportCenterBridge.test.ts` |

### Optional pack rules (locked to §8)

| Kind | Unit | Notes |
| --- | --- | --- |
| Louvers | m² / lm | Millwork-adjacent |
| Area finishes | m² | Paint / wallpaper / flooring |
| Fixtures | each | FF&E supply lines — not plumbing execution |

Rates on the line override catalog defaults. Core millwork cutlist maths unchanged.

### Bridge rules

- Default Present → Send intent remains **`edit` → Cabinets** (same as pre-F).
- Alternate intents open Report Center / Production with a suggested tab.
- Depth checklist consumes caller-provided counts — does not recompute cutlists.

## Deferred

| Phase | Item |
| --- | --- |
| **F UI** | Optional-pack picker / editor in Present or Quote chrome |
| **F UI** | Report Center discoverability inside Interiors sales canvas (still parked per follow-ups) |
| **F UI** | Intent picker on Send (packet vs edit) — domain ready; UI defaults to edit |
| **E UI** | Mount every plan toolbar entry; inspector frame polish |
| Out of scope | Payment gateway · Stripe · rewriting UI redesign branch |

## How to test

```bash
npm test -- src/domain/boq src/domain/engineerBridge
# full unit suite:
npm test
```

## Out of scope (explicit)

Payment gateway · Stripe · end-client collection · forcing Report Center into Interiors sales chrome · GitHub fetch/push/PR from this phase.
