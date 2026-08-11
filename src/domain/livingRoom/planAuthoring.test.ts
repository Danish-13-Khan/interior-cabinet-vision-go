import { describe, expect, it } from "vitest";
import {
  alignLivingRoomObjects,
  createLivingRoomStarterProject,
  deleteLivingRoomObjects,
  duplicateLivingRoomObject,
  getObjectPlanBounds,
  inspectLivingRoomPlan,
  moveLivingRoomObject,
  resizeLivingRoom,
  resizeLivingRoomObject,
  rotateLivingRoomObject,
  snapLivingRoomObject,
} from ".";

const NOW = "2026-08-11T19:00:00.000Z";

describe("living-room plan authoring", () => {
  it("moves, resizes, and angle-snaps objects without mutating the source", () => {
    const source = createLivingRoomStarterProject({ now: NOW });
    const sofa = source.objects.find((object) => object.category === "sofa")!;
    const moved = moveLivingRoomObject(source, sofa.id, { x: 250, y: 0, z: 700 });
    const resized = resizeLivingRoomObject(moved, sofa.id, {
      widthMm: 2400,
      heightMm: 850,
      depthMm: 950,
    });
    const rotated = rotateLivingRoomObject(resized, sofa.id, 92);

    expect(source.objects.find((object) => object.id === sofa.id)!.position.x).toBe(0);
    expect(rotated.objects.find((object) => object.id === sofa.id)).toMatchObject({
      position: { x: 250, y: 0, z: 700 },
      dimensions: { widthMm: 2400, heightMm: 850, depthMm: 950 },
      rotation: { y: 90 },
    });
  });

  it("duplicates, aligns, distributes, and deletes selected objects", () => {
    const source = createLivingRoomStarterProject({ now: NOW });
    const tables = source.objects.filter((object) => object.category === "table");
    const duplicated = duplicateLivingRoomObject(source, tables[0]!.id, "copy-1");
    const ids = [...tables.map((object) => object.id), "copy-1"];
    const aligned = alignLivingRoomObjects(duplicated, ids, "center-z");
    const distributed = alignLivingRoomObjects(aligned, ids, "distribute-x");
    const selected = distributed.objects.filter((object) => ids.includes(object.id));
    const deleted = deleteLivingRoomObjects(distributed, ["copy-1"]);

    expect(selected.every((object) => object.position.z === selected[0]!.position.z)).toBe(true);
    expect(new Set(selected.map((object) => object.position.x)).size).toBe(3);
    expect(deleted.objects.some((object) => object.id === "copy-1")).toBe(false);
  });

  it("snaps to grid, room centerlines, walls, and neighboring objects", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const table = project.objects.find((object) => object.catalogItemId === "living:coffee-table")!;
    const centered = snapLivingRoomObject(
      project,
      table.id,
      { ...table.position, x: 18 },
      50,
    );
    const gridded = snapLivingRoomObject(
      { ...project, objects: [table] },
      table.id,
      { ...table.position, x: 417, z: -617 },
      50,
    );

    expect(centered.position.x).toBe(0);
    expect(centered.guides.some((guide) => guide.kind === "center")).toBe(true);
    expect(Math.abs(gridded.position.x % 50)).toBe(0);
    expect(Math.abs(gridded.position.z % 50)).toBe(0);
  });

  it("reports boundary, collision, opening, and circulation risks", () => {
    const source = createLivingRoomStarterProject({ now: NOW });
    const sofa = source.objects.find((object) => object.category === "sofa")!;
    const chair = source.objects.find((object) => object.category === "chair")!;
    let unsafe = moveLivingRoomObject(source, sofa.id, { x: 2900, y: 0, z: 2100 });
    unsafe = moveLivingRoomObject(unsafe, chair.id, { x: 2900, y: 0, z: 2100 });
    const issues = inspectLivingRoomPlan(unsafe);

    expect(issues.some((issue) => issue.code === "outside-room")).toBe(true);
    expect(issues.some((issue) => issue.code === "overlap")).toBe(true);
    expect(issues.some((issue) => issue.code === "opening-clearance")).toBe(true);
  });

  it("resizes rectangular room geometry while retaining stable wall IDs", () => {
    const source = createLivingRoomStarterProject({ now: NOW });
    const wallIds = source.walls.map((wall) => wall.id);
    const resized = resizeLivingRoom(source, source.activeRoomId, {
      widthMm: 7000,
      heightMm: 3000,
      depthMm: 5000,
    });

    expect(resized.rooms[0]!.dimensions).toEqual({
      widthMm: 7000,
      heightMm: 3000,
      depthMm: 5000,
    });
    expect(resized.walls.map((wall) => wall.id)).toEqual(wallIds);
    expect(Math.max(...resized.walls.flatMap((wall) => [wall.start.x, wall.end.x]))).toBe(3500);
    expect(getObjectPlanBounds(resized.objects[0]!).maxX).toBeGreaterThan(0);
  });
});
