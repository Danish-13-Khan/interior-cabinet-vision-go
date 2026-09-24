import { describe, expect, it } from "vitest";
import { isQuoteStale } from "../livingRoom/proposal/staleQuote";
import { setPaymentSchedule } from "../paymentLedger/schedule";
import { AS_OF, YESTERDAY, seedQuoteDoc } from "../paymentLedger/testFixtures";
import type { ProjectQuote } from "../projectQuote";
import type { QuoteSnapshot } from "../quoteSettings";
import { paymentDashboard } from "./paymentDashboard";
import { filterProjectCards, projectFilterCount, projectLandingStats } from "./projectDashboard";
import { quoteComparisonView, quoteIssuedMatchesCurrent } from "./quoteComparison";

const cards = [
  { name: "Kitchen", kindLabel: "Kitchen run", statusLabel: "In design", statusTone: "design" as const },
  { name: "Wardrobe", kindLabel: "Bedroom", statusLabel: "Quoted", statusTone: "quoted" as const },
  { name: "Office", kindLabel: "Office run", statusLabel: "Approved", statusTone: "approved" as const },
];

describe("studio commercial screens", () => {
  it("filters project cards by search and status", () => {
    expect(filterProjectCards(cards, "bed", "all").map((card) => card.name)).toEqual(["Wardrobe"]);
    expect(filterProjectCards(cards, "", "approved").map((card) => card.name)).toEqual(["Office"]);
    expect(filterProjectCards(cards, "", "engineering")).toEqual([]);
    expect(projectFilterCount(cards, "design")).toBe(1);
    expect(filterProjectCards(cards, "missing", "all")).toEqual([]);
    expect(projectLandingStats([{ statusTone: "design" }, { statusTone: "quoted", sellTotal: 1200 }], 1)).toMatchObject({
      active: 2, awaitingTotal: 1200, awaitingCount: 1, recoveryPoints: 1,
    });
  });

  it("shows the live estimate beside the issued quote and marks a design change stale", () => {
    const issued = { revision: "A", sellTotal: 1000, quotedAt: "2026-09-01T00:00:00.000Z" };
    const current = quoteComparisonView({
      designRevision: "B",
      currency: "INR",
      workshop: 800,
      markupPercent: 18,
      markup: 144,
      taxLabel: "GST",
      taxPercent: 18,
      tax: 170,
      validityDays: 30,
      validUntil: "2026-10-01T00:00:00.000Z",
      currentSell: 1200,
      issued,
      stale: true,
      staleReason: "The live total no longer matches the frozen quote.",
    });
    expect(current.markupPercent).toBe(18);
    expect(current.taxLabel).toBe("GST");
    expect(quoteIssuedMatchesCurrent(current)).toBe(false);
    const frozen = { sellTotal: 1000, cabinetCount: 1, revision: "A", designFingerprint: "old" } as QuoteSnapshot;
    const live = { sellTotal: 1200, cabinetLines: [{}], job: { revision: "A" } } as ProjectQuote;
    expect(isQuoteStale(frozen, "new", live)).toBe(true);
  });

  it("reports outstanding, overdue, and instalments from the payment ledger", () => {
    const seeded = seedQuoteDoc(50_000, "proj-dash");
    const scheduled = setPaymentSchedule(seeded.state, {
      documentId: seeded.documentId,
      instalments: [
        { id: "past", label: "Booking", amount: 20_000, dueDate: YESTERDAY },
        { id: "later", label: "Balance", amount: 30_000, dueDate: "2026-12-01" },
      ],
      stamp: { actor: "owner", at: AS_OF },
    });
    const view = paymentDashboard(scheduled.state, "proj-dash", AS_OF);
    expect(view?.total).toBe(50_000);
    expect(view?.outstanding).toBe(50_000);
    expect(view?.overdue).toBe(20_000);
    expect(view?.instalments.map((item) => item.label)).toEqual(["Booking", "Balance"]);
  });
});
