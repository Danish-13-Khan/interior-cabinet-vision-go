import { describe, expect, it } from "vitest";
import { getDefaultCabinetConfig, type CabinetInstance } from "../cabinetDimensions";
import type { CabinetRun } from "../cabinetLibrary";
import {
  buildRunPlanBounds,
  collectRunDraftDimensionChain,
  collectRunGapSegments,
  formatRunDraftLabel,
} from "./index";

function makeCabinet(id: string, x: number, z = -1720): CabinetInstance {
  return {
    id,
    name: id,
    placement: { x, y: 0, z, rotation: 0, attachment: "floor" },
    config: getDefaultCabinetConfig("base"),
  };
}

describe("runDrafting", () => {
  const run: CabinetRun = {
    id: "run-1",
    side: "back-wall",
    axis: "x",
    band: "base",
    cabinetIds: ["a", "b"],
    cornerTransition: true,
  };

  it("builds plan bounds and run labels", () => {
    const cabinets = [makeCabinet("a", -900), makeCabinet("b", 200)];
    const bounds = buildRunPlanBounds(run, cabinets, 0);
    expect(bounds).not.toBeNull();
    expect(bounds!.shortCode).toBe("R01");
    expect(bounds!.lengthMm).toBeGreaterThan(1000);
    expect(bounds!.cornerTransition).toBe(true);
    expect(formatRunDraftLabel(run, 0)).toContain("Back wall");
  });

  it("collects gap segments between cabinets", () => {
    const cabinets = [makeCabinet("a", -900), makeCabinet("b", 200)];
    const gaps = collectRunGapSegments(run, cabinets);
    expect(gaps.length).toBeGreaterThan(0);
    expect(gaps[0]!.widthMm).toBeGreaterThan(0);
  });

  it("builds filler-aware run dimension chains", () => {
    const cabinets = [makeCabinet("a", -900), makeCabinet("b", 200)];
    const chain = collectRunDraftDimensionChain(run, cabinets, [
      {
        id: "filler-1",
        runId: "run-1",
        side: "end",
        widthMm: 60,
        position: { x: -350, y: 0, z: -1720 },
        size: { width: 60, height: 720, depth: 560 },
      },
    ]);
    expect(chain).not.toBeNull();
    expect(chain!.positions.length).toBeGreaterThanOrEqual(4);
    expect(chain!.labels.length).toBe(chain!.positions.length - 1);
  });
});
