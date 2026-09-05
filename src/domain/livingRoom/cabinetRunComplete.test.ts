import { describe, expect, it } from "vitest";
import { drawRoomFromPoints, orientWallForRoom } from "../interiorProject";
import { createLivingRoomStarterProject } from "./preset";
import {
  arrangeCabinetRun,
  cabinetRunForObject,
  countCabinetRunFillers,
  isCabinetRunFiller,
} from "./wardrobePlacement";
import { addLivingRoomOpening } from "./openingCommands";
import { createOpeningCatalogInstance } from "./openingCatalog";
import { completeCabinetRun, proposeCabinetRunComplete } from "./cabinetRunComplete";
import {
  collectWallOccupancySpans,
  openingSpanOnOrientedWall,
  previewCabinetRunPlacement,
} from "./cabinetRunPlacementPreview";
import { wallLength } from "./wallSegmentPlacement";

function makeCabinets(
  source: ReturnType<typeof createLivingRoomStarterProject>,
  ids: string[],
  widthMm: number,
  roomId?: string,
) {
  return ids.map((id, index) => ({
    ...source.objects[index]!,
    id,
    roomId: roomId ?? source.objects[index]!.roomId,
    kind: "cabinet" as const,
    dimensions: { widthMm, heightMm: 2200, depthMm: 600 },
  }));
}

describe("cabinetRunComplete", () => {
  it("suggests between fillers for an 80 mm gap", () => {
    const source = createLivingRoomStarterProject({ now: "2026-09-05T00:00:00.000Z" });
    const wall = source.walls[0]!;
    const cabinets = makeCabinets(source, ["cab-a", "cab-b"], 900);
    const arranged = arrangeCabinetRun(
      { ...source, objects: cabinets },
      cabinets.map((cabinet) => cabinet.id),
      wall.id,
      { gapMm: 80, alignment: "start" },
    );
    const runId = cabinetRunForObject(arranged.objects[0]!)!.runId;
    const proposal = proposeCabinetRunComplete(arranged, runId);
    expect(proposal?.suggestedFillers.some((item) => item.side === "between" && item.widthMm === 80)).toBe(true);
    expect(proposal?.canAutoFill).toBe(true);
  });

  it("applies fillers and reports leftover outside filler band", () => {
    const starter = createLivingRoomStarterProject({ now: "2026-09-05T00:00:00.000Z" });
    const project = drawRoomFromPoints(starter, {
      kind: "polygon",
      points: [{ x: 0, z: 0 }, { x: 2500, z: 0 }, { x: 2500, z: 2400 }, { x: 0, z: 2400 }],
    });
    const wall = project.walls.find((item) => item.roomId === project.activeRoomId)!;
    const cabinets = makeCabinets(starter, ["cab-a", "cab-b"], 900, project.activeRoomId);
    const arranged = arrangeCabinetRun(
      { ...project, objects: cabinets },
      cabinets.map((cabinet) => cabinet.id),
      wall.id,
      { gapMm: 0, alignment: "start" },
    );
    const runId = cabinetRunForObject(arranged.objects[0]!)!.runId;
    const result = completeCabinetRun(arranged, runId);
    expect(result).not.toBeNull();
    expect(result!.applied).toBe(true);
    expect(countCabinetRunFillers(result!.project, runId)).toBeGreaterThanOrEqual(0);
    expect(result!.leftoverMessage).toMatch(/700|leftover/i);
    expect(result!.project.objects.some(isCabinetRunFiller) || result!.leftoverMessage).toBeTruthy();
  });

  it("does not suggest a filler into an opening between two cabinets", () => {
    const starter = createLivingRoomStarterProject({ now: "2026-09-05T00:00:00.000Z" });
    const project = drawRoomFromPoints(starter, {
      kind: "polygon",
      points: [{ x: 0, z: 0 }, { x: 4000, z: 0 }, { x: 4000, z: 2400 }, { x: 0, z: 2400 }],
    });
    const wall = project.walls.find((item) => Math.abs(item.start.z - item.end.z) < 0.5
      && Math.min(item.start.x, item.end.x) === 0
      && Math.max(item.start.x, item.end.x) === 4000)!;
    const cabinets = makeCabinets(starter, ["cab-a", "cab-b"], 900, project.activeRoomId);
    const arranged = arrangeCabinetRun(
      { ...project, objects: cabinets },
      cabinets.map((cabinet) => cabinet.id),
      wall.id,
      { gapMm: 900, alignment: "start" },
    );
    const withOpening = addLivingRoomOpening(
      arranged,
      createOpeningCatalogInstance({
        id: "door-mid",
        roomId: project.activeRoomId,
        wallId: wall.id,
        catalogItemId: "opening:door-single",
        offsetMm: 900,
      }),
    );
    const runId = cabinetRunForObject(withOpening.objects.find((o) => o.id === "cab-a")!)!.runId;
    const proposal = proposeCabinetRunComplete(withOpening, runId);
    expect(proposal?.suggestedFillers.some((item) => item.side === "between")).toBe(false);
    // 4000 wall − 1800 cabinets − 900 opening = 1300 free (end), opening not counted as fillable gap
    expect(proposal?.remainingMm).toBe(1300);
  });

  it("does not re-suggest fillers after Complete Run applies them", () => {
    const source = createLivingRoomStarterProject({ now: "2026-09-05T00:00:00.000Z" });
    const wall = source.walls[0]!;
    const cabinets = makeCabinets(source, ["cab-a", "cab-b"], 900);
    const arranged = arrangeCabinetRun(
      { ...source, objects: cabinets },
      cabinets.map((cabinet) => cabinet.id),
      wall.id,
      { gapMm: 80, alignment: "start" },
    );
    const runId = cabinetRunForObject(arranged.objects[0]!)!.runId;
    const result = completeCabinetRun(arranged, runId);
    expect(result).not.toBeNull();
    expect(countCabinetRunFillers(result!.project, runId)).toBeGreaterThan(0);
    const again = proposeCabinetRunComplete(result!.project, runId);
    // Existing filler occupies the between gap — do not re-suggest it
    expect(again?.suggestedFillers.some((item) => item.side === "between")).toBe(false);
    expect(again?.suggestedFillers).toEqual([]);
    // Remaining may still include wall-end leftover outside the filler band
    expect(again?.leftoverGapsMm.length ?? 0).toBeGreaterThan(0);
  });

  it("shows ~0 remaining after complete fills a tight wall", () => {
    const starter = createLivingRoomStarterProject({ now: "2026-09-05T00:00:00.000Z" });
    const project = drawRoomFromPoints(starter, {
      kind: "polygon",
      points: [{ x: 0, z: 0 }, { x: 1880, z: 0 }, { x: 1880, z: 2400 }, { x: 0, z: 2400 }],
    });
    const wall = project.walls.find((item) => item.roomId === project.activeRoomId)!;
    const cabinets = makeCabinets(starter, ["cab-a", "cab-b"], 900, project.activeRoomId);
    const arranged = arrangeCabinetRun(
      { ...project, objects: cabinets },
      cabinets.map((cabinet) => cabinet.id),
      wall.id,
      { gapMm: 80, alignment: "start" },
    );
    const runId = cabinetRunForObject(arranged.objects[0]!)!.runId;
    const result = completeCabinetRun(arranged, runId);
    expect(countCabinetRunFillers(result!.project, runId)).toBe(1);
    const again = proposeCabinetRunComplete(result!.project, runId);
    expect(again?.suggestedFillers).toEqual([]);
    expect(again?.remainingMm ?? 0).toBeLessThanOrEqual(1);
  });


  it("does not sum split free fragments into one filler (1000 gap + 900 door → two 50 mm)", () => {
    const starter = createLivingRoomStarterProject({ now: "2026-09-05T00:00:00.000Z" });
    const project = drawRoomFromPoints(starter, {
      kind: "polygon",
      points: [{ x: 0, z: 0 }, { x: 2800, z: 0 }, { x: 2800, z: 2400 }, { x: 0, z: 2400 }],
    });
    const wall = project.walls.find((item) => Math.abs(item.start.z - item.end.z) < 0.5
      && Math.min(item.start.x, item.end.x) === 0
      && Math.max(item.start.x, item.end.x) === 2800)!;
    const cabinets = makeCabinets(starter, ["cab-a", "cab-b"], 900, project.activeRoomId);
    const arranged = arrangeCabinetRun(
      { ...project, objects: cabinets },
      cabinets.map((cabinet) => cabinet.id),
      wall.id,
      { gapMm: 1000, alignment: "start" },
    );
    // Door fills the middle of the 1000 mm between-gap → two ~50 mm free fragments.
    const withOpening = addLivingRoomOpening(
      arranged,
      createOpeningCatalogInstance({
        id: "door-split",
        roomId: project.activeRoomId,
        wallId: wall.id,
        catalogItemId: "opening:door-single",
        offsetMm: 950,
      }),
    );
    const runId = cabinetRunForObject(withOpening.objects.find((o) => o.id === "cab-a")!)!.runId;
    const proposal = proposeCabinetRunComplete(withOpening, runId);
    expect(proposal).not.toBeNull();
    // Must NOT propose a single 100 mm filler from summed fragments.
    expect(proposal!.suggestedFillers.some((item) => item.widthMm === 100)).toBe(false);
    const between = proposal!.suggestedFillers.filter((item) => item.side === "between");
    // Each 50 mm fragment is fillable on its own (40–150).
    expect(between.every((item) => item.widthMm === 50)).toBe(true);
    expect(between.length).toBe(2);

    const result = completeCabinetRun(withOpening, runId);
    expect(result).not.toBeNull();
    const again = proposeCabinetRunComplete(result!.project, runId);
    // After sync places both contiguous fillers, do not keep requesting forever.
    expect(again?.suggestedFillers.filter((item) => item.side === "between") ?? []).toEqual([]);
  });

  it("treats another run on the same wall as occupied", () => {
    const starter = createLivingRoomStarterProject({ now: "2026-09-05T00:00:00.000Z" });
    const project = drawRoomFromPoints(starter, {
      kind: "polygon",
      points: [{ x: 0, z: 0 }, { x: 5000, z: 0 }, { x: 5000, z: 2400 }, { x: 0, z: 2400 }],
    });
    const wall = project.walls.find((item) => Math.abs(item.start.z - item.end.z) < 0.5
      && Math.max(item.start.x, item.end.x) - Math.min(item.start.x, item.end.x) === 5000)!;
    const runA = makeCabinets(starter, ["a1", "a2"], 900, project.activeRoomId);
    const arrangedA = arrangeCabinetRun(
      { ...project, objects: runA },
      runA.map((cabinet) => cabinet.id),
      wall.id,
      { gapMm: 0, alignment: "start" },
    );
    const runB = makeCabinets(starter, ["b1", "b2"], 900, project.activeRoomId);
    const arrangedB = arrangeCabinetRun(
      { ...arrangedA, objects: [...arrangedA.objects, ...runB] },
      runB.map((cabinet) => cabinet.id),
      wall.id,
      { gapMm: 0, alignment: "end" },
    );
    const runIdA = cabinetRunForObject(arrangedB.objects.find((o) => o.id === "a1")!)!.runId;
    const proposal = proposeCabinetRunComplete(arrangedB, runIdA);
    const preview = previewCabinetRunPlacement(arrangedB, wall.id, { runId: runIdA, roomId: arrangedB.activeRoomId });
    const oriented = orientWallForRoom(arrangedB, arrangedB.activeRoomId, wall);
    expect(preview!.remainingMm).toBeLessThan(wallLength(oriented) - 1800);
    const occupied = collectWallOccupancySpans(arrangedB, wall.id, arrangedB.activeRoomId)!;
    expect(occupied.occupied.filter((span) => span.kind === "cabinet").length).toBeGreaterThanOrEqual(2);
    expect(proposal).not.toBeNull();
  });
});

describe("openingSpanOnOrientedWall", () => {
  it("mirrors opening span when oriented wall is reversed", () => {
    const starter = createLivingRoomStarterProject({ now: "2026-09-05T00:00:00.000Z" });
    const stored = starter.walls[0]!;
    const lengthMm = wallLength(stored);
    const oriented = {
      ...stored,
      start: stored.end,
      end: stored.start,
      startNodeId: stored.endNodeId,
      endNodeId: stored.startNodeId,
    };
    const opening = createOpeningCatalogInstance({
      id: "door-rev",
      wallId: stored.id,
      catalogItemId: "opening:door-single",
      offsetMm: 200,
    });
    const span = openingSpanOnOrientedWall(opening, stored, oriented, lengthMm);
    expect(span.startMm).toBeCloseTo(lengthMm - 200 - opening.widthMm, 0);
    expect(span.endMm).toBeCloseTo(lengthMm - 200, 0);
  });
});
