import { describe, expect, it } from "vitest";
import { UniformsLib } from "three";
import { ensureRectAreaLightSupport } from "./rectAreaLightSupport";

describe("rect area light support", () => {
  it("installs LTC textures once, and not merely by being imported", () => {
    expect(UniformsLib.LTC_FLOAT_1).toBeUndefined();
    ensureRectAreaLightSupport();
    expect(UniformsLib.LTC_FLOAT_1).toBeDefined();
    const first = UniformsLib.LTC_FLOAT_1;
    ensureRectAreaLightSupport();
    expect(UniformsLib.LTC_FLOAT_1).toBe(first);
  });
});
