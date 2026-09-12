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

1. **Rates** (board / finish / edge / hardware ₹): when a book is supplied, costing looks up the book first, then the catalog. Book rates apply on an **exact** thickness match only — a 9 mm or 12 mm book row never prices a 6 mm back.
   - **Known gap (pre-existing, not introduced by Phase A):** the *catalog* fallback still picks the nearest stocked thickness, and the catalog only carries 12/16/18/25. Default 6 mm backs therefore fall back to catalog 12 mm ₹/m². Adding 6 mm and 9 mm catalog rows is tracked in `docs/SAAS_REVIEW_FOLLOWUPS.md`; until then the customer's own rates are never misapplied, but the catalog default for backs is high.
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
| **D** | Shipped — shared org book + seat overrides; see `docs/SAAS_D_NOTES.md` |
| Catalog | Promote TODO slots into `BoardMaterialId` / `FinishId` when pickers can take them |
| Geometry | Apply 16/18/9 shop thickness as construction defaults |

## How to run tests

```bash
npm test -- src/domain/priceBook src/domain/saas/entitlements.test.ts
# full unit suite:
npm test
```
