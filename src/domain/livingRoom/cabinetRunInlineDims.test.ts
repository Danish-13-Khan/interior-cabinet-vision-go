import { describe, expect, it } from "vitest";
import { createLivingRoomStarterProject } from "./preset";
import { arrangeCabinetRun, cabinetRunForObject } from "./wardrobePlacement";
import { setCabinetInlineDimensions } from "./cabinetRunInlineDims";

describe("setCabinetInlineDimensions", () => {
  it("updates width and reflows the cabinet run", () => {
    const source = createLivingRoomStarterProject({ now: "2026-09-05T00:00:00.000Z" });
    const wall = source.walls[0]!;
    const cabinets = [0, 1].map((index) => ({
      ...source.objects[index]!,
      id: `cab-${index}`,
      kind: "cabinet" as const,
      dimensions: { widthMm: 900, heightMm: 720, depthMm: 560 },
    }));
    const arranged = arrangeCabinetRun(
      { ...source, objects: cabinets },
      cabinets.map((cabinet) => cabinet.id),
      wall.id,
      { gapMm: 0, alignment: "start" },
    );
    const runId = cabinetRunForObject(arranged.objects[0]!)!.runId;
    const next = setCabinetInlineDimensions(arranged, "cab-0", { widthMm: 600 });
    expect(next.objects.find((object) => object.id === "cab-0")?.dimensions.widthMm).toBe(600);
    expect(cabinetRunForObject(next.objects.find((object) => object.id === "cab-0")!)?.runId).toBe(runId);
  });
});
