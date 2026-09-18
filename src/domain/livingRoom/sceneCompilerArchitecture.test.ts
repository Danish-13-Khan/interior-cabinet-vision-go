import { describe, expect, it } from "vitest";
import { pointInPolygon, roomPlanPolygon, type WallEntity } from "../interiorProject";
import { compileLivingRoomScene, createLivingRoomStarterProject } from ".";

const NOW = "2026-08-11T20:00:00.000Z";

function distanceToWall(point: { x: number; z: number }, wall: WallEntity) {
  const dx = wall.end.x - wall.start.x;
  const dz = wall.end.z - wall.start.z;
  const length = Math.hypot(dx, dz) || 1;
  return Math.abs((point.x - wall.start.x) * dz - (point.z - wall.start.z) * dx) / length;
}

describe("living-room architecture compiler", () => {
  it("does not compile a wall taller than its host when a sill is above the wall", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const source = project.openings.find((opening) => opening.kind === "window")!;
    const wall = project.walls.find((item) => item.id === source.wallId)!;
    const scene = compileLivingRoomScene({
      ...project,
      openings: project.openings.map((opening) => opening.id === source.id
        ? { ...opening, sillHeightMm: wall.heightMm + 1200 }
        : opening),
    });
    const below = scene.nodes.find((node) => node.id === `${wall.id}:below:${source.id}`);
    const panel = below?.primitives[0];
    expect(panel?.kind).toBe("box");
    if (panel?.kind !== "box") return;
    expect(panel.sizeMm.height).toBeLessThanOrEqual(wall.heightMm);
    const leaf = scene.nodes.find((node) => node.metadata.openingId === source.id)?.primitives[0];
    expect(leaf && "positionMm" in leaf ? leaf.positionMm.y : 0).toBeLessThan(wall.heightMm);
  });

  it("breaks skirting at doorways and offsets it onto the interior face", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const scene = compileLivingRoomScene(project);
    const door = project.openings.find((opening) => opening.kind === "door")!;
    const doorWall = project.walls.find((wall) => wall.id === door.wallId)!;
    const skirting = scene.nodes.find((node) => node.metadata.surface === "skirting");
    const doorStrips = (skirting?.primitives ?? []).filter((part) => part.id.startsWith(`skirting:${doorWall.id}:`));
    expect(doorStrips).toHaveLength(2);
    const covered = doorStrips.reduce((sum, part) => sum + (part.kind === "box" ? part.sizeMm.width : 0), 0);
    const wallLength = Math.hypot(doorWall.end.x - doorWall.start.x, doorWall.end.z - doorWall.start.z);
    expect(covered).toBeLessThan(wallLength - door.widthMm + 40);
    const polygon = roomPlanPolygon(project, project.activeRoomId);
    expect(polygon).toBeTruthy();
    for (const part of skirting?.primitives ?? []) {
      const wall = project.walls.find((item) => part.id.startsWith(`skirting:${item.id}:`));
      expect(wall).toBeTruthy();
      expect(pointInPolygon(part.positionMm, polygon!.outer)).toBe(true);
      expect(distanceToWall(part.positionMm, wall!)).toBeCloseTo(wall!.thicknessMm / 2 + 9, 0);
    }
  });
});
