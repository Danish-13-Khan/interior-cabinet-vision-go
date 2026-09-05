import { describe, expect, it } from "vitest";
import { buildRoomShell } from "./buildRoomShell";
import { SAMPLE_RECT_KITCHEN_MM } from "./sampleProposals";

describe("buildRoomShell", () => {
  it("builds floor, walls, and opening markers deterministically", () => {
    const a = buildRoomShell(SAMPLE_RECT_KITCHEN_MM);
    const b = buildRoomShell(SAMPLE_RECT_KITCHEN_MM);
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    if (!a || !b) return;

    expect(a.boxes.filter((x) => x.kind === "floor")).toHaveLength(1);
    expect(a.boxes.filter((x) => x.kind === "wall")).toHaveLength(4);
    expect(a.boxes.filter((x) => x.kind === "opening")).toHaveLength(2);
    expect(a.boxes).toEqual(b.boxes);
    expect(a.cameraPosition).toEqual(b.cameraPosition);

    const floor = a.boxes.find((x) => x.kind === "floor")!;
    expect(floor.size[0]).toBeCloseTo(3.6);
    expect(floor.size[2]).toBeCloseTo(3.0);

    const longWall = a.boxes.find((x) => x.id === "w1")!;
    expect(longWall.size[0]).toBeCloseTo(3.6);
    expect(longWall.size[1]).toBeCloseTo(2.7);
  });

  it("returns null for empty walls", () => {
    expect(
      buildRoomShell({ ...SAMPLE_RECT_KITCHEN_MM, walls: [], rooms: [] }),
    ).toBeNull();
  });
});
