import { describe, expect, it } from "vitest";
import { createLivingRoomStarterProject } from "./preset";
import {
  formatPlanDimension,
  planDimensionPair,
  wallLabelPose,
  wallLengthMm,
} from "./planReadability";

describe("Phase C plan readability", () => {
  const project = createLivingRoomStarterProject({ now: "2026-08-26T00:00:00.000Z" });
  const room = project.rooms[0];

  it("formats display units without changing millimetre geometry", () => {
    expect(formatPlanDimension(6200, "mm")).toBe("6200 mm");
    expect(formatPlanDimension(6200, "cm")).toBe("620 cm");
    expect(formatPlanDimension(6200, "m")).toBe("6.2 m");
    expect(formatPlanDimension(6200, "ft-in")).toBe("20′ 4 ⅛″");
    expect(room.dimensions.widthMm).toBe(6200);
  });

  it("derives inner-clear and outer-footprint pairs from wall faces", () => {
    const pair = planDimensionPair(room.dimensions, project.walls);
    expect(pair.innerWidthMm).toBeLessThan(room.dimensions.widthMm);
    expect(pair.outerWidthMm).toBeGreaterThan(room.dimensions.widthMm);
    expect(pair.outerWidthMm - pair.innerWidthMm).toBe(240);
    expect(pair.outerDepthMm - pair.innerDepthMm).toBe(240);
  });

  it("reports wall length and keeps labels readable", () => {
    const back = project.walls.find((wall) => wall.extensions?.wallSide === "back")!;
    const reversed = { ...back, start: back.end, end: back.start };
    expect(wallLengthMm(back)).toBe(room.dimensions.widthMm);
    expect(Math.abs(wallLabelPose(reversed).angle)).toBeLessThanOrEqual(90);
  });
});
