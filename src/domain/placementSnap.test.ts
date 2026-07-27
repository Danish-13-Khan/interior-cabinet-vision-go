import { describe, expect, it } from "vitest";
import { getDefaultCabinetConfig, type CabinetInstance } from "./cabinetDimensions";
import { collectPlanDimensionChain, snapPlanPlacement } from "./placementSnap";

function makeCabinet(
  id: string,
  x: number,
  z: number,
  width = 900,
): CabinetInstance {
  const config = getDefaultCabinetConfig("base");
  return {
    id,
    name: id,
    placement: { x, y: 0, z, rotation: 0, attachment: "floor" },
    config: {
      ...config,
      dimensions: { ...config.dimensions, width },
    },
  };
}

describe("placement snap", () => {
  it("snaps cabinet centers toward neighboring edges", () => {
    const moving = makeCabinet("a", 0, 0);
    const neighbor = makeCabinet("b", 950, 0);
    const result = snapPlanPlacement({
      cabinet: moving,
      others: [neighbor],
      proposed: {
        x: 40,
        y: 0,
        z: 12,
        rotation: 0,
        attachment: "floor",
      },
      roomWidthMm: 6000,
      roomDepthMm: 4000,
      gridSizeMm: 50,
    });

    expect(result.placement.x % 50).toBe(0);
    expect(result.placement.z % 50).toBe(0);
    expect(result.guides.length).toBeGreaterThan(0);
  });

  it("builds a plan dimension chain across cabinet edges", () => {
    const chain = collectPlanDimensionChain(
      [makeCabinet("a", -900, 0), makeCabinet("b", 900, 0)],
      6000,
    );

    expect(chain.positions[0]).toBe(-3000);
    expect(chain.positions[chain.positions.length - 1]).toBe(3000);
    expect(chain.labels.length).toBe(chain.positions.length - 1);
  });
});
