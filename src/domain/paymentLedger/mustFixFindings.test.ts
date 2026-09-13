import { describe, expect, it } from "vitest";
import {
  createGoldenProposalProject,
  readProposalCommercial,
  tryFreezeProposal,
} from "../livingRoom/proposal";
import { entitlementsForPlan } from "../saas/entitlements";
import { reallocatePayment } from "./adjustPayments";
import { markDocumentAccepted, registerFrozenQuoteDocument } from "./documents";
import { applyPaymentsFifo } from "./fifo";
import { createEmptyLedger } from "./empty";
import { recordPayment } from "./recordPayment";
import { registerCommercialDocFromFreeze } from "./syncFreezeToLedger";
import {
  AS_OF,
  NEXT_MONTH,
  YESTERDAY,
  proGate,
  seedQuoteDoc,
  seedQuoteWithSchedule,
} from "./testFixtures";

describe("must-fix: instalment allocation validation", () => {
  it("rejects unknown instalment id at record time", () => {
    const { state, documentId } = seedQuoteWithSchedule();
    expect(() =>
      recordPayment(
        state,
        {
          documentId,
          amount: 5_000,
          actor: "owner",
          at: AS_OF,
          allocations: [{ documentId, instalmentId: "nope", amount: 5_000 }],
        },
        proGate,
      ),
    ).toThrow(/Unknown instalment id/i);
  });

  it("rejects over-cap instalment allocation at record time", () => {
    const { state, documentId } = seedQuoteWithSchedule();
    expect(() =>
      recordPayment(
        state,
        {
          documentId,
          amount: 25_000,
          actor: "owner",
          at: AS_OF,
          allocations: [{ documentId, instalmentId: "i1", amount: 25_000 }],
        },
        proGate,
      ),
    ).toThrow(/exceeds remaining capacity/i);
  });

  it("FIFO returns unabsorbed override to pool (no silent burn)", () => {
    const { balances, unscheduledRemainderPaid } = applyPaymentsFifo({
      instalments: [
        { id: "i1", label: "Booking", amount: 20_000, dueDate: YESTERDAY },
        { id: "i2", label: "Balance", amount: 80_000, dueDate: NEXT_MONTH },
      ],
      received: 50_000,
      asOfIso: AS_OF,
      instalmentPaid: { i1: 50_000 },
    });
    expect(balances.find((b) => b.instalmentId === "i1")?.paid).toBe(20_000);
    expect(balances.find((b) => b.instalmentId === "i2")?.paid).toBe(30_000);
    expect(unscheduledRemainderPaid).toBe(0);
  });
});

describe("must-fix: reallocate same-project only", () => {
  it("allows same-project reallocate and refuses cross-project", () => {
    const first = seedQuoteDoc(100_000, "proj-a");
    const paid = recordPayment(
      first.state,
      { documentId: first.documentId, amount: 10_000, actor: "owner", at: AS_OF },
      proGate,
    );
    const revised = registerFrozenQuoteDocument(paid.state, {
      projectId: "proj-a",
      quoteSnapshotId: "quote-snap-2",
      revisionLabel: "B",
      total: 90_000,
      supersedeDocumentId: first.documentId,
      stamp: { actor: "owner", at: AS_OF },
    });
    // Revive first as non-superseded sibling so reallocate has a same-project target.
    // Prefer authentic second current doc on another snapshot path:
    const sameProjectTarget = revised.document;
    const other = seedQuoteDoc(50_000, "proj-b");
    const state = {
      ...revised.state,
      documents: [
        ...revised.state.documents.map((d) =>
          d.id === first.documentId ? { ...d, superseded: false } : d,
        ),
        ...other.state.documents,
      ],
    };

    const ok = reallocatePayment(
      state,
      {
        paymentId: paid.payment.id,
        toDocumentId: sameProjectTarget.id,
        stamp: { actor: "owner", reason: "move within project", at: AS_OF },
      },
      proGate,
    );
    expect(ok.payments.find((p) => p.id === paid.payment.id)?.documentId).toBe(
      sameProjectTarget.id,
    );
    expect(ok.payments.find((p) => p.id === paid.payment.id)?.projectId).toBe("proj-a");

    expect(() =>
      reallocatePayment(
        state,
        {
          paymentId: paid.payment.id,
          toDocumentId: other.documentId,
          stamp: { actor: "owner", reason: "cross", at: AS_OF },
        },
        proGate,
      ),
    ).toThrow(/across projects/i);
  });
});

describe("must-fix: distinct document audit actions", () => {
  it("registers document_registered and document_accepted", () => {
    const { state, documentId } = seedQuoteDoc(40_000);
    expect(state.audit.some((e) => e.action === "document_registered")).toBe(true);
    expect(
      state.audit.some((e) => e.action === "create" && !e.paymentId),
    ).toBe(false);
    const accepted = markDocumentAccepted(state, documentId, {
      actor: "owner",
      at: AS_OF,
      reason: "client signed",
    });
    expect(accepted.audit.some((e) => e.action === "document_accepted")).toBe(true);
  });
});

describe("must-fix: freeze registers commercial document", () => {
  it("wires freeze snapshot into ledger with supersede", () => {
    const now = "2026-09-13T00:00:00.000Z";
    const project = createGoldenProposalProject(now);
    const frozen = tryFreezeProposal(project, {
      now,
      entitlements: entitlementsForPlan("designer"),
    });
    expect(frozen.ok).toBe(true);
    if (!frozen.ok) return;
    const first = readProposalCommercial(frozen.document).quoteHistory[0]!;
    const registered = registerCommercialDocFromFreeze(createEmptyLedger(), {
      projectId: frozen.document.id,
      snapshot: first,
      actor: "owner",
      at: now,
    });
    expect(registered.ok).toBe(true);
    if (!registered.ok) return;
    expect(registered.document.quoteSnapshotId).toBe(first.id);
    expect(registered.document.total).toBe(first.sellTotal);
    expect(registered.state.audit[0]?.action).toBe("document_registered");

    const refrozen = tryFreezeProposal(frozen.document, {
      now: "2026-09-14T00:00:00.000Z",
      entitlements: entitlementsForPlan("designer"),
      bumpRevisionWhenStale: true,
    });
    expect(refrozen.ok).toBe(true);
    if (!refrozen.ok) return;
    const second = readProposalCommercial(refrozen.document).quoteHistory[0]!;
    const next = registerCommercialDocFromFreeze(registered.state, {
      projectId: refrozen.document.id,
      snapshot: second,
      actor: "owner",
      at: "2026-09-14T00:00:00.000Z",
    });
    expect(next.ok).toBe(true);
    if (!next.ok) return;
    expect(next.document.id).not.toBe(registered.document.id);
    expect(
      next.state.documents.find((d) => d.id === registered.document.id)?.superseded,
    ).toBe(true);
    expect(next.document.supersedesDocumentId).toBe(registered.document.id);
  });
});
