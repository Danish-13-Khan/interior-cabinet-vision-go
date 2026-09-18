import { describe, expect, it } from "vitest";
import { createLivingRoomStarterProject, updateLivingRoomOpening } from ".";

const NOW = "2026-08-11T19:00:00.000Z";

describe("updateLivingRoomOpening", () => {
  it("clamps sill and height to the host wall", () => {
    const source = createLivingRoomStarterProject({ now: NOW });
    const window = source.openings.find((opening) => opening.kind === "window")!;
    const wall = source.walls.find((item) => item.id === window.wallId)!;
    const updated = updateLivingRoomOpening(source, window.id, {
      sillHeightMm: wall.heightMm + 1200,
      heightMm: 1200,
    });
    const opening = updated.openings.find((item) => item.id === window.id)!;
    expect(opening.heightMm).toBe(1200);
    expect(opening.sillHeightMm).toBe(wall.heightMm - 1200);
    expect(opening.sillHeightMm + opening.heightMm).toBe(wall.heightMm);
  });
});
