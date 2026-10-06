import { describe, expect, it } from "vitest";
import { studioPaneMax, STUDIO_PANE_MAX, STUDIO_PANE_MIN } from "./useStudioPanes";

describe("studio panes", () => {
  it("keeps a canvas strip and caps how wide a pane can grow", () => {
    expect(studioPaneMax(1400, 240)).toBeLessThanOrEqual(STUDIO_PANE_MAX);
    expect(studioPaneMax(1400, 240)).toBe(720);
    expect(studioPaneMax(700, 240)).toBe(180);
    expect(studioPaneMax(400, 240)).toBe(STUDIO_PANE_MIN);
  });
});
