import { describe, expect, it } from "vitest";
import type { InteriorObjectEntity } from "../interiorProject";
import { createLivingRoomStarterProject, inspectLivingRoomPlan } from ".";

const NOW = "2026-09-04T13:45:00.000Z";

describe("plan constraint mirror boundary", () => {
  it("flags bathroom mirrors that leave the room or cover a window", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const room = project.rooms[0]!;
    const outsideMirror: InteriorObjectEntity = {
      id: "mirror-out",
      roomId: room.id,
      kind: "furniture",
      category: "bathroom",
      catalogItemId: "kenney:bathroom-mirror",
      name: "Bathroom Mirror",
      position: { x: 10000, y: 1100, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      dimensions: { widthMm: 600, heightMm: 800, depthMm: 50 },
      materialSlots: {},
      parameters: {},
      extensions: { placement: "wall" },
    };
    const issuesOut = inspectLivingRoomPlan({
      ...project,
      objects: [...project.objects, outsideMirror],
    });
    expect(issuesOut.some((issue) => (
      issue.code === "outside-room" && issue.objectIds.includes(outsideMirror.id)
    ))).toBe(true);

    const window = project.openings.find((opening) => opening.kind === "window")!;
    const wall = project.walls.find((item) => item.id === window.wallId)!;
    const overWindow: InteriorObjectEntity = {
      ...outsideMirror,
      id: "mirror-window",
      position: {
        x: (wall.start.x + wall.end.x) / 2,
        y: 1100,
        z: (wall.start.z + wall.end.z) / 2,
      },
    };
    const issuesWindow = inspectLivingRoomPlan({
      ...project,
      objects: [...project.objects, overWindow],
    });
    expect(issuesWindow.some((issue) => (
      issue.code === "opening-clearance" && issue.objectIds.includes(overWindow.id)
    ))).toBe(true);
  });
});
