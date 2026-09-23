import { describe, expect, it } from "vitest";
import { moveJourneyFocus, studioHandoffJourney, type JourneyStepId } from "./handoffJourney";

const base = {
  designRevision: "B",
  hasDesign: true,
  quoteRevision: null as string | null,
  quoteFrozen: false,
  quoteStale: false,
  clientAccepted: false,
  engineeringSent: false,
  cutlistCount: 0,
  productionReleased: false,
  paymentReady: false,
  paymentDetail: "Outstanding 32042, overdue 0",
};

function states(patch: Partial<typeof base>) {
  return studioHandoffJourney({ ...base, ...patch }).steps.map((step) => step.state);
}

describe("studio handoff journey", () => {
  it("walks design, quote, approval, engineering, and production without using payment readiness", () => {
    expect(states({})).toEqual(["done", "current", "blocked", "blocked", "blocked"]);
    expect(states({ quoteFrozen: true, quoteRevision: "A" })).toEqual(["done", "done", "current", "blocked", "blocked"]);
    expect(states({ quoteFrozen: true, quoteRevision: "A", quoteStale: true })[1]).toBe("current");
    expect(states({
      quoteFrozen: true, quoteRevision: "A", clientAccepted: true, cutlistCount: 12,
    })).toEqual(["done", "done", "done", "current", "blocked"]);
    expect(states({
      quoteFrozen: true, quoteRevision: "A", clientAccepted: true, engineeringSent: true, cutlistCount: 12,
    })).toEqual(["done", "done", "done", "done", "current"]);
    const released = studioHandoffJourney({
      ...base,
      quoteFrozen: true,
      quoteRevision: "A",
      clientAccepted: true,
      engineeringSent: true,
      cutlistCount: 12,
      productionReleased: true,
      paymentReady: false,
    });
    expect(released.steps.map((step) => step.state)).toEqual(["done", "done", "done", "done", "done"]);
    expect(released.designRevision).toBe("B");
    expect(released.quoteRevision).toBe("A");
    expect(released.paymentReady).toBe(false);
    expect(released.paymentDetail).toContain("32042");
  });

  it("moves focus with arrow keys and keeps an empty design current", () => {
    const ids: JourneyStepId[] = ["design", "quote", "approval", "engineering", "production"];
    expect(moveJourneyFocus(ids, "quote", "ArrowRight")).toBe("approval");
    expect(moveJourneyFocus(ids, "design", "ArrowLeft")).toBe("design");
    const empty = studioHandoffJourney({ ...base, hasDesign: false, designRevision: "A" });
    expect(empty.steps[0]).toMatchObject({ id: "design", state: "current" });
    expect(empty.steps[4]?.state).toBe("blocked");
  });
});
