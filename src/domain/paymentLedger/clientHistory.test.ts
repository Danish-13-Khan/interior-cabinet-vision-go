import { describe, expect, it } from "vitest";
import {
  createClientHistoryRecord,
  linkProjectToClient,
  summarizeClientHistory,
} from "../saas/clientHistory";
import { entitlementsForPlan } from "../saas/entitlements";
import { gateClientHistory } from "./gate";
import { recordPayment } from "./recordPayment";
import { AS_OF, seedQuoteDoc } from "./testFixtures";

describe("consolidated client history (Phase C)", () => {
  it("is gated to Professional+", () => {
    expect(gateClientHistory(entitlementsForPlan("designer"))).toBe(false);
    expect(gateClientHistory(entitlementsForPlan("professional"))).toBe(true);
    expect(gateClientHistory(entitlementsForPlan("company"))).toBe(true);
  });

  it("extends basic client with multi-project summary + balances", () => {
    let client = createClientHistoryRecord({
      id: "client-1",
      contact: { name: "Priya", phone: "999" },
      projectId: "proj-1",
    });
    client = linkProjectToClient(client, "proj-2");
    expect(client.projectIds).toEqual(["proj-1", "proj-2"]);

    let { state, documentId } = seedQuoteDoc(100_000, "proj-1");
    state = recordPayment(state, {
      documentId,
      amount: 10_000,
      actor: "owner",
      clientId: "client-1",
      at: AS_OF,
    }).state;
    const summary = summarizeClientHistory(client, state);
    expect(summary.projectCount).toBe(2);
    expect(summary.paymentCount).toBe(1);
    expect(summary.outstanding).toBe(90_000);
  });
});
