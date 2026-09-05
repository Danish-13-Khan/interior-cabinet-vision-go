import { describe, expect, it } from "vitest";
import { drawRoomFromPoints } from "../interiorProject";
import { createLivingRoomStarterProject } from "./preset";
import { arrangeCabinetRun, cabinetRunForObject } from "./wardrobePlacement";
import { addLivingRoomOpening } from "./openingCommands";
import { createOpeningCatalogInstance } from "./openingCatalog";
import {
  collectWallOccupancySpans,
  formatRemainingWallLabel,
  previewCabinetRunPlacement,
} from "./cabinetRunPlacementPreview";

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

describe("cabinetRunPlacementPreview", () => {
  it("reports remaining free length after a start-aligned run", () => {
    const source = createLivingRoomStarterProject({ now: "2026-09-05T00:00:00.000Z" });
    const wall = source.walls[0]!;
    const cabinets = makeCabinets(source, ["cab-a", "cab-b"], 900);
    const arranged = arrangeCabinetRun(
      { ...source, objects: cabinets },
      cabinets.map((cabinet) => cabinet.id),
      wall.id,
      { gapMm: 0, alignment: "start" },
    );
    const runId = cabinetRunForObject(arranged.objects[0]!)!.runId;
    const preview = previewCabinetRunPlacement(arranged, wall.id, { runId });
    expect(preview).not.toBeNull();
    expect(preview!.wallLengthMm).toBeGreaterThan(1800);
    expect(preview!.remainingMm).toBe(preview!.wallLengthMm - 1800);
    expect(preview!.freeSegments.some((segment) => segment.lengthMm === preview!.remainingMm)).toBe(true);
    expect(formatRemainingWallLabel(preview!)).toContain(`Remaining on wall: ${preview!.remainingMm} mm`);
  });

  it("marks candidate width as no-fit when wider than remaining", () => {
    const source = createLivingRoomStarterProject({ now: "2026-09-05T00:00:00.000Z" });
    const project = drawRoomFromPoints(source, {
      kind: "polygon",
      points: [{ x: 0, z: 0 }, { x: 2000, z: 0 }, { x: 2000, z: 2400 }, { x: 0, z: 2400 }],
    });
    const wall = project.walls.find((item) => item.roomId === project.activeRoomId)!;
    const cabinets = makeCabinets(source, ["cab-a", "cab-b"], 900, project.activeRoomId);
    const arranged = arrangeCabinetRun(
      { ...project, objects: cabinets },
      cabinets.map((cabinet) => cabinet.id),
      wall.id,
      { gapMm: 0, alignment: "start" },
    );
    const preview = previewCabinetRunPlacement(arranged, wall.id, { candidateWidthMm: 500, roomId: project.activeRoomId });
    expect(preview?.candidateFits).toBe(false);
    expect(preview?.remainingMm).toBeLessThan(500);
  });

  it("includes other runs in occupancy even when runId is set", () => {
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
      runA.map((c) => c.id),
      wall.id,
      { gapMm: 0, alignment: "start" },
    );
    const runB = makeCabinets(starter, ["b1", "b2"], 900, project.activeRoomId);
    const arrangedB = arrangeCabinetRun(
      { ...arrangedA, objects: [...arrangedA.objects, ...runB] },
      runB.map((c) => c.id),
      wall.id,
      { gapMm: 0, alignment: "end" },
    );
    const runIdA = cabinetRunForObject(arrangedB.objects.find((o) => o.id === "a1")!)!.runId;
    const withRunFilter = previewCabinetRunPlacement(arrangedB, wall.id, { runId: runIdA, roomId: arrangedB.activeRoomId });
    const withoutFilter = previewCabinetRunPlacement(arrangedB, wall.id, { roomId: arrangedB.activeRoomId });
    // Other run must still count as occupied — remaining matches full-wall occupancy
    expect(withRunFilter!.remainingMm).toBe(withoutFilter!.remainingMm);
    expect(withRunFilter!.remainingMm).toBe(withRunFilter!.wallLengthMm - 3600);
  });

  it("counts openings as occupied with reverse-wall transform", () => {
    const starter = createLivingRoomStarterProject({ now: "2026-09-05T00:00:00.000Z" });
    const project = drawRoomFromPoints(starter, {
      kind: "polygon",
      points: [{ x: 0, z: 0 }, { x: 3000, z: 0 }, { x: 3000, z: 2400 }, { x: 0, z: 2400 }],
    });
    const wall = project.walls.find((item) => Math.abs(item.start.z - item.end.z) < 0.5
      && Math.max(item.start.x, item.end.x) - Math.min(item.start.x, item.end.x) === 3000)!;
    const withOpening = addLivingRoomOpening(
      { ...project, objects: [] },
      createOpeningCatalogInstance({
        id: "door-a",
        roomId: project.activeRoomId,
        wallId: wall.id,
        catalogItemId: "opening:door-single",
        offsetMm: 100,
      }),
    );
    const preview = previewCabinetRunPlacement(withOpening, wall.id, { roomId: withOpening.activeRoomId });
    expect(preview!.openingCount).toBe(1);
    expect(preview!.remainingMm).toBe(preview!.wallLengthMm - 900);
    const collected = collectWallOccupancySpans(withOpening, wall.id, withOpening.activeRoomId)!;
    expect(collected.occupied.some((span) => span.kind === "opening")).toBe(true);
  });

  it("ignores cabinets on the same wallId from another room", () => {
    const starter = createLivingRoomStarterProject({ now: "2026-09-05T00:00:00.000Z" });
    const project = drawRoomFromPoints(starter, {
      kind: "polygon",
      points: [{ x: 0, z: 0 }, { x: 3000, z: 0 }, { x: 3000, z: 2400 }, { x: 0, z: 2400 }],
    });
    const wall = project.walls.find((item) => Math.abs(item.start.z - item.end.z) < 0.5
      && Math.max(item.start.x, item.end.x) - Math.min(item.start.x, item.end.x) === 3000)!;
    const roomA = project.activeRoomId;
    const roomB = "room-other";
    const cabinetsA = makeCabinets(starter, ["a1", "a2"], 900).map((cabinet) => ({
      ...cabinet,
      roomId: roomA,
    }));
    const arrangedA = arrangeCabinetRun(
      { ...project, objects: cabinetsA },
      cabinetsA.map((c) => c.id),
      wall.id,
      { gapMm: 0, alignment: "start" },
    );
    const cabinetsB = makeCabinets(starter, ["b1"], 900).map((cabinet) => ({
      ...cabinet,
      roomId: roomB,
      extensions: {
        ...cabinet.extensions,
        wallAttachment: { wallId: wall.id },
        placement: "wall",
      },
      position: { x: 1500, y: 0, z: 0 },
    }));
    const mixed = {
      ...arrangedA,
      objects: [...arrangedA.objects, ...cabinetsB],
    };
    const roomASpans = collectWallOccupancySpans(mixed, wall.id, roomA)!;
    const roomBSpans = collectWallOccupancySpans(mixed, wall.id, roomB)!;
    expect(roomASpans.occupied.some((span) => span.id === "b1")).toBe(false);
    expect(roomASpans.occupied.filter((span) => span.kind === "cabinet").length).toBeGreaterThanOrEqual(2);
    expect(roomBSpans.occupied.some((span) => span.id === "b1")).toBe(true);
    expect(roomBSpans.occupied.every((span) => span.id === "b1" || span.kind === "opening")).toBe(true);

    const previewA = previewCabinetRunPlacement(mixed, wall.id, { roomId: roomA });
    const previewB = previewCabinetRunPlacement(mixed, wall.id, { roomId: roomB });
    expect(previewA!.remainingMm).toBe(previewA!.wallLengthMm - 1800);
    expect(previewB!.remainingMm).toBe(previewB!.wallLengthMm - 900);
  });

});
