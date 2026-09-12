# SaaS A0 — Account foundations (shipped vs deferred)

**Branch:** `feat/saas-business-scope`  
**Spec:** `docs/BUSINESS_PRODUCT_SCOPE.md` §§5, 11, 12 phase A0  
**Date:** 2026-09-13 (IST)

## Reality check

The MVP is still largely **client-side** with **localStorage** persistence and a lightweight **marketing auth** session (`src/marketing/lib/auth.ts`). There is no hosted account API or billing provider yet (`docs/BACKEND_SAAS_COMMERCIAL_PLATFORM_BOOK.md` remains the future contract).

A0 therefore adds **local plan SKUs + entitlement helpers + billing stubs** that fit that stack, instead of inventing a second auth system or a fake multi-tenant backend.

## Shipped in A0

| Item | Location |
| --- | --- |
| Plan SKUs Designer → Professional → Company | `src/domain/saas/plans.ts` |
| Entitlement helpers (`canSave`, freeze, client/payment/company flags) | `src/domain/saas/entitlements.ts` |
| Local account snapshot (email from marketing session) | `src/domain/saas/accountStore.ts` barrel + `accountTypes` / `accountModel` / `accountPersistence` / `accountSession` / `accountView` |
| OUR SaaS billing stubs only (`startSaaSCheckout`, portal) | `src/domain/saas/billing.ts` |
| Company seats/roles **schema** stubs | `src/domain/saas/companySchema.ts` |
| Basic client **typed stub** (name/contact/project link) | `src/domain/saas/basicClient.ts` |
| React hook: current plan + `canSave` | `src/hooks/useAccountPlan.ts` |
| Marketing login/register/logout keeps account in sync | `src/marketing/lib/auth.ts` |
| Unit tests | `src/domain/saas/*.test.ts` |

### Entitlement matrix (implemented)

| Capability | Designer | Professional | Company |
| --- | --- | --- | --- |
| `canSave` | ✓ | ✓ | ✓ |
| `canFreezeQuotes` | ✓ | ✓ | ✓ |
| `canUseBasicClient` | ✓ | ✓ | ✓ |
| `canUseClientHistory` | — | ✓ | ✓ |
| `canUsePaymentRecords` | — | ✓ | ✓ |
| `canUseOutstandingReports` | — | ✓ | ✓ |
| `canUseCompanyControls` | — | — | ✓ |
| `canUsePremiumAudit` | — | — | ✓ |

Inactive subscription → all capabilities false (data not deleted).

Default new local account: **Designer** + `active` stub subscription (desktop Tauri uses `ensureDesktopLocalAccount`).

## Deferred (later roadmap letters)

| Phase | Deferred from / beyond A0 |
| --- | --- |
| **A** | Price book expansion (labour fields, editable rates UX) |
| **B** | Quote freeze / revisions **UI**, BOQ/PDF polish |
| **C** | Payment ledger UI, outstanding/overdue reports, consolidated client history UX |
| **D** | Company collaboration UX (seats in use, permissions, approvals, owner dashboard) |
| **E–F** | Design UX polish / optional packs — unrelated to A0 |
| Auth/billing ops | Real IdP, email verification, hosted checkout, webhooks, signed entitlement snapshots |
| Marketing copy | Register page still says “Free Starter”; product ladder has no free tier — copy update later |

## Code size rule

Prefer multiple modules so a **single file stays ≤ ~200 lines**. Manager-style orchestrators may exceed. Account store was split accordingly.

## How to run tests

```bash
npm test -- src/domain/saas
# or full unit suite:
npm test
```

## Out of scope (explicit)

End-client payment processing/gateway · inventing a second auth stack · full team UX · pushing/remote PR from this phase.
