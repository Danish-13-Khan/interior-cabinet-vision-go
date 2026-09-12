# SaaS D — Company controls (shipped vs deferred)

**Branch:** `feat/saas-business-scope`  
**Spec:** `docs/BUSINESS_PRODUCT_SCOPE.md` §§5, 11–12 Phase **D**  
**Depends on:** A0 (`docs/SAAS_A0_NOTES.md`), A (`docs/SAAS_A_NOTES.md`), B (`docs/SAAS_B_NOTES.md`), C (`docs/SAAS_C_NOTES.md`)  
**Date:** 2026-09-13 (IST)

## Reality check

A0 already had Company SKU + `canUseCompanyControls` / `canUsePremiumAudit` / `canUseSharedOrgPriceBook` flags and a seats/roles **schema stub**. Phase A left `readOrgPriceBookStub` deferred. Phase C shipped the payment ledger (current-obligation, count-once) with a basic Professional trail.

Phase D **activates** Company product foundations on that stack: seats/roles helpers, shared project ACL, live org price book, approval stubs, premium audit views, and an owner dashboard over the Phase C ledger. It does **not** add Stripe, a second auth stack, or end-client payment processing.

## Shipped in D

| Item | Location |
| --- | --- |
| Roles Owner · Designer · Engineer · Viewer + permission matrix | `saas/companySchema.ts` (`ROLE_PERMISSIONS`, `roleHasPermission`) |
| Seat helpers (add / role / activate / remove; protect sole owner) | `company/seats.ts` |
| Shared projects + ACL (`view` / `edit` / `manage`) | `company/permissions.ts`, `company/sharedProjects.ts` |
| Shared org price book + optional seat labour/quote overrides | `priceBook/types.ts`, `defaults.ts`, `store.ts` (`readOrgPriceBook`, `persistOrgPriceBook`, `resolveOrgPriceBookForSeat`) |
| Approvals workflow stubs (freeze / quote export / invoice export) | `company/approvals.ts` |
| Premium audit filters + CSV export over payment + freeze (+ approval) streams | `company/premiumAudit.ts` |
| Owner dashboard aggregates (quoted / accepted / invoiced / received / outstanding / overdue) — **current obligation only** | `company/ownerDashboard.ts` |
| Entitlement gates | `company/gate.ts` + `canUseCompanyControls` / `canUsePremiumAudit` / `canUseSharedOrgPriceBook` helpers |
| Local persistence for shared projects + approvals | `company/store.ts` |
| Docs + tests | this file; `company/*.test.ts`; price-book org tests |

### Entitlement gates (Company)

| Capability | Flag |
| --- | --- |
| Seats, shared projects, approvals, owner dashboard | `canUseCompanyControls` |
| Shared org price book | `canUseSharedOrgPriceBook` |
| Richer audit views / CSV export | `canUsePremiumAudit` |

Professional keeps full ledger **retention** and the basic trail; Company sells filters / freeze+approval merge / export.

### Owner dashboard math (locked to §7)

- Sums **only** `listCurrentObligations` (non-superseded current docs).
- `quoted` / `accepted` / `invoiced` = sum of current-doc totals by `threadStatus`.
- `received` / `outstanding` / `overdue` use Phase C helpers (count-once; superseded quotes excluded).

## Deferred

| Phase | Item |
| --- | --- |
| **D UI** | Polished seats admin, shared-project picker, approval inbox, owner dashboard chrome, premium audit browser |
| **D UI** | Wire Present freeze/export buttons through `hasApprovedClearance` when Company policy requires approvals |
| **C UI** | Payment / client history panels (unchanged) |
| **A UI** | Full Price Book editor grid (org + personal) |
| **E–F** | Design UX polish / optional packs |
| Out of scope | Stripe, payment gateway, end-client collection, second auth/billing stack |

## How to test

```bash
npm test -- src/domain/company src/domain/priceBook src/domain/saas/entitlements.test.ts
# full unit suite:
npm test
```

## Out of scope (explicit)

Payment gateway · Stripe · end-client payment processing · inventing a parallel auth/billing stack · GitHub fetch/push/PR from this phase.
