import { describe, expect, it } from "vitest";
import {
  PRESENT_JOURNEY_STEPS,
  presentChromeForStep,
  presentChromeStripsEditTools,
  presentClientViewCaption,
  presentJourneyProgress,
} from "./presentChrome";

describe("presentChrome (Phase E)", () => {
  it("strips edit tools whenever Presenting", () => {
    expect(presentChromeStripsEditTools(true)).toBe(true);
    expect(presentChromeStripsEditTools(false)).toBe(false);
    expect(presentChromeForStep("freeze").editTools).toBe(false);
    expect(presentChromeForStep("freeze").catalogRail).toBe(false);
    expect(presentChromeForStep("freeze").titlebar).toBe(true);
  });

  it("tunes commercial / actions by journey step", () => {
    expect(presentChromeForStep("capture").commercial).toBe(false);
    expect(presentChromeForStep("proposal").commercial).toBe(true);
    expect(presentChromeForStep("done").actions).toBe(false);
  });

  it("reports journey progress against freeze→send→done", () => {
    expect(PRESENT_JOURNEY_STEPS[0]).toBe("freeze");
    expect(PRESENT_JOURNEY_STEPS.at(-1)).toBe("done");
    const progress = presentJourneyProgress("approve");
    expect(progress.label).toBe("Approve");
    expect(progress.index).toBe(3);
    expect(progress.hint).toContain("approval");
  });

  it("builds the client view caption used by Present titlebar", () => {
    expect(presentClientViewCaption({ unit: "mm", step: "send" })).toBe(
      "Client 3D · Units: mm · Send",
    );
  });
});
