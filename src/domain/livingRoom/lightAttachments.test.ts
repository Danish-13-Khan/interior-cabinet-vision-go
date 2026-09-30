import { describe, expect, it } from "vitest";
import { loadInteriorProjectFile, movePlanNodeWithOpenings, orientWallForRoom, roomPlanViewBounds, selectRoomWalls, serializeInteriorProjectFile } from "../interiorProject";
import { resizeLivingRoom } from "./planCommands";
import { createLivingRoomStarterProject } from "./preset";
import { resolveLightAttachment } from "./lightAttachments";
import { addRoomLightFixture } from "./roomLightFixtures";
import { compileLivingRoomScene } from "./sceneCompiler";

function starter() {
  return createLivingRoomStarterProject({ now: "2026-10-01T00:00:00.000Z" });
}

function sideOf(wall: { start: { x: number; z: number }; end: { x: number; z: number } }, point: { x: number; z: number }) {
  const dx = wall.end.x - wall.start.x;
  const dz = wall.end.z - wall.start.z;
  return dx * (point.z - wall.start.z) - dz * (point.x - wall.start.x);
}

function distanceTo(wall: { start: { x: number; z: number }; end: { x: number; z: number } }, point: { x: number; z: number }) {
  const dx = wall.end.x - wall.start.x;
  const dz = wall.end.z - wall.start.z;
  return Math.abs(sideOf(wall, point)) / Math.hypot(dx, dz);
}

describe("light mounts", () => {
  it("follows a wall when its node moves, without a second light edit", () => {
    const source = starter();
    const corner = source.nodes.find((node) => Math.abs(node.position.x - 3100) < 1 && Math.abs(node.position.z - 2300) < 1)!;
    const wall = source.walls.find((item) => item.startNodeId === corner.id || item.endNodeId === corner.id)!;
    const added = addRoomLightFixture(source, "rope", { kind: "wall", wallId: wall.id });
    const stored = added.lights.at(-1)!;
    const before = resolveLightAttachment(added, stored);
    const moved = movePlanNodeWithOpenings(added, corner.id, { x: 3200, z: 2400 }, { snapSizeMm: 50 });
    const storedAfter = moved.lights.find((light) => light.id === stored.id)!;
    expect(storedAfter).toEqual(stored);
    const after = resolveLightAttachment(moved, storedAfter);
    const oriented = orientWallForRoom(moved, stored.roomId!, selectRoomWalls(moved, stored.roomId!).find((item) => item.id === wall.id)!);
    const centre = roomPlanViewBounds(moved, stored.roomId!);
    const depth = Number(stored.parameters.depthMm);
    expect(after.position).not.toEqual(before.position);
    expect(after.position.y).toBe(stored.parameters.centerHeightMm);
    expect(after.rotation.x).toBe(0);
    expect(distanceTo(oriented, after.position)).toBeCloseTo(oriented.thicknessMm / 2 + depth / 2, 3);
    expect(sideOf(oriented, after.position)).toBeGreaterThan(0);
    expect(sideOf(oriented, { x: centre.centerX, z: centre.centerZ })).toBeGreaterThan(0);
  });

  it("keeps a ceiling panel on the ceiling when the room grows taller", () => {
    const added = addRoomLightFixture(starter(), "panel", { kind: "ceiling" });
    const stored = added.lights.at(-1)!;
    const room = added.rooms.find((item) => item.id === added.activeRoomId)!;
    const drop = Number(stored.parameters.ceilingDropMm);
    expect(resolveLightAttachment(added, stored).position.y).toBe(room.dimensions.heightMm - drop);
    expect(resolveLightAttachment(added, stored).rotation.x).toBe(-90);
    const taller = resizeLivingRoom(added, room.id, { ...room.dimensions, heightMm: room.dimensions.heightMm + 400 });
    const again = taller.lights.find((light) => light.id === stored.id)!;
    expect(again.parameters).toEqual(stored.parameters);
    expect(again.position).toEqual(stored.position);
    const resolved = resolveLightAttachment(taller, again);
    expect(resolved.position.y).toBe(room.dimensions.heightMm + 400 - drop);
    expect(resolved.position.x).toBe(stored.position.x);
    expect(resolved.position.z).toBe(stored.position.z);
  });

  it("round-trips every mount parameter through save and reopen", () => {
    const source = starter();
    const wall = source.walls.find((item) => item.extensions?.wallSide === "back")!;
    const added = addRoomLightFixture(source, "cove", { kind: "wall", wallId: wall.id });
    const light = added.lights.at(-1)!;
    expect(light.parameters.fitHostWidth).toBe(true);
    expect(light.parameters.centerHeightMm).toBe(wall.heightMm - Number(light.parameters.depthMm));
    const reopened = loadInteriorProjectFile(serializeInteriorProjectFile(added)).document;
    expect(reopened.lights.find((item) => item.id === light.id)!.parameters).toEqual(light.parameters);
  });

  it("compiles an old file whose fixtureKind is not a known fixture", () => {
    const project = starter();
    const base = project.lights[0]!;
    const rogue = { ...base, id: "rogue-light", parameters: { ...base.parameters, fixtureKind: "lantern" } };
    const scene = compileLivingRoomScene({ ...project, lights: [...project.lights, rogue] });
    expect(scene.lights.some((light) => light.id === "rogue-light")).toBe(true);
    expect(resolveLightAttachment(project, rogue)).toBe(rogue);
  });
});
