# SaaS B — Quotes: freeze, revisions, BOQ, exports (shipped vs deferred)

**Branch:** `feat/saas-business-scope`  
**Spec:** `docs/BUSINESS_PRODUCT_SCOPE.md` §§6–7 (protect issued quotes, exports), 11–12 Phase **B**  
**Depends on:** A0 (`docs/SAAS_A0_NOTES.md`), A Price Book (`docs/SAAS_A_NOTES.md`)  
**Date:** 2026-09-13 (IST)

## Reality check

Freeze / stale / quote history already lived under `src/domain/livingRoom/proposal/` (`freezeProposal`, `staleQuote`, `commercialState`, `liveQuote`) plus cabinet-shell `quoteHistory` on `CabinetProject`. Phase B **extends** that stack — it does not invent a parallel commercial engine.

Price Book from Phase A now feeds **live estimates on the freeze path** (proposal + report already used the book in UI derived state). Freeze snapshots capture a **rates fingerprint** so rate drift marks the issued quote stale without silently rewriting it.

## Shipped in B

| Item | Location |
| --- | --- |
| Price book on live quote / freeze | `livingRoom/proposal/liveQuote.ts`, `freezeProposal.ts`, `quoteFingerprint.ts` |
| Rates fingerprint on snapshot | `quoteSettings.QuoteSnapshot.ratesFingerprint`, `quoteExport/ratesFingerprint.ts` |
| Stale on design **or** rate drift | `livingRoom/proposal/staleQuote.ts` |
| Basic revisions (bump letter when re-freezing stale) | `freezeProposal` + `quoteExport/cabinetFreeze.ts` (uses `bumpRevisionLabel`) |
| Entitlement gate `canFreezeQuotes` | `quoteExport/freezeGate.ts`; wired in `useProposalWorkflow`, `useReviewWorkflow`, Present UI |
| BOQ views by cabinet / material / thickness / role | `src/domain/boq/*` (carcass vs shutter via part category) |
| Exports: quote CSV (existing), BOQ CSV, Excel XML, JSON | `src/domain/quoteExport/*` |
| Invoice **template** PDF + JSON (branding fields only) | `invoiceDocument.ts`, `invoicePdf.ts`, `branding.ts` / `brandingStore.ts` |
| Docs + tests | this file; `boq.test.ts`, `quoteExport.test.ts`, `phaseBFreeze.test.ts` |

### Freeze behaviour (locked)

1. Freeze appends an immutable `QuoteSnapshot` to history (newest first). Prior issued rows stay as-is.
2. Live design / quote settings / price-book rates that diverge → **stale** until refrozen.
3. Re-freeze while stale → **bump revision** (A→B…) then snapshot; old revision remains in history.
4. No entitlement (`canFreezeQuotes`) → freeze refused; inactive subscription cannot freeze.
5. Invoice export is a **file** derived from a frozen snapshot + their branding (legal name, GSTIN, invoice no.). No payment rails.

## Deferred

| Phase | Item |
| --- | --- |
| **B UI** | Dedicated BOQ browser tab / export buttons in chrome (domain helpers ready) |
| **B UI** | Full invoice branding settings panel (store + clamp ready; Present still freeze-focused) |
| **A UI** | Full Price Book editor grid (unchanged) |
| **C** | Payment ledger / outstanding / overdue / status `accepted → invoiced` UX |
| **D** | Company shared book, approvals, richer audit |
| Packaging | Real `.xlsx` via a spreadsheet library (SpreadsheetML `.xls` XML ships without new deps) |

## How to test

```bash
npm test -- src/domain/boq src/domain/quoteExport src/domain/livingRoom/proposal/phaseBFreeze.test.ts src/domain/livingRoom/proposal/proposalQuote.test.ts
# full unit suite:
npm test
```

Manual: open Present → Freeze quote on an active Designer+ account; change markup or price book → status shows stale; freeze again → revision bumps; prior history total unchanged.

## Out of scope (explicit)

Payment ledger · end-client payment gateway · Stripe · Company collaboration UX · inventing a second cost engine · GitHub fetch/push/PR from this phase.
