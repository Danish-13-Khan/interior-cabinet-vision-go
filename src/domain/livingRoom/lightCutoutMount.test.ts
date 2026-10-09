import { describe, expect, it } from "vitest";
import {
  addCeilingCutout, deleteCeilingCutout, loadInteriorProjectFile, moveCeilingCutout, polygonBounds,
  readCeilingCutouts, roomPlanPolygon, serializeInteriorProjectFile,
} from "../interiorProject";
import { attachLightToCutout, readLightMount, resolveLightAttachment } from "./lightAttachments";
import { cutoutSizeForLight, fitCeilingCutoutToLight, flushCeilingDropMm, lightsInCutout } from "./lightCutoutMount";
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

  it("refuses a fit that would push the cutout through the wall", () => {
    const { project, cutoutId, bounds } = roomWithCutout(200, 0);
    const edge = roomWithCutout(200, (bounds.maxX - bounds.minX) / 2 - 150);
    const added = addRoomLightFixture(edge.project, "panel", { kind: "cutout", cutoutId: edge.cutoutId });
    expect(fitCeilingCutoutToLight(added, edge.cutoutId, added.lights.at(-1)!.id)).toBe(added);
    expect(project.activeRoomId).toBe(edge.project.activeRoomId);
  });

  it("falls back to a plain ceiling mount when the cutout is deleted, and leaves the cutout on a 3D drag", () => {
    const { project, cutoutId, cx, cz } = roomWithCutout();
    const added = addRoomLightFixture(project, "cob", { kind: "cutout", cutoutId });
    const light = added.lights.at(-1)!;
    const gone = deleteCeilingCutout(added, added.activeRoomId, cutoutId);
    const after = resolved(gone, light.id);
    expect(readLightMount(after)).toEqual({ kind: "ceiling", ceilingDropMm: 0 });
    expect(after.position).toMatchObject({ x: cx, z: cz });
    expect(after.enabled).toBe(true);
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
});
