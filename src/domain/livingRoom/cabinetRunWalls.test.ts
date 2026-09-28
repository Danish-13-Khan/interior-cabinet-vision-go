import { describe, expect, it } from "vitest";
import { analyseCabinetRunWalls, cabinetWallSide } from "./cabinetRunWalls";
import type { AabbMm } from "./sceneNodeBounds";

const room: AabbMm = { min: { x: -3000, y: 0, z: -2000 }, max: { x: 3000, y: 2800, z: 2000 } };

function box(x0: number, x1: number, z0: number, z1: number): AabbMm {
  return { min: { x: x0, y: 0, z: z0 }, max: { x: x1, y: 900, z: z1 } };
}

describe("cabinetRunWalls", () => {
  it("assigns each cabinet to the wall it backs onto", () => {
    expect(cabinetWallSide(box(-450, 450, -1940, -1360), room)).toBe("back");
    expect(cabinetWallSide(box(2640, 2940, -450, 450), room)).toBe("right");
    expect(cabinetWallSide(box(-2940, -2360, 0, 600), room)).toBe("left");
    expect(cabinetWallSide(box(-450, 450, -300, 300), room)).toBeNull();
  });

  it("uses the nearest wall for a cabinet tucked into a corner", () => {
    expect(cabinetWallSide(box(2280, 2880, -1940, -1360), room)).toBe("back");
  });

  it("weights the inward direction by run length on each wall", () => {
    const walls = analyseCabinetRunWalls(
      [box(-1500, 1500, -1940, -1360), box(2640, 2940, -450, 450)],
      room,
    );
    expect([...walls.sides].sort()).toEqual(["back", "right"]);
    expect(walls.inward!.z).toBeGreaterThan(0.9);
    expect(walls.inward!.x).toBeLessThan(0);
  });

  it("returns no inward direction for free-standing islands", () => {
    const walls = analyseCabinetRunWalls([box(-450, 450, -300, 300)], room);
    expect(walls.sides.size).toBe(0);
    expect(walls.inward).toBeNull();
  });

  it("returns no inward direction when facing runs cancel out", () => {
    const walls = analyseCabinetRunWalls([box(-900, 900, -1940, -1360), box(-900, 900, 1360, 1940)], room);
    expect(walls.inward).toBeNull();
  });
});
