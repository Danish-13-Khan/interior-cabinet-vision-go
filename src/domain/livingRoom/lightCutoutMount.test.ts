import { describe, expect, it } from "vitest";
import {
  addCeilingCutout, loadInteriorProjectFile, moveCeilingCutout, polygonBounds,
  readCeilingCutouts, resizeRoomPlanGeometry, roomPlanPolygon, serializeInteriorProjectFile,
} from "../interiorProject";
import { attachLightToCutout, readLightMount, resolveLightAttachment } from "./lightAttachments";
import {
  cutoutSizeForLight, deleteCeilingCutoutAndDetach, fitCeilingCutoutToLight, flushCeilingDropMm, lightsInCutout,
  moveCeilingCutoutWithLights, resizeCeilingCutoutWithLights, whyCutoutFitRefused,
} from "./lightCutoutMount";
import { relocateLight } from "./lightRelocate";
import { createLivingRoomStarterProject } from "./preset";
import { addRoomLightFixture } from "./roomLightFixtures";

const NOW = "2026-10-09T09:00:00.000Z";

function roomWithCutout(widthMm = 400, offsetX = 0) {
  const project = createLivingRoomStarterProject({ now: NOW });
  const bounds = polygonBounds(roomPlanPolygon(project, project.activeRoomId)!.outer);
  const cx = (bounds.minX + bounds.maxX) / 2 + offsetX;
  const cz = (bounds.minZ + bounds.maxZ) / 2;
  const half = widthMm / 2;
  const next = addCeilingCutout(project, [
    { x: cx - half, z: cz - half }, { x: cx + half, z: cz - half }, { x: cx + half, z: cz + half }, { x: cx - half, z: cz + half },
  ]);
  return { project: next, cutoutId: "cutout-1", cx, cz, bounds };
}

function resolved(project: ReturnType<typeof roomWithCutout>["project"], id: string) {
  return resolveLightAttachment(project, project.lights.find((light) => light.id === id)!);
}

describe("fixtures in ceiling cutouts", () => {
  it("centres a COB in the cutout, flush with the slab, and keeps it there when the cutout moves", () => {
    const { project, cutoutId, cx, cz } = roomWithCutout();
    const added = addRoomLightFixture(project, "cob", { kind: "cutout", cutoutId });
    const light = added.lights.at(-1)!;
    expect(readLightMount(light)).toEqual({ kind: "ceiling", ceilingDropMm: 0, hostCutoutId: cutoutId });
    const room = added.rooms.find((item) => item.id === added.activeRoomId)!;
    expect(resolved(added, light.id).position).toEqual({ x: cx, y: room.dimensions.heightMm, z: cz });
    expect(lightsInCutout(added, cutoutId).map((item) => item.id)).toEqual([light.id]);
    const moved = moveCeilingCutout(added, room.id, cutoutId, { x: 500, z: -250 });
    expect(moved.lights.find((item) => item.id === light.id)).toEqual(light);
    expect(resolved(moved, light.id).position).toMatchObject({ x: cx + 500, z: cz - 250 });
  });

  it("drops a panel half into the hole and sizes the cutout to the fixture plus clearance", () => {
    const { project, cutoutId } = roomWithCutout(900);
    const added = addRoomLightFixture(project, "panel", { kind: "cutout", cutoutId });
    const light = added.lights.at(-1)!;
    const room = added.rooms.find((item) => item.id === added.activeRoomId)!;
    expect(flushCeilingDropMm(light)).toBe(15);
    expect(resolved(added, light.id).position.y).toBe(room.dimensions.heightMm - 15);
    expect(cutoutSizeForLight(light)).toEqual({ widthMm: 610, depthMm: 610 });
    const fitted = fitCeilingCutoutToLight(added, cutoutId, light.id);
    const bounds = polygonBounds(readCeilingCutouts(fitted.rooms[0])[0]!.polygon);
    expect(bounds).toMatchObject({ widthMm: 610, depthMm: 610 });
    const cob = addRoomLightFixture(fitted, "cob", { kind: "free" }).lights.at(-1)!;
    expect(cutoutSizeForLight(cob)).toEqual({ widthMm: 100, depthMm: 100 });
  });

  it("refuses a fit that would push the cutout through the wall, and says so", () => {
    const { bounds } = roomWithCutout(200, 0);
    const edge = roomWithCutout(200, (bounds.maxX - bounds.minX) / 2 - 150);
    const added = addRoomLightFixture(edge.project, "panel", { kind: "cutout", cutoutId: edge.cutoutId });
    const lightId = added.lights.at(-1)!.id;
    expect(fitCeilingCutoutToLight(added, edge.cutoutId, lightId)).toBe(added);
    expect(whyCutoutFitRefused(added, edge.cutoutId, lightId)).toMatch(/cross the wall/);
  });

  it("deleting a moved cutout leaves its light at the moved centre, detached, and a new cutout inherits nothing", () => {
    const { project, cutoutId, cx, cz } = roomWithCutout();
    const added = addRoomLightFixture(project, "cob", { kind: "cutout", cutoutId });
    const light = added.lights.at(-1)!;
    const roomId = added.activeRoomId;
    const moved = moveCeilingCutoutWithLights(added, roomId, cutoutId, { x: 600, z: 0 });
    const gone = deleteCeilingCutoutAndDetach(moved, roomId, cutoutId);
    const stored = gone.lights.find((item) => item.id === light.id)!;
    expect(stored.parameters.hostCutoutId).toBeUndefined();
    expect(stored.position).toMatchObject({ x: cx + 600, z: cz });
    expect(readLightMount(resolved(gone, light.id))).toEqual({ kind: "ceiling", ceilingDropMm: 0 });
    const redrawn = addCeilingCutout(gone, [
      { x: cx - 100, z: cz - 100 }, { x: cx + 100, z: cz - 100 }, { x: cx + 100, z: cz + 100 }, { x: cx - 100, z: cz + 100 },
    ]);
    const ids = readCeilingCutouts(redrawn.rooms[0]).map((cutout) => cutout.id);
    expect(ids).toEqual(["cutout-2"]);
    expect(lightsInCutout(redrawn, "cutout-2")).toEqual([]);
    expect(resolved(redrawn, light.id).position.x).toBe(cx + 600);
  });

  it("never hands a new cutout an id a light from an older file still carries", () => {
    const { project, cx, cz } = roomWithCutout();
    const room = project.rooms[0]!;
    // Older file: the cutout list is empty but a light still names cutout-3 and the room has no counter.
    const older = {
      ...project,
      rooms: [{ ...room, extensions: { ...room.extensions, ceilingCutouts: [], ceilingCutoutSeq: undefined } }],
      lights: [...project.lights, {
        ...addRoomLightFixture(project, "cob", { kind: "free" }).lights.at(-1)!,
        parameters: { fixtureKind: "cob", hostSurface: "ceiling", ceilingDropMm: 0, hostCutoutId: "cutout-3" },
      }],
    };
    const redrawn = addCeilingCutout(older, [
      { x: cx - 100, z: cz - 100 }, { x: cx + 100, z: cz - 100 }, { x: cx + 100, z: cz + 100 }, { x: cx - 100, z: cz + 100 },
    ]);
    expect(readCeilingCutouts(redrawn.rooms[0]).map((cutout) => cutout.id)).toEqual(["cutout-4"]);
    expect(redrawn.rooms[0]!.extensions?.ceilingCutoutSeq).toBe(4);
  });

  it("stops following a cutout the room has shrunk away from, and leaves the cutout on a 3D drag", () => {
    const { project, cutoutId, cx, cz, bounds } = roomWithCutout(400, 0);
    const nearEdge = roomWithCutout(400, (bounds.maxX - bounds.minX) / 2 - 500);
    const hosted = addRoomLightFixture(nearEdge.project, "cob", { kind: "cutout", cutoutId: nearEdge.cutoutId });
    const hostedLight = hosted.lights.at(-1)!;
    const room = hosted.rooms.find((item) => item.id === hosted.activeRoomId)!;
    // A move carries the stored position, so the fallback after the shrink is the moved centre, not the attach point.
    const nudged = moveCeilingCutoutWithLights(hosted, room.id, nearEdge.cutoutId, { x: 0, z: 200 });
    expect(nudged.lights.find((item) => item.id === hostedLight.id)!.position.z).toBe(hostedLight.position.z + 200);
    const shrunk = resizeRoomPlanGeometry(nudged, room.id, { ...room.dimensions, widthMm: Math.max(2500, room.dimensions.widthMm - 1600) });
    expect(readLightMount(resolved(shrunk, hostedLight.id))).toEqual({ kind: "ceiling", ceilingDropMm: 0 });
    expect(resolved(shrunk, hostedLight.id).position).toMatchObject({ x: hostedLight.position.x, z: hostedLight.position.z + 200 });
    const added = addRoomLightFixture(project, "cob", { kind: "cutout", cutoutId });
    const light = added.lights.at(-1)!;
    const dragged = relocateLight(added, light.id, { x: cx + 900, y: 0, z: cz });
    expect(readLightMount(dragged.lights.find((item) => item.id === light.id)!)).toEqual({ kind: "ceiling", ceilingDropMm: 0 });
    expect(resolved(dragged, light.id).position.x).toBe(cx + 900);
  });

  it("attaches an existing ceiling light to a cutout and round-trips the host through save and reopen", () => {
    const { project, cutoutId, cx } = roomWithCutout();
    const withPanel = addRoomLightFixture(project, "panel", { kind: "ceiling" });
    const light = withPanel.lights.at(-1)!;
    const attached = attachLightToCutout(withPanel, light.id, cutoutId);
    expect(resolved(attached, light.id).position.x).toBe(cx);
    const reopened = loadInteriorProjectFile(serializeInteriorProjectFile(attached)).document;
    const stored = reopened.lights.find((item) => item.id === light.id)!;
    expect(stored.parameters.hostCutoutId).toBe(cutoutId);
    expect(resolved(reopened, light.id).position.x).toBe(cx);
  });

  it("resizes a cutout from one edge and carries its light by the centre shift", () => {
    const { project, cutoutId, cx, cz } = roomWithCutout(400);
    const added = addRoomLightFixture(project, "cob", { kind: "cutout", cutoutId });
    const light = added.lights.at(-1)!;
    const roomId = added.activeRoomId;
    // Drag the right edge out by 400: the left edge stays, the centre moves 200.
    const grown = resizeCeilingCutoutWithLights(added, roomId, cutoutId, { widthMm: 800, depthMm: 400 }, { x: "min" });
    const bounds = polygonBounds(readCeilingCutouts(grown.rooms[0])[0]!.polygon);
    expect(bounds).toMatchObject({ minX: cx - 200, maxX: cx + 600, widthMm: 800, depthMm: 400 });
    expect(grown.lights.find((item) => item.id === light.id)!.position).toMatchObject({ x: cx + 200, z: cz });
    expect(resolved(grown, light.id).position).toMatchObject({ x: cx + 200, z: cz });
    // Below the minimum side the cutout stays 100 wide; through the wall it is refused.
    const tiny = resizeCeilingCutoutWithLights(added, roomId, cutoutId, { widthMm: 10, depthMm: 400 });
    expect(polygonBounds(readCeilingCutouts(tiny.rooms[0])[0]!.polygon).widthMm).toBe(100);
    expect(resizeCeilingCutoutWithLights(added, roomId, cutoutId, { widthMm: 50_000, depthMm: 400 })).toBe(added);
  });
});
