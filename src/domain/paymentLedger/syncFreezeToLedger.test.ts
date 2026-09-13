import { describe, expect, it, vi } from "vitest";
import { createProjectReport } from "../projectReport";
import { freezeCabinetQuoteAndSyncLedger } from "../../hooks/freezeQuoteAndSyncLedger";
import { createInvoiceAndRollForward } from "./rollForward";
import { currentObligationForProject } from "./obligation";
import { outstandingForProject } from "./outstanding";
import { recordPayment } from "./recordPayment";
import { persistPaymentLedger, readPaymentLedger } from "./store";
import { FORBIDDEN_CABINET_LEDGER_FALLBACK } from "./cabinetLedgerProjectId";
import {
  makeCabinetProject,
  memoryStorage,
  testRoom,
} from "./cabinetFreezeTestHelpers";
import {
  INVOICE_SUPERSEDE_REFUSE,
  LEDGER_PERSIST_FAIL,
  registerCommercialDocFromFreeze,
  syncFrozenQuoteToLedger,
} from "./syncFreezeToLedger";
import { AS_OF, proGate, seedQuoteDoc } from "./testFixtures";
import * as documents from "./documents";

describe("syncFreezeToLedger: invoice guard + persist safety", () => {
  it("refuses when current obligation is an invoice; payments stay outstanding", () => {
    const seeded = seedQuoteDoc(100_000);
    const paid = recordPayment(
      seeded.state,
      { documentId: seeded.documentId, amount: 25_000, actor: "owner", at: AS_OF },
      proGate,
    );
    const { state, invoice } = createInvoiceAndRollForward(paid.state, {
      quoteDocumentId: seeded.documentId,
      stamp: { actor: "owner", at: AS_OF },
    });
    expect(outstandingForProject(state, "proj-1", AS_OF)?.received).toBe(25_000);

    const refused = registerCommercialDocFromFreeze(state, {
      projectId: "proj-1",
      snapshot: { id: "snap-new", revision: "B", sellTotal: 95_000 },
      actor: "owner",
      at: AS_OF,
    });
    expect(refused).toMatchObject({
      ok: false,
      code: "invoice_current",
      reason: INVOICE_SUPERSEDE_REFUSE,
    });

    const store = memoryStorage();
    persistPaymentLedger(state, store);
    const sync = syncFrozenQuoteToLedger({
      projectId: "proj-1",
      snapshot: { id: "snap-new", revision: "B", sellTotal: 95_000 },
      actor: "owner",
      at: AS_OF,
      storage: store,
    });
    expect(sync).toMatchObject({ ok: false, code: "invoice_current" });
    const loaded = readPaymentLedger(store);
    expect(currentObligationForProject(loaded, "proj-1")?.id).toBe(invoice.id);
    expect(currentObligationForProject(loaded, "proj-1")?.kind).toBe("invoice");
    expect(outstandingForProject(loaded, "proj-1", AS_OF)?.received).toBe(25_000);
  });

  it("supersedes when current obligation is a frozen_quote", () => {
    const { state, documentId } = seedQuoteDoc(80_000);
    const next = registerCommercialDocFromFreeze(state, {
      projectId: "proj-1",
      snapshot: { id: "snap-2", revision: "B", sellTotal: 85_000 },
      actor: "owner",
      at: AS_OF,
    });
    expect(next.ok).toBe(true);
    if (!next.ok) return;
    expect(next.document.supersedesDocumentId).toBe(documentId);
    expect(next.state.documents.find((d) => d.id === documentId)?.superseded).toBe(true);
    expect(currentObligationForProject(next.state, "proj-1")?.id).toBe(next.document.id);
  });

  it("persist failure returns persist_failed and does not throw", () => {
    const result = syncFrozenQuoteToLedger({
      projectId: "proj-persist",
      snapshot: { id: "snap-p", revision: "A", sellTotal: 10_000 },
      actor: "owner",
      at: AS_OF,
      storage: memoryStorage(true),
    });
    expect(result).toMatchObject({
      ok: false,
      code: "persist_failed",
      reason: LEDGER_PERSIST_FAIL,
    });
  });

  it("logic throws from register are unexpected, not persist_failed", () => {
    const spy = vi.spyOn(documents, "registerFrozenQuoteDocument").mockImplementation(() => {
      throw new Error("supersedeDocumentId must be a current project obligation.");
    });
    const result = syncFrozenQuoteToLedger({
      projectId: "proj-logic",
      snapshot: { id: "snap-l", revision: "A", sellTotal: 10_000 },
      actor: "owner",
      at: AS_OF,
      storage: memoryStorage(),
    });
    spy.mockRestore();
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("unexpected");
    expect(result.reason).not.toBe(LEDGER_PERSIST_FAIL);
    expect(result.reason).toMatch(/unexpected/i);
  });

  it("freezeCabinetQuoteAndSyncLedger registers under stable id (not job number)", () => {
    const project = makeCabinetProject({ projectNumber: "JOB-1" });
    const report = createProjectReport(project, testRoom);
    const store = memoryStorage();
    const wrapped = freezeCabinetQuoteAndSyncLedger({
      project,
      quote: report.quote,
      priceBook: null,
      storage: store,
    });
    expect(wrapped.ledgerStatus).toBeUndefined();
    expect(wrapped.project.quoteHistory[0]?.sellTotal).toBe(report.quote.sellTotal);
    const docs = readPaymentLedger(store).documents;
    expect(docs).toHaveLength(1);
    expect(docs[0]?.kind).toBe("frozen_quote");
    expect(docs[0]?.projectId).toBe(wrapped.projectId);
    expect(docs[0]?.projectId).not.toBe("JOB-1");
    expect(docs[0]?.projectId).not.toBe(FORBIDDEN_CABINET_LEDGER_FALLBACK);
    expect(docs[0]?.quoteSnapshotId).toBe(wrapped.project.quoteHistory[0]?.id);
  });
});
