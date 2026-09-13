import { describe, expect, it } from "vitest";
import { createSeatStub } from "../saas/companySchema";
import { entitlementsForPlan } from "../saas/entitlements";
import { voidPayment, refundPayment, correctPayment } from "./adjustPayments";
import { recordPayment } from "./recordPayment";
import { createInvoiceAndRollForward } from "./rollForward";
import { netReceivedForDocument } from "./fifo";
import {
  assertPaymentCapability,
  assertPaymentMutation,
  gatePaymentRecords,
} from "./gate";
import { AS_OF, designerGate, proGate, seedQuoteDoc } from "./testFixtures";

describe("payment ledger mutations (Phase C)", () => {
  it("counts each payment once and gates Professional+", () => {
    expect(gatePaymentRecords(entitlementsForPlan("designer"))).toBe(false);
    expect(gatePaymentRecords(entitlementsForPlan("professional"))).toBe(true);
    expect(() =>
      assertPaymentCapability(entitlementsForPlan("designer"), "paymentRecords"),
    ).toThrow(/Professional/);

    let { state, documentId } = seedQuoteDoc(100_000);
    const first = recordPayment(
      state,
      { documentId, amount: 30_000, actor: "owner", at: AS_OF },
      proGate,
    );
    state = first.state;
    expect(netReceivedForDocument(state.payments, documentId)).toBe(30_000);
    expect(() =>
      recordPayment(
        state,
        {
          documentId,
          amount: 10_000,
          actor: "owner",
          allocations: [
            { documentId, amount: 5_000 },
            { documentId, amount: 4_000 },
          ],
        },
        proGate,
      ),
    ).toThrow(/count-once|equal/i);
  });

  it("refuses Designer plan mutations and seat lacking write/correct", () => {
    const { state, documentId } = seedQuoteDoc(100_000);
    expect(() =>
      recordPayment(
        state,
        { documentId, amount: 1_000, actor: "owner", at: AS_OF },
        designerGate,
      ),
    ).toThrow(/Professional/);

    const viewer = createSeatStub({ email: "v@x.com", role: "viewer" });
    expect(() =>
      assertPaymentMutation(
        { entitlements: entitlementsForPlan("company"), seat: viewer },
        "write",
      ),
    ).toThrow(/payments:write/);

    const designer = createSeatStub({ email: "d@x.com", role: "designer" });
    expect(() =>
      assertPaymentMutation(
        { entitlements: entitlementsForPlan("company"), seat: designer },
        "correct",
      ),
    ).toThrow(/payments:correct/);
  });

  it("rejects payment against superseded documents", () => {
    let { state, documentId } = seedQuoteDoc(100_000);
    const rolled = createInvoiceAndRollForward(state, {
      quoteDocumentId: documentId,
      stamp: { actor: "owner", reason: "invoice", at: AS_OF },
    });
    state = rolled.state;
    expect(() =>
      recordPayment(
        state,
        { documentId, amount: 1_000, actor: "owner", at: AS_OF },
        proGate,
      ),
    ).toThrow(/superseded/i);
  });

  it("requires non-empty actor on void/refund/correct", () => {
    let { state, documentId } = seedQuoteDoc(100_000);
    const recorded = recordPayment(
      state,
      { documentId, amount: 10_000, actor: "owner", at: AS_OF },
      proGate,
    );
    state = recorded.state;
    expect(() =>
      voidPayment(state, recorded.payment.id, { actor: "  ", reason: "x" }, proGate),
    ).toThrow(/Actor is required/i);
    expect(() =>
      refundPayment(
        state,
        {
          linkedPaymentId: recorded.payment.id,
          amount: 1_000,
          stamp: { actor: "", reason: "x" },
        },
        proGate,
      ),
    ).toThrow(/Actor is required/i);
    expect(() =>
      correctPayment(
        state,
        {
          linkedPaymentId: recorded.payment.id,
          adjustment: -100,
          stamp: { actor: "", reason: "x" },
        },
        proGate,
      ),
    ).toThrow(/Actor is required/i);
  });
});
