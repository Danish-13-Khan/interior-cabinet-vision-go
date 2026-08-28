import { describe, expect, it } from "vitest";
import { drawRoomFromPoints } from "../interiorProject";
import { createLivingRoomStarterProject } from "./preset";
import {
  arrangeCabinetRun,
  cabinetRunForObject,
  countCabinetRunFillers,
  isCabinetRunFiller,
  reconcileCabinetRunsAfterObjectRemoval,
  updateCabinetRunLayout,
} from "./wardrobePlacement";

function makeCabinets(source: ReturnType<typeof createLivingRoomStarterProject>, ids: string[], widthMm: number) {
  return ids.map((id, index) => ({
    ...source.objects[index]!,
    id,
    kind: "cabinet" as const,
    dimensions: { widthMm, heightMm: 2200, depthMm: 600 },
  }));
}

describe("I2 cabinet run fillers", () => {
  it("inserts between-cabinet fillers when auto fillers are enabled", () => {
    const source = createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" });
    const wall = source.walls[0]!;
    const cabinets = makeCabinets(source, ["cab-a", "cab-b"], 900);
    const arranged = arrangeCabinetRun({ ...source, objects: cabinets }, cabinets.map((cabinet) => cabinet.id), wall.id, {
      gapMm: 80,
      alignment: "start",
    });
    const runId = cabinetRunForObject(arranged.objects[0]!)!.runId;
    const withFillers = updateCabinetRunLayout(arranged, runId, { fillersEnabled: true });
    expect(countCabinetRunFillers(withFillers, runId)).toBe(1);
    const filler = withFillers.objects.find(isCabinetRunFiller);
    expect(filler?.dimensions.widthMm).toBe(80);
    expect(filler?.extensions?.wallAttachment?.wallId).toBe(wall.id);
  });

  it("creates a wall-end filler within the 40–150 mm band", () => {
    const starter = createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" });
    const project = drawRoomFromPoints(starter, {
      kind: "polygon",
      points: [{ x: 0, z: 0 }, { x: 1950, z: 0 }, { x: 1950, z: 2400 }, { x: 0, z: 2400 }],
    });
    const wall = project.walls.find((item) => item.roomId === project.activeRoomId)!;
    const cabinets = makeCabinets(starter, ["cab-a", "cab-b"], 900);
    const arranged = arrangeCabinetRun({ ...project, objects: cabinets }, cabinets.map((cabinet) => cabinet.id), wall.id, {
      gapMm: 0,
      alignment: "start",
    });
    const runId = cabinetRunForObject(arranged.objects[0]!)!.runId;
    const withFillers = updateCabinetRunLayout(arranged, runId, { fillersEnabled: true });
    const endFiller = withFillers.objects.find((object) => isCabinetRunFiller(object) && object.extensions?.cabinetRunFiller?.side === "end");
    expect(endFiller?.dimensions.widthMm).toBe(150);
  });

  it("removes fillers when auto fillers are disabled", () => {
    const source = createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" });
    const wall = source.walls[0]!;
    const cabinets = makeCabinets(source, ["cab-a", "cab-b"], 900);
    const arranged = arrangeCabinetRun({ ...source, objects: cabinets }, cabinets.map((cabinet) => cabinet.id), wall.id, { gapMm: 80, alignment: "start" });
    const runId = cabinetRunForObject(arranged.objects[0]!)!.runId;
    const enabled = updateCabinetRunLayout(arranged, runId, { fillersEnabled: true });
    const disabled = updateCabinetRunLayout(enabled, runId, { fillersEnabled: false });
    expect(countCabinetRunFillers(disabled, runId)).toBe(0);
    expect(cabinetRunForObject(disabled.objects[0]!)?.fillersEnabled).toBe(false);
  });

  it("removes generated fillers and stale run metadata when a run collapses", () => {
    const source = createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" });
    const wall = source.walls[0]!;
    const cabinets = makeCabinets(source, ["cab-a", "cab-b"], 900);
    const arranged = arrangeCabinetRun({ ...source, objects: cabinets }, cabinets.map((cabinet) => cabinet.id), wall.id, { gapMm: 80 });
    const runId = cabinetRunForObject(arranged.objects[0]!)!.runId;
    const withFillers = updateCabinetRunLayout(arranged, runId, { fillersEnabled: true });
    const reconciled = reconcileCabinetRunsAfterObjectRemoval(withFillers, ["cab-a"]);
    expect(countCabinetRunFillers(reconciled, runId)).toBe(0);
    expect(cabinetRunForObject(reconciled.objects[0]!)).toBeNull();
  });
});
