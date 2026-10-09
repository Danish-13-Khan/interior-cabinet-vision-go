import { describe, expect, it } from "vitest";
import { addCeilingCutout, polygonBounds, resizeRoomPlanGeometry, roomPlanPolygon } from "../interiorProject";
import { compileLivingRoomScene, createLivingRoomStarterProject } from ".";

const NOW = "2026-10-09T09:00:00.000Z";

function ceilingHoles(project: ReturnType<typeof createLivingRoomStarterProject>) {
  const scene = compileLivingRoomScene(project);
  const ceiling = scene.nodes.find((node) => node.id === `room-ceiling:${project.activeRoomId}`);
  const prism = ceiling?.primitives[0];
  if (prism?.kind !== "polygon-prism") throw new Error("ceiling slab is not a polygon prism");
  return prism.holesMm;
}

describe("ceiling cutouts in the compiled scene", () => {
  it("feeds each cutout to the ceiling slab as a hole and leaves the floor whole", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const bounds = polygonBounds(roomPlanPolygon(project, project.activeRoomId)!.outer);
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cz = (bounds.minZ + bounds.maxZ) / 2;
    const before = ceilingHoles(project).length;
    const next = addCeilingCutout(project, [
      { x: cx - 300, z: cz - 300 }, { x: cx + 300, z: cz - 300 }, { x: cx + 300, z: cz + 300 }, { x: cx - 300, z: cz + 300 },
    ]);
    const holes = ceilingHoles(next);
    expect(holes).toHaveLength(before + 1);
    const hole = holes[holes.length - 1]!;
    expect(polygonBounds(hole)).toMatchObject({ widthMm: 600, depthMm: 600 });
    const floor = compileLivingRoomScene(next).nodes.find((node) => node.id === `room-floor:${next.activeRoomId}`);
    const floorPrism = floor?.primitives[0];
    expect(floorPrism?.kind === "polygon-prism" ? floorPrism.holesMm.length : -1).toBe(before);
  });

  it("drops a cutout from the slab once the room shrinks away from it", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const room = project.rooms.find((item) => item.id === project.activeRoomId)!;
    const bounds = polygonBounds(roomPlanPolygon(project, room.id)!.outer);
    const cz = (bounds.minZ + bounds.maxZ) / 2;
    const before = ceilingHoles(project).length;
    const nearEdge = addCeilingCutout(project, [
      { x: bounds.maxX - 800, z: cz - 300 }, { x: bounds.maxX - 200, z: cz - 300 },
      { x: bounds.maxX - 200, z: cz + 300 }, { x: bounds.maxX - 800, z: cz + 300 },
    ]);
    expect(ceilingHoles(nearEdge)).toHaveLength(before + 1);
    const shrunk = resizeRoomPlanGeometry(nearEdge, room.id, {
      ...room.dimensions, widthMm: Math.max(2500, room.dimensions.widthMm - 1600),
    });
    expect(ceilingHoles(shrunk)).toHaveLength(before);
  });
});
