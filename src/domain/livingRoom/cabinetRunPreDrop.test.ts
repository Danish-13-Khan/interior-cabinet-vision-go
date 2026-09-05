import { describe, expect, it } from "vitest";
import { drawRoomFromPoints } from "../interiorProject";
import { createLivingRoomStarterProject } from "./preset";
import { arrangeCabinetRun, attachToWall } from "./wardrobePlacement";
import { validateCabinetRunPreDrop } from "./cabinetRunPreDrop";

function cabinetSeed(
  source: ReturnType<typeof createLivingRoomStarterProject>,
  id: string,
  widthMm: number,
) {
  return {
    ...source.objects[0]!,
    id,
    kind: "cabinet" as const,
    name: id,
    category: "cabinet",
    catalogItemId: "living:base-cabinet-900",
    dimensions: { widthMm, heightMm: 720, depthMm: 560 },
    materialSlots: {},
    parameters: {},
    extensions: {},
  };
}

describe("cabinetRunPreDrop", () => {
  it("blocks overlap against an existing cabinet", () => {
    const source = createLivingRoomStarterProject({ now: "2026-09-05T00:00:00.000Z" });
    const wall = source.walls[0]!;
    const base = cabinetSeed(source, "cab-a", 900);
    const placed = attachToWall({ ...source, objects: [] }, base, wall.id);
    const project = { ...source, objects: [placed] };
    const ghost = { ...placed, id: "cab-b", name: "cab-b" };
    const result = validateCabinetRunPreDrop(project, { object: ghost, wallId: wall.id });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("overlap");
  });

  it("returns fits for a clear free-floor placement", () => {
    const source = createLivingRoomStarterProject({ now: "2026-09-05T00:00:00.000Z" });
    const empty = { ...source, objects: [] };
    const result = validateCabinetRunPreDrop(empty, {
      ghost: {
        roomId: source.activeRoomId,
        name: "Free cabinet",
        position: { x: 0, y: 0, z: 0 },
        dimensions: { widthMm: 600, heightMm: 720, depthMm: 560 },
      },
    });
    expect(result.ok).toBe(true);
    expect(["fits", "needs-filler"]).toContain(result.code);
  });

  it("blocks no-fit when candidate is wider than remaining wall", () => {
    const starter = createLivingRoomStarterProject({ now: "2026-09-05T00:00:00.000Z" });
    const project = drawRoomFromPoints(starter, {
      kind: "polygon",
      points: [{ x: 0, z: 0 }, { x: 2000, z: 0 }, { x: 2000, z: 2400 }, { x: 0, z: 2400 }],
    });
    const wall = project.walls.find((item) => item.roomId === project.activeRoomId)!;
    const cabinets = ["cab-0", "cab-1"].map((id) => ({
      ...cabinetSeed(starter, id, 900),
      roomId: project.activeRoomId,
    }));
    const arranged = arrangeCabinetRun(
      { ...project, objects: cabinets },
      cabinets.map((cabinet) => cabinet.id),
      wall.id,
      { gapMm: 0, alignment: "start" },
    );
    const result = validateCabinetRunPreDrop(arranged, {
      ghost: {
        roomId: project.activeRoomId,
        name: "Too wide",
        position: { x: 0, y: 0, z: 0 },
        dimensions: { widthMm: 900, heightMm: 720, depthMm: 560 },
      },
      wallId: wall.id,
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("no-fit");
  });
});
