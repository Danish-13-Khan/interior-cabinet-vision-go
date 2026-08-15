import { describe, expect, it } from "vitest";
import { shadowMapSizePair } from "./shadowMapSizePair";

describe("shadowMapSizePair", () => {
  it("returns the same array instance for the same size", () => {
    expect(shadowMapSizePair(512)).toBe(shadowMapSizePair(512));
    expect(shadowMapSizePair(1024)).not.toBe(shadowMapSizePair(512));
  });
});
