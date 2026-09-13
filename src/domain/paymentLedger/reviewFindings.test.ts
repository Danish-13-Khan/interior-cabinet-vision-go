import { describe, expect, it } from "vitest";
import { companyMoney } from "../company/ids";
import { appendLedgerAudit, AUDIT_MEMORY_SOFT_WARN } from "./audit";
import { clampLedger, clampPayment } from "./clamp";
import { createEmptyLedger } from "./empty";
import { money } from "./ids";
import { persistPaymentLedger, readPaymentLedger } from "./store";
import { recordPayment } from "./recordPayment";
import { setPaymentSchedule } from "./schedule";
import { AS_OF, proGate, seedQuoteDoc } from "./testFixtures";
import type { PaymentLedgerState } from "./types";

describe("review findings: audit retention + clamp invariants", () => {
  it("never truncates audit at 2000 on append or persist", () => {
    expect(AUDIT_MEMORY_SOFT_WARN).toBeGreaterThan(2000);
    let state = createEmptyLedger();
    for (let i = 0; i < 2005; i++) {
      state = appendLedgerAudit(state, {
        at: AS_OF,
        actor: "owner",
        action: "create",
        documentId: "doc-x",
        detail: `e${i}`,
      });
    }
    expect(state.audit).toHaveLength(2005);
    const storage = new Map<string, string>();
    const like = {
      getItem: (k: string) => storage.get(k) ?? null,
      setItem: (k: string, v: string) => {
        storage.set(k, v);
      },
      removeItem: (k: string) => {
        storage.delete(k);
      },
    };
    persistPaymentLedger(state, like);
    const loaded = readPaymentLedger(like);
    expect(loaded.audit.length).toBe(2005);
  });

  it("rejects corrupt allocation sums on clamp (no silent load)", () => {
    const bad = clampPayment({
      id: "pay-1",
      documentId: "doc-1",
      projectId: "proj-1",
      amount: 1000,
      kind: "payment",
      status: "recorded",
      actor: "owner",
      createdAt: AS_OF,
      allocations: [
        { documentId: "doc-1", amount: 600 },
        { documentId: "doc-1", amount: 300 },
      ],
    });
    expect(bad).toBeNull();

    const ledger = clampLedger({
      schemaVersion: 1,
      documents: [],
      schedules: [],
      payments: [
        {
          id: "pay-1",
          documentId: "doc-1",
          projectId: "proj-1",
          amount: 1000,
          kind: "payment",
          status: "recorded",
          actor: "owner",
          createdAt: AS_OF,
          allocations: [{ documentId: "doc-1", amount: 400 }],
        },
      ],
      audit: [],
    } as Partial<PaymentLedgerState>);
    expect(ledger.payments).toHaveLength(0);
  });

  it("aligns companyMoney with payment money (whole rupees)", () => {
    expect(companyMoney(10.4)).toBe(money(10.4));
    expect(companyMoney(10.6)).toBe(money(10.6));
    expect(companyMoney(10.6)).toBe(11);
  });

  it("stores instalment ids on payment audit events", () => {
    let { state, documentId } = seedQuoteDoc(50_000);
    state = setPaymentSchedule(state, {
      documentId,
      instalments: [
        { id: "inst-a", label: "Booking", amount: 20_000, dueDate: "2026-09-12" },
      ],
      stamp: { actor: "owner", at: AS_OF },
    }).state;
    const paid = recordPayment(
      state,
      {
        documentId,
        amount: 5_000,
        actor: "owner",
        at: AS_OF,
        allocations: [{ documentId, instalmentId: "inst-a", amount: 5_000 }],
      },
      proGate,
    );
    expect(paid.state.audit[0]?.instalmentIds).toEqual(["inst-a"]);
  });
});
