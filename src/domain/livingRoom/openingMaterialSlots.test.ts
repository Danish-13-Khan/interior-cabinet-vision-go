import { describe, expect, it } from "vitest";
import {
  addLivingRoomOpening,
  createLivingRoomStarterProject,
  createOpeningCatalogInstance,
  LIVING_ROOM_MATERIAL_IDS,
  updateLivingRoomOpening,
} from ".";

describe("opening inspector material slots", () => {
  it("persists a material change from an inspector slot patch", () => {
    const source = createLivingRoomStarterProject({ now: "2026-08-28T00:00:00.000Z" });
    const wall = source.walls.find((candidate) => candidate.visible)!;
    const added = addLivingRoomOpening(source, createOpeningCatalogInstance({
      id: "opening-paint", roomId: source.activeRoomId, wallId: wall.id,
      catalogItemId: "opening:door-single", offsetMm: 400,
    }));
    const painted = updateLivingRoomOpening(added, "opening-paint", {
      materialSlots: { leaf: LIVING_ROOM_MATERIAL_IDS.naturalOak },
    });
    expect(painted.openings.find((item) => item.id === "opening-paint")?.materialSlots).toEqual({
      leaf: LIVING_ROOM_MATERIAL_IDS.naturalOak,
    });
  });
});
