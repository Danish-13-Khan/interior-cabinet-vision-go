import { describe, expect, it } from "vitest";
import { applyContactFromDepth } from "./contactFromDepth";
import { applyUnsharp } from "./unsharp";
import { HERO_STILL_ENGINE } from "../../domain/livingRoom/stillEngine";

describe("hero still engine helpers", () => {
  it("exposes a versioned deterministic engine id", () => {
    expect(HERO_STILL_ENGINE.id).toBe("stilljob-hero");
    expect(HERO_STILL_ENGINE.version).toBe("1.0.0");
  });

  it("darkens a closer pixel sitting above farther depth", () => {
    const plate = new Uint8ClampedArray([
      200, 200, 200, 255,
      200, 200, 200, 255,
    ]);
    const depth = new Uint8ClampedArray([
      40, 40, 40, 255,
      200, 200, 200, 255,
    ]);
    applyContactFromDepth(plate, depth, 1, 2, 0.5);
    expect(plate[0]).toBeLessThan(200);
  });

  it("increases local contrast on a mid pixel", () => {
    const pixels = new Uint8ClampedArray(3 * 3 * 4);
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = 80;
      pixels[i + 1] = 80;
      pixels[i + 2] = 80;
      pixels[i + 3] = 255;
    }
    pixels[1 * 12 + 4] = 180;
    pixels[1 * 12 + 5] = 180;
    pixels[1 * 12 + 6] = 180;
    applyUnsharp(pixels, 3, 3, 0.8);
    expect(pixels[1 * 12 + 4]).toBeGreaterThan(180);
  });
});
