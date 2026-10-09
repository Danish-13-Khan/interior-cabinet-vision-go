import { describe, expect, it } from "vitest";
import { createLivingRoomStarterProject } from "../livingRoom";
import {
  addCeilingCutout, ceilingCutoutSizeMm, deleteCeilingCutout, moveCeilingCutout, readCeilingCutouts,
  validateCeilingCutouts,
} from "./ceilingCutouts";
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

  it("refuses a cutout that crosses the wall, overlaps another cutout, or is too small", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const centre = roomCentre(project);
    const first = addCeilingCutout(project, rectangle(centre.x, centre.z, 600, 600));
    expect(addCeilingCutout(first, rectangle(centre.maxX, centre.z, 600, 600))).toBe(first);
    expect(addCeilingCutout(first, rectangle(centre.x + 200, centre.z, 600, 600))).toBe(first);
    expect(addCeilingCutout(first, rectangle(centre.x + 1500, centre.z, 50, 50))).toBe(first);
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
