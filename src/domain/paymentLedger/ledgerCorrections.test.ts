import { describe, expect, it } from "vitest";
import { voidPayment, refundPayment, correctPayment } from "./adjustPayments";
import { recordPayment } from "./recordPayment";
import { createInvoiceAndRollForward } from "./rollForward";
import { netReceivedForDocument } from "./fifo";
import { outstandingForProject } from "./outstanding";
import { buildLedgerTrail } from "./trail";
import { AS_OF, proGate, seedQuoteDoc } from "./testFixtures";

describe("payment ledger corrections + roll-forward", () => {
  it("void removes amount from received; refund appends negative entry", () => {
    let { state, documentId } = seedQuoteDoc(100_000);
    const recorded = recordPayment(
      state,
      { documentId, amount: 40_000, actor: "owner", at: AS_OF },
      proGate,
    );
    state = recorded.state;
    state = voidPayment(
      state,
      recorded.payment.id,
      { actor: "owner", reason: "entered twice", at: AS_OF },
      proGate,
    );
    expect(netReceivedForDocument(state.payments, documentId)).toBe(0);
    expect(state.payments.find((p) => p.id === recorded.payment.id)?.status).toBe(
      "voided",
    );

    const again = recordPayment(
      state,
      { documentId, amount: 25_000, actor: "owner", at: AS_OF },
      proGate,
    );
    state = again.state;
    const refunded = refundPayment(
      state,
      {
        linkedPaymentId: again.payment.id,
        amount: 5_000,
        stamp: { actor: "owner", reason: "partial refund", at: AS_OF },
      },
      proGate,
    );
    state = refunded.state;
    expect(netReceivedForDocument(state.payments, documentId)).toBe(20_000);
    expect(refunded.payment.kind).toBe("refund");
    expect(refunded.payment.amount).toBe(-5_000);

    const corrected = correctPayment(
      state,
      {
        linkedPaymentId: again.payment.id,
        adjustment: -2_000,
        stamp: { actor: "owner", reason: "typo fix", at: AS_OF },
      },
      proGate,
    );
    expect(netReceivedForDocument(corrected.state.payments, documentId)).toBe(18_000);
    expect(buildLedgerTrail(corrected.state, { documentId }).length).toBeGreaterThan(2);
  });

  it("quote→invoice rolls payments forward once (count-once)", () => {
    let { state, documentId } = seedQuoteDoc(100_000);
    const paid = recordPayment(
      state,
      { documentId, amount: 20_000, actor: "owner", at: AS_OF },
      proGate,
    );
    state = paid.state;
    const rolled = createInvoiceAndRollForward(state, {
      quoteDocumentId: documentId,
      stamp: { actor: "owner", reason: "accepted → invoiced", at: AS_OF },
    });
    state = rolled.state;
    const quote = state.documents.find((d) => d.id === documentId)!;
    const invoice = rolled.invoice;
    expect(quote.superseded).toBe(true);
    expect(invoice.kind).toBe("invoice");
    expect(netReceivedForDocument(state.payments, documentId)).toBe(0);
    expect(netReceivedForDocument(state.payments, invoice.id)).toBe(20_000);
    const open = outstandingForProject(state, "proj-1", AS_OF);
    expect(open?.documentId).toBe(invoice.id);
    expect(open?.received).toBe(20_000);
    expect(open?.outstanding).toBe(80_000);
    expect(state.payments.filter((p) => p.id === paid.payment.id)).toHaveLength(1);
    expect(state.payments.find((p) => p.id === paid.payment.id)?.documentId).toBe(
      invoice.id,
    );
  });
});
