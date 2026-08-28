import { describe, expect, it } from "vitest";
import { drawRoomFromPoints, movePlanNodeWithOpenings } from "../interiorProject";
import { createLivingRoomStarterProject } from "./preset";
import {
  arrangeCabinetRun,
  cabinetRunForObject,
  reflowCabinetRunsForWalls,
  updateCabinetRun,
} from "./wardrobePlacement";

function runPositions(project: ReturnType<typeof arrangeCabinetRun>) {
  return project.objects
    .filter((object) => cabinetRunForObject(object))
    .map((object) => ({ x: object.position.x, z: object.position.z }));
}

describe("I1 freeform cabinet runs", () => {
  it("lays cabinets along an angled wall with a requested gap and alignment", () => {
    const starter = createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" });
    const project = drawRoomFromPoints(starter, { kind: "polygon", points: [
      { x: 0, z: 0 }, { x: 3200, z: 800 }, { x: 2700, z: 3000 }, { x: -500, z: 2200 },
    ] });
    const roomId = project.activeRoomId;
    const wall = project.walls.find((item) => item.roomId === roomId)!;
    const cabinets = project.objects.slice(0, 3).map((object, index) => ({
      ...object, id: `freeform-cabinet-${index}`, roomId, kind: "cabinet" as const,
      dimensions: { widthMm: 600, heightMm: 2200, depthMm: 600 },
    }));
    const source = { ...project, objects: cabinets };
    const arranged = arrangeCabinetRun(source, cabinets.map((cabinet) => cabinet.id), wall.id, {
      gapMm: 120, alignment: "start",
    });
    const run = cabinetRunForObject(arranged.objects[0]!);
    expect(run).toMatchObject({ wallId: wall.id, gapMm: 120, alignment: "start", extendToWall: false });
    expect(arranged.objects.every((object) => cabinetRunForObject(object)?.wallId === wall.id)).toBe(true);
    expect(arranged.objects[0]!.rotation.y).toBe(arranged.objects[1]!.rotation.y);
  });

  it("extends a persisted run across the available freeform wall length", () => {
    const source = createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" });
    const wall = source.walls[0]!;
    const cabinets = source.objects.slice(0, 2).map((object, index) => ({
      ...object, id: `extend-cabinet-${index}`, kind: "cabinet" as const,
      dimensions: { widthMm: 900, heightMm: 2200, depthMm: 600 },
    }));
    const arranged = arrangeCabinetRun({ ...source, objects: cabinets }, cabinets.map((cabinet) => cabinet.id), wall.id);
    const runId = cabinetRunForObject(arranged.objects[0]!)!.runId;
    const extended = updateCabinetRun(arranged, runId, { extendToWall: true });
    expect(cabinetRunForObject(extended.objects[0])?.extendToWall).toBe(true);
    expect(cabinetRunForObject(extended.objects[0])?.gapMm).toBeGreaterThan(0);
  });

  it("reflows run positions when a bound wall endpoint moves", () => {
    const source = createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" });
    const wall = source.walls[0]!;
    const cabinets = source.objects.slice(0, 2).map((object, index) => ({
      ...object, id: `reflow-cabinet-${index}`, kind: "cabinet" as const,
      dimensions: { widthMm: 900, heightMm: 2200, depthMm: 600 },
    }));
    const arranged = arrangeCabinetRun({ ...source, objects: cabinets }, cabinets.map((cabinet) => cabinet.id), wall.id);
    const before = runPositions(arranged);
    const nodeId = wall.startNodeId!;
    const node = arranged.nodes.find((item) => item.id === nodeId)!;
    const moved = movePlanNodeWithOpenings(arranged, nodeId, { x: node.position.x + 250, z: node.position.z });
    const reflowed = reflowCabinetRunsForWalls(moved, [wall.id]);
    expect(runPositions(reflowed)).not.toEqual(before);
    expect(reflowed.objects.every((object) => cabinetRunForObject(object)?.wallId === wall.id)).toBe(true);
  });
});
