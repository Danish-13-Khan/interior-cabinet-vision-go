import { describe, expect, it } from "vitest";
import { createLivingRoomStarterProject } from "../livingRoom";
import {
  addCeilingCutout, ceilingCutoutSizeMm, compiledCeilingCutouts, deleteCeilingCutout, moveCeilingCutout,
  readCeilingCutouts, validateCeilingCutouts, whyCeilingCutoutRefused,
} from "./ceilingCutouts";
import { resizeRoomPlanGeometry } from "./roomResize";
import { createEmptyInteriorProject } from "./defaults";
import { drawRoomFromPoints } from "./roomDrawing";
import { polygonBounds, roomPlanPolygon } from "./roomGeometry";
import type { InteriorValidationIssue, Point2Mm } from "./types";

const NOW = "2026-10-09T09:00:00.000Z";

function rectangle(cx: number, cz: number, w: number, d: number): Point2Mm[] {
  return [
    { x: cx - w / 2, z: cz - d / 2 }, { x: cx + w / 2, z: cz - d / 2 },
    { x: cx + w / 2, z: cz + d / 2 }, { x: cx - w / 2, z: cz + d / 2 },
  ];
}

function roomCentre(project: ReturnType<typeof createLivingRoomStarterProject>) {
  const bounds = polygonBounds(roomPlanPolygon(project, project.activeRoomId)!.outer);
  return { x: (bounds.minX + bounds.maxX) / 2, z: (bounds.minZ + bounds.maxZ) / 2, maxX: bounds.maxX };
}

describe("ceiling cutouts", () => {
  it("adds a cutout inside the room and reads it back with a sequential id", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const centre = roomCentre(project);
    const next = addCeilingCutout(project, rectangle(centre.x, centre.z, 600, 600));
    const room = next.rooms.find((item) => item.id === next.activeRoomId)!;
    const cutouts = readCeilingCutouts(room);
    expect(cutouts.map((cutout) => cutout.id)).toEqual(["cutout-1"]);
    expect(ceilingCutoutSizeMm(cutouts[0]!)).toMatchObject({ widthMm: 600, depthMm: 600 });
    const again = addCeilingCutout(next, rectangle(centre.x + 1200, centre.z, 300, 300));
    expect(readCeilingCutouts(again.rooms[0]).map((cutout) => cutout.id)).toEqual(["cutout-1", "cutout-2"]);
  });

  it("refuses a cutout that crosses the wall, overlaps another cutout, or is too small, each with its own reason", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const centre = roomCentre(project);
    const first = addCeilingCutout(project, rectangle(centre.x, centre.z, 600, 600));
    const acrossWall = rectangle(centre.maxX, centre.z, 600, 600);
    const overlapping = rectangle(centre.x + 200, centre.z, 600, 600);
    const tiny = rectangle(centre.x + 1500, centre.z, 50, 50);
    expect(addCeilingCutout(first, acrossWall)).toBe(first);
    expect(addCeilingCutout(first, overlapping)).toBe(first);
    expect(addCeilingCutout(first, tiny)).toBe(first);
    expect(whyCeilingCutoutRefused(first, acrossWall)).toMatch(/inside the room/);
    expect(whyCeilingCutoutRefused(first, overlapping)).toMatch(/overlap another cutout/);
    expect(whyCeilingCutoutRefused(first, tiny)).toMatch(/100 × 100 mm/);
    expect(whyCeilingCutoutRefused(first, rectangle(centre.x - 1500, centre.z, 300, 300))).toBeNull();
  });

  it("refuses cutouts until the room walls are raised to 3D", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const centre = roomCentre(project);
    const lowered = { ...project, walls: project.walls.map((wall) => ({ ...wall, raised: false })) };
    const polygon = rectangle(centre.x, centre.z, 600, 600);
    expect(whyCeilingCutoutRefused(lowered, polygon)).toMatch(/Raise the room walls/);
    expect(addCeilingCutout(lowered, polygon)).toBe(lowered);
  });

  it("refuses an edge that clips the inner corner of an L-shaped room even when every sampled point is inside", () => {
    // L footprint 0–4000 with the notch at x > 1500, z > 1500; the first room is re-centred, so offset by its bounds.
    const blank = createEmptyInteriorProject({ now: NOW });
    const project = drawRoomFromPoints(blank, { kind: "polygon", points: [
      { x: 0, z: 0 }, { x: 4000, z: 0 }, { x: 4000, z: 1500 }, { x: 1500, z: 1500 }, { x: 1500, z: 4000 }, { x: 0, z: 4000 },
    ] }, { raised: true });
    const bounds = polygonBounds(roomPlanPolygon(project, project.activeRoomId)!.outer);
    const at = (x: number, z: number) => ({ x: bounds.minX + x, z: bounds.minZ + z });
    // A(1600,1300) sits in the top band, B(1300,3500) in the left band, C(1100,1300) in both; the A→B edge
    // passes through the notch while its midpoint (1450,2400) is inside, so only the outline test catches it.
    const clipping = [at(1600, 1300), at(1300, 3500), at(1100, 1300)];
    expect(whyCeilingCutoutRefused(project, clipping)).toMatch(/inside the room/);
    expect(whyCeilingCutoutRefused(project, [at(400, 400), at(1200, 400), at(1200, 1200), at(400, 1200)])).toBeNull();
  });

  it("leaves a cutout out of the slab and flags it once the room shrinks away from it", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const centre = roomCentre(project);
    const room = project.rooms.find((item) => item.id === project.activeRoomId)!;
    const nearEdge = addCeilingCutout(project, rectangle(centre.maxX - 500, centre.z, 600, 600));
    expect(compiledCeilingCutouts(nearEdge, nearEdge.rooms[0]!)).toHaveLength(1);
    const shrunk = resizeRoomPlanGeometry(nearEdge, room.id, {
      ...room.dimensions, widthMm: Math.max(2500, room.dimensions.widthMm - 1600),
    });
    expect(readCeilingCutouts(shrunk.rooms[0])).toHaveLength(1);
    expect(compiledCeilingCutouts(shrunk, shrunk.rooms[0]!)).toHaveLength(0);
    const issues: InteriorValidationIssue[] = [];
    validateCeilingCutouts(shrunk, issues);
    expect(issues.map((issue) => issue.code)).toEqual(["ceiling-cutout-outside-room"]);
  });

  it("deletes and moves cutouts, and refuses a move that leaves the room", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const centre = roomCentre(project);
    const roomId = project.activeRoomId;
    const withOne = addCeilingCutout(project, rectangle(centre.x, centre.z, 600, 600));
    const moved = moveCeilingCutout(withOne, roomId, "cutout-1", { x: 300, z: 0 });
    expect(ceilingCutoutSizeMm(readCeilingCutouts(moved.rooms[0])[0]!).centerX).toBe(centre.x + 300);
    expect(moveCeilingCutout(withOne, roomId, "cutout-1", { x: 50_000, z: 0 })).toBe(withOne);
    expect(readCeilingCutouts(deleteCeilingCutout(withOne, roomId, "cutout-1").rooms[0])).toEqual([]);
    expect(deleteCeilingCutout(withOne, roomId, "cutout-9")).toBe(withOne);
  });

  it("ignores malformed stored entries and flags a stored cutout outside the room", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const centre = roomCentre(project);
    const room = project.rooms[0]!;
    const stored = {
      ...project,
      rooms: [{ ...room, extensions: { ...room.extensions, ceilingCutouts: [
        { id: "cutout-1", polygon: rectangle(centre.maxX + 2000, centre.z, 400, 400) },
        { id: 7, polygon: [] },
        "junk",
      ] } }],
    };
    expect(readCeilingCutouts(stored.rooms[0]).map((cutout) => cutout.id)).toEqual(["cutout-1"]);
    const issues: InteriorValidationIssue[] = [];
    validateCeilingCutouts(stored, issues);
    expect(issues.map((issue) => issue.code)).toEqual(["ceiling-cutout-outside-room"]);
  });
});
