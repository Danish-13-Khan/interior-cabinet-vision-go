# SaaS C — Client history + payment records (shipped vs deferred)

**Branch:** `feat/saas-business-scope`  
**Spec:** `docs/BUSINESS_PRODUCT_SCOPE.md` §7 (client & payment records), §§11–12 Phase **C**  
**Depends on:** A0 (`docs/SAAS_A0_NOTES.md`), A (`docs/SAAS_A_NOTES.md`), B (`docs/SAAS_B_NOTES.md`)  
**Date:** 2026-09-13 (IST)

## Reality check

Phase B already freezes quotes (`QuoteSnapshot` history) and exports invoice **templates**. Designer basic client lives in `src/domain/saas/basicClient.ts`. Entitlements already flag `canUsePaymentRecords` / `canUseClientHistory` / `canUseOutstandingReports` on Professional+.

Phase C **extends** that stack with an append-only **payment ledger** and consolidated client history. It does **not** invent a parallel commerce engine or a payment gateway.

## Model (locked to §7)

| Concept | Behaviour |
| --- | --- |
| Commercial document | `frozen_quote` or `invoice` bound to a `QuoteSnapshot.id` |
| Current obligation | Only the non-superseded active quote / invoice for a project enters outstanding |
| Count-once | Each payment has exactly one `documentId`; allocation sum = amount |
| Quote → invoice | `createInvoiceAndRollForward` moves ledger parent pointer once; quote marked superseded |
| Schedule | Optional instalments (amount + due date) on the current document |
| Overdue | Unpaid balances on **past-due** instalments after FIFO by due date; never future lines |
| Refund / void / correct | Append-only (void flags row; refund/correction add linked rows) + actor/reason/timestamp |
| Audit | Full history retained; Professional gets basic chronological trail helpers |

### Spec example

Document ₹100,000 with ₹20,000 due yesterday + ₹80,000 next month:

- Nothing received → overdue **₹20,000**, outstanding **₹100,000**
- ₹20,000 received (FIFO covers past line) → overdue **₹0**, outstanding **₹80,000**

## Shipped in C

| Item | Location |
| --- | --- |
| Ledger types + clamp | `src/domain/paymentLedger/types.ts`, `clamp.ts` |
| Register quote doc / accept | `documents.ts` |
| Current obligation | `obligation.ts` |
| FIFO + outstanding / overdue | `fifo.ts`, `outstanding.ts` |
| Schedules | `schedule.ts` |
| Record / void / refund / correct / reallocate | `recordPayment.ts`, `adjustPayments.ts` |
| Quote→invoice roll-forward | `rollForward.ts` |
| Basic trail | `trail.ts` |
| Entitlement gates | `gate.ts` + `canUsePaymentRecords` helpers on `saas/entitlements.ts` |
| Local persistence | `paymentLedger/store.ts` |
| Consolidated client history | `saas/clientHistory.ts`, `clientHistoryStore.ts` |
| Docs + tests | this file; `paymentLedger/*.test.ts` |

## Deferred

| Phase | Item |
| --- | --- |
| **C UI** | Chrome panels for client history, payment entry, outstanding reports |
| **C** | Wire freeze/accept UI to `registerFrozenQuoteDocument` / roll-forward automatically |
| **D** | Domain shipped — see `docs/SAAS_D_NOTES.md` (UI still deferred) |
| Out of scope | Payment gateway, Stripe, end-client collection, inventing a second cost engine |

## How to test

```bash
npm test -- src/domain/paymentLedger src/domain/saas/entitlements.test.ts
# full unit suite:
npm test
```

## Out of scope (explicit)

Payment gateway · collecting money · Company collaboration UX · GitHub fetch/push/PR from this phase.
