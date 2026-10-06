import { afterEach, describe, expect, it } from "vitest";
import { glbLoadsPending, resetGlbLoadTrackerForTests, trackGlbLoad } from "./glbLoadTracker";

afterEach(() => resetGlbLoadTrackerForTests());

describe("glbLoadTracker", () => {
  it("counts loading models until each releases, and a double release counts once", () => {
    const first = trackGlbLoad();
    const second = trackGlbLoad();
    expect(glbLoadsPending()).toBe(2);
    first();
    first();
    expect(glbLoadsPending()).toBe(1);
    second();
    expect(glbLoadsPending()).toBe(0);
  });
});
