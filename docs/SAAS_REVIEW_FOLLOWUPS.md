# SaaS review follow-ups (UI wiring deferred)

**Branch:** `feat/saas-business-scope`  
**Date:** 2026-09-13 (IST)

Domain modules for Phases C–D–F exist, but several product surfaces are still unreachable from chrome. Tracked here so a later pass can wire UI without re-litigating domain.

## Unreachable / thin chrome (do not block domain)

| Area | Domain | UI gap |
| --- | --- | --- |
| Payment entry / schedules / outstanding | `src/domain/paymentLedger/*` | No interiors chrome panel to record payments, set schedules, or show overdue |
| Client history | `src/domain/saas/clientHistory.ts` | No consolidated client history drawer/page |
| Company admin (seats/roles/share) | `src/domain/company/*` | No polished seats/permissions admin |
| Org price book editor | `canUseSharedOrgPriceBook` + company org book helpers | Personal book only in UI |
| Premium audit export | `premiumAudit.ts` / CSV helper | No Company audit browser / export chrome |
| Owner dashboard | `ownerDashboard.ts` | No owner rollup screen |
| Quote freeze → ledger register | `syncFrozenQuoteToLedger` / Present + Report Center freeze | Wired via `freezeQuoteAndSyncLedger` / `freezeCabinetQuoteAndSyncLedger` (still no payments chrome) |

## Freeze → ledger follow-ups (documented, do not block)

1. **Dedupe by `quoteSnapshotId`** — Repeated freeze of the same snapshot should not register a second commercial document (idempotent re-freeze).
2. **Designer vs Professional gating** — Decide whether writing commercial documents into the payment ledger requires Professional (payments capability) or is allowed for Designer freeze alone.
3. **Post-invoice freeze policy** — Once a project is invoiced, later quote freezes are refused permanently for that ledger thread (no change-order path into the ledger yet). Product needs an explicit change-order / credit-note path before reopening freezes after invoice.

## Wider review sweep — remaining items

1. **6 mm / 9 mm catalog rates** — `BOARD_MATERIALS.costPerM2` only carries 12/16/18/25, so default 6 mm backs fall back to the catalog 12 mm rate (pre-existing on `main`). Customer book rates are now exact-match only, so no shop rate is misapplied; adding real 6/9 mm catalog rows is the remaining fix.
2. **Frozen line-level exports** — `QuoteSnapshot` stores totals and summary lines, not per-cabinet or cutlist rows, so an issued BOQ cannot be reconstructed from a freeze. `buildCommercialExportBundle` now labels live sheets as live and flags divergence; capturing line detail on the snapshot is the real fix.
3. **Seat limits** — no numeric seat cap is enforced anywhere; plan packaging for Company seats is still open (scope §15).
4. **Quote history growth** — issued-quote history is now unbounded (spec §6). `QUOTE_HISTORY_SOFT_WARN` exists for a future UX warning; nothing surfaces it yet.

## Out of scope reminders

- Payment gateway / card-UPI collection
- Inventing a second commerce stack
- Full GitHub sync from this pass
