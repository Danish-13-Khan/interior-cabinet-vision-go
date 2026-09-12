# SaaS A — Editable Price Book (shipped vs deferred)

**Branch:** `feat/saas-business-scope`  
**Spec:** `docs/BUSINESS_PRODUCT_SCOPE.md` §§6, 11–12 Phase A  
**Depends on:** A0 account foundations (`docs/SAAS_A0_NOTES.md`)  
**Date:** 2026-09-13 (IST)

## Reality check

The commercial engine already lived in `src/domain/costing.ts` + `costingSettings.ts` + `quoteSettings.ts` + `projectQuote.ts`. Board / finish / edge ₹ sit on `materialSystem` catalogs; fittings ₹ sit on `hardwareSystem`. Phase A **does not** invent a second cost engine.

A **personal Price Book** is the customer-owned overlay: they edit rates and labour; the existing workshop → quote pipeline consumes the result.

## Labour model (existing fields)

| Book field | Engine field | Meaning |
| --- | --- | --- |
| `labour.workshopPercent` | `CostingSettings.labourPercent` | % of **(board + waste)** — default **40** (shop band 35–45) |
| `labour.workshopAllowance` | `CostingSettings.labourAllowance` | Flat ₹ on workshop grand total |
| `labour.quoteAllowance` | `QuoteSettings.labourAllowance` | Flat ₹ on the sell-side quote |

Site installation stays in quote exclusions unless they add their own allowance.

## Merge rules

1. **Rates** (board / finish / edge / hardware ₹): when a book is supplied, costing looks up the book first, then the catalog. Extra thickness keys (e.g. 9 mm) apply on **exact** match only so 6 mm backs do not silently retarget.
2. **Workshop + quote numbers:** start from the book; any **project preference that differs from factory defaults** wins (per-job override).
3. `createProjectReport` / room rollups take an optional `priceBook`. Live UI reads the personal book via `useAppDerivedState`.
4. No book argument → identical to pre-A behaviour (unit tests stay green).

## Shipped in A

| Item | Location |
| --- | --- |
| Price book types + Indian shop defaults | `src/domain/priceBook/types.ts`, `defaults.ts` |
| Clamp / overlay | `src/domain/priceBook/clamp.ts` |
| Adapter into costing + quote | `src/domain/priceBook/merge.ts`, `rates.ts` |
| Personal localStorage book | `src/domain/priceBook/store.ts` |
| Rate lookup used by the engine | `src/domain/costingRates.ts` (consumed by `costing.ts`) |
| Report / whole-project wiring | `projectReport/createReport.ts`, `projectRooms/summaries.ts` |
| Entitlements: personal edit on Designer+; org book Company-only | `src/domain/saas/entitlements.ts` |
| Hook | `src/hooks/usePriceBook.ts` |
| Tests | `src/domain/priceBook/*.test.ts`, entitlements |

Shop thickness defaults stored on the book: **16 carcass / 18 shutter / 9 back**. Not applied to cabinet geometry (still 18 / 18 / 6 in `materialSystem`).

Typed **TODO slots** (not `BoardMaterialId` / `FinishId`): blockboard, pine, laminate HG / acrylic / matt / inner carcass.

## Deferred

| Phase | Item |
| --- | --- |
| **A UI** | Full Price Book editor grid (CostingTab still edits the **project** labour overlay) |
| **B** | Shipped — see `docs/SAAS_B_NOTES.md` (UI polish still deferred) |
| **C** | Shipped — see `docs/SAAS_C_NOTES.md` |
| **D** | Company shared org book + overrides (`readOrgPriceBookStub`) |
| Catalog | Promote TODO slots into `BoardMaterialId` / `FinishId` when pickers can take them |
| Geometry | Apply 16/18/9 shop thickness as construction defaults |

## How to run tests

```bash
npm test -- src/domain/priceBook src/domain/saas/entitlements.test.ts
# full unit suite:
npm test
```
