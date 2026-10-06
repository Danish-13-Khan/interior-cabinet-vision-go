import { describe, expect, it } from "vitest";
import {
  CARD_CLIP_DURATION_MS,
  CARD_CLIP_FRAME_COUNT,
  CARD_CLIP_FPS,
  clipCrossfadeWeight,
  clipPathParameter,
} from "./clipTimeline";

const frames = Array.from({ length: CARD_CLIP_FRAME_COUNT }, (_, i) => i);

describe("clipTimeline", () => {
  it("uses 96 frames at 24 fps for 4 s", () => {
    expect(CARD_CLIP_FPS).toBe(24);
    expect(CARD_CLIP_FRAME_COUNT).toBe(96);
    expect(CARD_CLIP_DURATION_MS).toBe(4000);
  });

  it("holds overview and hero for apartment clips", () => {
    expect(clipPathParameter("overview-to-hero", 0)).toBe(0);
    expect(clipPathParameter("overview-to-hero", 11)).toBe(0);
    expect(clipPathParameter("overview-to-hero", 13)).toBeGreaterThan(0);
    expect(clipPathParameter("overview-to-hero", 95)).toBe(1);
    expect(clipPathParameter("overview-to-hero", 83)).toBeLessThan(1);
  });

  it("spreads the apartment glide across the motion frames", () => {
    // Eased once: the middle of the glide is the middle of the path.
    expect(clipPathParameter("overview-to-hero", 48)).toBeCloseTo(0.5, 1);
    expect(clipPathParameter("overview-to-hero", 30)).toBeGreaterThan(0.1);
  });

  it("loops room-arc from the poster pose with no repeated frames", () => {
    const ts = frames.map((i) => clipPathParameter("room-arc", i));
    expect(ts[0]).toBe(0.5);
    expect(ts[24]).toBeCloseTo(1, 10);
    expect(ts[72]).toBeCloseTo(0, 10);
    for (let i = 1; i < ts.length; i += 1) expect(ts[i]).not.toBe(ts[i - 1]);
    expect(ts[95]).not.toBe(ts[0]);
  });

  it("cross-fades only inside the swap window", () => {
    expect(clipCrossfadeWeight(0.2)).toBeNull();
    expect(clipCrossfadeWeight(0.5)).toBeCloseTo(0.5, 5);
    expect(clipCrossfadeWeight(0.8)).toBeNull();
  });
});
