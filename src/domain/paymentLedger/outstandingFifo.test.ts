import { describe, expect, it } from "vitest";
import { setPaymentSchedule } from "./schedule";
import { recordPayment } from "./recordPayment";
import {
  computeDocumentBalances,
  outstandingForProject,
  sumOpenBalances,
} from "./outstanding";
import { registerFrozenQuoteDocument } from "./documents";
import { createEmptyLedger } from "./empty";
import { currentObligationForProject } from "./obligation";
import { markDocumentAccepted } from "./documents";
import { AS_OF, NEXT_MONTH, YESTERDAY, proGate, seedQuoteDoc } from "./testFixtures";

describe("current obligation + FIFO overdue (Phase C)", () => {
  it("treats only current obligation as outstanding across projects", () => {
    let { state, documentId } = seedQuoteDoc(100_000, "proj-1");
    const second = registerFrozenQuoteDocument(state, {
      projectId: "proj-1",
      quoteSnapshotId: "quote-snap-2",
      revisionLabel: "B",
      total: 120_000,
      supersedeDocumentId: documentId,
      stamp: { actor: "owner", at: "2026-09-05T10:00:00.000Z" },
    });
    state = second.state;
    const oldBal = computeDocumentBalances(state, documentId, AS_OF);
    const newBal = computeDocumentBalances(state, second.document.id, AS_OF);
    expect(oldBal?.isCurrentObligation).toBe(false);
    expect(oldBal?.outstanding).toBe(0);
    expect(newBal?.isCurrentObligation).toBe(true);
    expect(newBal?.outstanding).toBe(120_000);
    expect(sumOpenBalances(state, AS_OF).outstanding).toBe(120_000);
  });

  it("requires supersede when a current obligation already exists", () => {
    const { state, documentId } = seedQuoteDoc(100_000, "proj-1");
    expect(() =>
      registerFrozenQuoteDocument(state, {
        projectId: "proj-1",
        quoteSnapshotId: "quote-snap-2",
        revisionLabel: "B",
        total: 120_000,
        stamp: { actor: "owner", at: "2026-09-05T10:00:00.000Z" },
      }),
    ).toThrow(/supersed/i);
    expect(documentId).toBeTruthy();
  });

  it("newest active quote beats older accepted (obligation ordering)", () => {
    let { state, documentId } = seedQuoteDoc(100_000, "proj-ord");
    state = markDocumentAccepted(state, documentId, {
      actor: "owner",
      at: "2026-09-02T10:00:00.000Z",
    });
    // Force two non-superseded via clamp-style corruption path: register with supersede
    // then manually revive older for ordering regression check.
    const newer = registerFrozenQuoteDocument(state, {
      projectId: "proj-ord",
      quoteSnapshotId: "quote-snap-b",
      revisionLabel: "B",
      total: 110_000,
      supersedeDocumentId: documentId,
      stamp: { actor: "owner", at: "2026-09-10T10:00:00.000Z" },
    });
    state = {
      ...newer.state,
      documents: newer.state.documents.map((d) =>
        d.id === documentId ? { ...d, superseded: false, threadStatus: "accepted" as const } : d,
      ),
    };
    const current = currentObligationForProject(state, "proj-ord");
    expect(current?.id).toBe(newer.document.id);
    expect(current?.revisionLabel).toBe("B");
  });

  it("FIFO overdue: ₹100k with ₹20k due yesterday → overdue ₹20k if unpaid", () => {
    let { state, documentId } = seedQuoteDoc(100_000);
    const scheduled = setPaymentSchedule(state, {
      documentId,
      instalments: [
        { id: "i1", label: "Booking", amount: 20_000, dueDate: YESTERDAY },
        { id: "i2", label: "Balance", amount: 80_000, dueDate: NEXT_MONTH },
      ],
      stamp: { actor: "owner", at: AS_OF },
    });
    state = scheduled.state;
    const unpaid = outstandingForProject(state, "proj-1", AS_OF);
    expect(unpaid?.outstanding).toBe(100_000);
    expect(unpaid?.overdue).toBe(20_000);

    const paid = recordPayment(
      state,
      { documentId, amount: 20_000, actor: "owner", at: AS_OF },
      proGate,
    );
    const after = outstandingForProject(paid.state, "proj-1", AS_OF);
    expect(after?.outstanding).toBe(80_000);
    expect(after?.overdue).toBe(0);
  });

  it("honours instalment override so overdue respects allocated lines", () => {
    let { state, documentId } = seedQuoteDoc(100_000);
    state = setPaymentSchedule(state, {
      documentId,
      instalments: [
        { id: "i1", label: "Booking", amount: 20_000, dueDate: YESTERDAY },
        { id: "i2", label: "Balance", amount: 80_000, dueDate: NEXT_MONTH },
      ],
      stamp: { actor: "owner", at: AS_OF },
    }).state;
    // User allocates ₹20k to future line i2 — past line stays overdue.
    const paid = recordPayment(
      state,
      {
        documentId,
        amount: 20_000,
        actor: "owner",
        at: AS_OF,
        allocations: [{ documentId, instalmentId: "i2", amount: 20_000 }],
      },
      proGate,
    );
    const bal = outstandingForProject(paid.state, "proj-1", AS_OF);
    expect(bal?.outstanding).toBe(80_000);
    expect(bal?.overdue).toBe(20_000);
    expect(paid.state.audit[0]?.instalmentIds).toEqual(["i2"]);
  });

  it("never treats future instalments as overdue", () => {
    let { state, documentId } = seedQuoteDoc(100_000);
    state = setPaymentSchedule(state, {
      documentId,
      instalments: [
        { id: "i1", label: "Later", amount: 100_000, dueDate: NEXT_MONTH },
      ],
      stamp: { actor: "owner", at: AS_OF },
    }).state;
    const bal = outstandingForProject(state, "proj-1", AS_OF);
    expect(bal?.outstanding).toBe(100_000);
    expect(bal?.overdue).toBe(0);
  });

  it("without schedule uses document dueDate only when past", () => {
    const empty = createEmptyLedger();
    const past = registerFrozenQuoteDocument(empty, {
      projectId: "proj-2",
      quoteSnapshotId: "q",
      revisionLabel: "A",
      total: 50_000,
      dueDate: YESTERDAY,
      stamp: { actor: "owner", at: AS_OF },
    });
    expect(outstandingForProject(past.state, "proj-2", AS_OF)?.overdue).toBe(50_000);

    const future = registerFrozenQuoteDocument(empty, {
      projectId: "proj-3",
      quoteSnapshotId: "q3",
      revisionLabel: "A",
      total: 50_000,
      dueDate: NEXT_MONTH,
      stamp: { actor: "owner", at: AS_OF },
    });
    expect(outstandingForProject(future.state, "proj-3", AS_OF)?.overdue).toBe(0);
  });
});
