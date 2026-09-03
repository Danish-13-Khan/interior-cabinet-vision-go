import { describe, expect, it } from "vitest";
import {
  interiorsPresentAuthoringView,
  interiorsPresentBlocking,
  interiorsPresentCountLabel,
  interiorsPresentHint,
  interiorsPresentNeedsCapture,
  interiorsPresentStep,
  isInteriorsPresentMode,
} from "./interiorsPresentAndSend";

const captureFail = [
  { id: "freeze", detail: "Frozen Rev A", blocking: true, status: "pass" },
  { id: "view-frames", detail: "Capture every selected client view before creating a proposal.", blocking: true, status: "fail" },
];

describe("interiorsPresentAndSend", () => {
  it("treats the existing render planner mode as Present and Send", () => {
    expect(isInteriorsPresentMode("render")).toBe(true);
    expect(isInteriorsPresentMode("design")).toBe(false);
    expect(interiorsPresentHint("freeze")).toContain("freeze this revision");
    expect(interiorsPresentHint("send")).toContain("engineering");
    expect(interiorsPresentAuthoringView("render", "model")).toBe("plan");
    expect(interiorsPresentAuthoringView("design", "model")).toBe("model");
    expect(interiorsPresentAuthoringView("design", "render")).toBe("plan");
  });

  it("advances freeze → capture → proposal → approve → send → done", () => {
    expect(interiorsPresentStep({
      frozen: false, stale: false, needsCapture: true, proposalReleased: false, approved: false, handoffSent: false,
    })).toBe("freeze");
    expect(interiorsPresentStep({
      frozen: true, stale: true, needsCapture: false, proposalReleased: true, approved: false, handoffSent: false,
    })).toBe("freeze");
    expect(interiorsPresentStep({
      frozen: true, stale: false, needsCapture: true, proposalReleased: false, approved: false, handoffSent: false,
    })).toBe("capture");
    expect(interiorsPresentStep({
      frozen: true, stale: false, needsCapture: false, proposalReleased: false, approved: false, handoffSent: false,
    })).toBe("proposal");
    expect(interiorsPresentStep({
      frozen: true, stale: false, needsCapture: false, proposalReleased: true, approved: false, handoffSent: false,
    })).toBe("approve");
    expect(interiorsPresentStep({
      frozen: true, stale: false, needsCapture: false, proposalReleased: true, approved: true, handoffSent: false,
    })).toBe("send");
    expect(interiorsPresentStep({
      frozen: true, stale: false, needsCapture: false, proposalReleased: true, approved: true, handoffSent: true,
    })).toBe("done");
  });

  it("shows only blocking problems for the next action", () => {
    expect(interiorsPresentNeedsCapture(captureFail)).toBe(true);
    expect(interiorsPresentBlocking("freeze", captureFail, [])).toEqual([]);
    expect(interiorsPresentBlocking("capture", captureFail, [])).toEqual([
      "Capture every selected client view before creating a proposal.",
    ]);
    expect(interiorsPresentBlocking("send", [], [
      { id: "approval", detail: "Approve the quoted revision before sending to Engineering.", blocking: true },
    ])).toEqual(["Approve the quoted revision before sending to Engineering."]);
    expect(interiorsPresentBlocking("approve", [], [
      { id: "approval", detail: "Approve the quoted revision before sending to Engineering.", blocking: true },
    ])).toEqual([]);
    expect(interiorsPresentBlocking("send", [], [
      { id: "already-sent", detail: "Rev A was already sent to Engineering.", blocking: true },
    ])).toEqual([]);
    expect(interiorsPresentCountLabel({
      sellTotalLabel: "₹12,000", revision: "A", frozen: true,
    })).toBe("₹12,000 · Frozen Rev A");
  });
});
