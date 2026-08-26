import { describe, expect, it } from "vitest";
import { createLivingRoomStarterProject } from "../livingRoom/preset";
import { roomPlanViewBounds } from "./roomPlanBounds";

describe("room plan view bounds", () => {
  it("matches the starter room wall envelope", () => {
    const project = createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" });
    const room = project.rooms[0]!;
    expect(roomPlanViewBounds(project, room.id)).toMatchObject({
      minX: -project.rooms[0]!.dimensions.widthMm / 2,
      maxX: project.rooms[0]!.dimensions.widthMm / 2,
      minZ: -project.rooms[0]!.dimensions.depthMm / 2,
      maxZ: project.rooms[0]!.dimensions.depthMm / 2,
      centerX: 0,
      centerZ: 0,
    });
  });
});
