import { describe, expect, it } from "vitest";
import { getDefaultCabinetConfig, type CabinetInstance } from "./cabinetDimensions";
import { computeAlignmentTargets } from "./cabinetAlignment";

function makeCabinet(
  id: string,
  x: number,
  z: number,
  width = 600,
  depth = 560,
): CabinetInstance {
  const config = getDefaultCabinetConfig("base");
  return {
    id,
    name: id,
    placement: { x, y: 0, z, rotation: 0, attachment: "floor" },
    config: {
      ...config,
      dimensions: { ...config.dimensions, width, depth },
    },
  };
}

describe("cabinet alignment", () => {
  it("aligns cabinets to the left edge", () => {
    const cabinets = [makeCabinet("a", 1000, 0), makeCabinet("b", 2000, 100)];
    const targets = computeAlignmentTargets(cabinets, "align-left");
    expect(targets).toHaveLength(2);
    const left = Math.min(...targets.map((item) => item.x));
    expect(targets.every((item) => Math.abs(item.x - left) < 0.001)).toBe(true);
  });

  it("distributes cabinets along X", () => {
    const cabinets = [
      makeCabinet("a", 0, 0),
      makeCabinet("b", 500, 0),
      makeCabinet("c", 2000, 0),
    ];
    const targets = computeAlignmentTargets(cabinets, "distribute-x");
    const byId = Object.fromEntries(targets.map((item) => [item.id, item.x]));
    expect(byId.a).toBeLessThan(byId.b);
    expect(byId.b).toBeLessThan(byId.c);
  });
});
