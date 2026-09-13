import { describe, expect, it } from "vitest";
import { markDocumentAccepted } from "../paymentLedger/documents";
import { createInvoiceAndRollForward } from "../paymentLedger/rollForward";
import { recordPayment } from "../paymentLedger/recordPayment";
import { AS_OF, proGate, seedQuoteDoc } from "../paymentLedger/testFixtures";
import { buildOwnerDashboard, ownerDashboardForProjects } from "./ownerDashboard";
import {
  buildPremiumAuditReport,
  premiumAuditToCsv,
  type FreezeAuditEvent,
} from "./premiumAudit";

describe("owner dashboard aggregates (Phase D)", () => {
  it("rolls up quoted / accepted / invoiced / received / outstanding on current obligations only", () => {
    let { state, documentId } = seedQuoteDoc(100_000, "proj-a");
    // Second project quoted
    const second = seedQuoteDoc(50_000, "proj-b");
    state = {
      ...state,
      documents: [...state.documents, ...second.state.documents],
      audit: [...state.audit, ...second.state.audit],
    };

    let dash = buildOwnerDashboard(state, AS_OF);
    expect(dash.quoted).toBe(150_000);
    expect(dash.accepted).toBe(0);
    expect(dash.invoiced).toBe(0);
    expect(dash.outstanding).toBe(150_000);
    expect(dash.received).toBe(0);
    expect(dash.projectCount).toBe(2);

    state = markDocumentAccepted(state, documentId, {
      actor: "owner",
      at: "2026-09-10T10:00:00.000Z",
    });
    const paid = recordPayment(
      state,
      {
        documentId,
        amount: 40_000,
        actor: "owner",
        at: "2026-09-11T10:00:00.000Z",
      },
      proGate,
    );
    state = paid.state;

    dash = buildOwnerDashboard(state, AS_OF);
    expect(dash.quoted).toBe(50_000);
    expect(dash.accepted).toBe(100_000);
    expect(dash.received).toBe(40_000);
    expect(dash.outstanding).toBe(110_000); // 60k on accepted + 50k on quoted

    const rolled = createInvoiceAndRollForward(state, {
      quoteDocumentId: documentId,
      stamp: { actor: "owner", at: "2026-09-12T10:00:00.000Z" },
    });
    state = rolled.state;
    dash = buildOwnerDashboard(state, AS_OF);
    expect(dash.invoiced).toBe(100_000);
    expect(dash.accepted).toBe(0);
    expect(dash.received).toBe(40_000);
    // superseded quote must not double outstanding
    expect(dash.outstanding).toBe(110_000);

    const scoped = ownerDashboardForProjects(state, ["proj-a"], AS_OF);
    expect(scoped.projectCount).toBe(1);
    expect(scoped.invoiced).toBe(100_000);
    expect(scoped.quoted).toBe(0);
  });
});

describe("premium audit views (Phase D)", () => {
  it("filters payment + freeze history and exports CSV", () => {
    const { state, documentId } = seedQuoteDoc(100_000, "proj-1");
    const withPay = recordPayment(
      state,
      {
        documentId,
        amount: 10_000,
        actor: "owner",
        at: "2026-09-12T10:00:00.000Z",
      },
      proGate,
    ).state;

    const freezeEvents: FreezeAuditEvent[] = [
      {
        id: "f1",
        at: "2026-09-11T09:00:00.000Z",
        actor: "designer",
        action: "freeze",
        projectId: "proj-1",
        quoteSnapshotId: "quote-snap-1",
        revisionLabel: "A",
        detail: "freeze A",
      },
      {
        id: "f2",
        at: "2026-09-12T11:00:00.000Z",
        actor: "owner",
        action: "export",
        projectId: "proj-1",
        quoteSnapshotId: "quote-snap-1",
        revisionLabel: "A",
        detail: "export PDF",
      },
    ];

    const rows = buildPremiumAuditReport({
      ledger: withPay,
      freezeEvents,
      filter: { kind: "all", projectId: "proj-1", limit: 50 },
    });
    expect(rows.some((r) => r.source === "payment")).toBe(true);
    expect(rows.some((r) => r.source === "freeze" && r.kind === "export")).toBe(true);

    const freezesOnly = buildPremiumAuditReport({
      ledger: withPay,
      freezeEvents,
      filter: { kind: "freeze", projectId: "proj-1" },
    });
    expect(freezesOnly.every((r) => r.source === "freeze")).toBe(true);
    expect(freezesOnly.some((r) => r.kind === "export")).toBe(false);

    const csv = premiumAuditToCsv(rows);
    expect(csv.split("\n")[0]).toContain("at,actor,source");
    expect(csv).toContain("payment");
  });
});
