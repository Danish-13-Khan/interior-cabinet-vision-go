import { describe, expect, it } from "vitest";
import { showcaseCameraFraming, showcaseMoodOffered, showcaseMoodOverride } from "./showcaseTourView";

const authoring = { touring: false, presentation: false };
const touring = { touring: true, presentation: false };
const presenting = { touring: false, presentation: true };
const touringInPresent = { touring: true, presentation: true };

describe("Showcase tour view state", () => {
  it("offers the view-only mood while touring or presenting, never while authoring", () => {
    expect(showcaseMoodOffered(authoring)).toBe(false);
    for (const mode of [touring, presenting, touringInPresent]) expect(showcaseMoodOffered(mode)).toBe(true);
  });

  it("drops the mood override once the tour ends or Present is left", () => {
    expect(showcaseMoodOverride("evening", touring)).toBe("evening");
    expect(showcaseMoodOverride("evening", presenting)).toBe("evening");
    // Tour finished in Present: the client keeps the chosen mood.
    expect(showcaseMoodOverride("evening", { ...touringInPresent, touring: false })).toBe("evening");
    // Left Present (or the tour ended in Model View): the saved mood is back.
    expect(showcaseMoodOverride("evening", authoring)).toBeNull();
    expect(showcaseMoodOverride(null, touring)).toBeNull();
  });

  it("shows showcase cameras as authored while touring, and keeps run framing otherwise", () => {
    expect(showcaseCameraFraming(touring)).toEqual({ composition: "project-camera" });
    expect(showcaseCameraFraming(touringInPresent)).toEqual({ composition: "project-camera" });
    expect(showcaseCameraFraming(presenting)).toEqual({ frameRun: "client" });
    expect(showcaseCameraFraming(authoring)).toEqual({ frameRun: "author" });
  });
});
