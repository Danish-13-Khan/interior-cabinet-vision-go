import { describe, expect, it } from "vitest";
import {
  createCabinetPlanningWorkflow,
  createRunAlignedPlacements,
  detectCabinetRuns,
} from "./cabinetLibrary";
import {
  getDefaultCabinetConfig,
  type CabinetProject,
  type RoomBounds,
} from "./cabinetDimensions";

const roomBounds: RoomBounds = {
  widthMm: 6000,
  depthMm: 4000,
  heightMm: 2800,
};

function createProject(): CabinetProject {
  return {
    version: 1,
    cabinets: [
      {
        id: "base-1",
        name: "Base 1",
        placement: { x: -900, y: 0, z: -1720, rotation: 0, attachment: "floor" },
        config: getDefaultCabinetConfig("base"),
      },
      {
        id: "drawer-1",
        name: "Drawer 1",
        placement: { x: 50, y: 0, z: -1720, rotation: 0, attachment: "floor" },
        config: getDefaultCabinetConfig("drawer"),
      },
      {
        id: "sink-1",
        name: "Sink 1",
        placement: { x: 1150, y: 0, z: -1720, rotation: 0, attachment: "floor" },
        config: getDefaultCabinetConfig("sink"),
      },
    ],
  };
}

describe("cabinet planning workflow", () => {
  it("detects a straight cabinet run along the back wall", () => {
    const runs = detectCabinetRuns(createProject().cabinets, roomBounds);

    expect(runs).toHaveLength(1);
    expect(runs[0].side).toBe("back-wall");
    expect(runs[0].axis).toBe("x");
    expect(runs[0].cabinetIds).toEqual(["base-1", "drawer-1", "sink-1"]);
  });

  it("creates aligned placements for run cabinets", () => {
    const project = createProject();
    const run = detectCabinetRuns(project.cabinets, roomBounds)[0];
    const placements = createRunAlignedPlacements(run, project, roomBounds);

    expect(placements["base-1"].z).toBeLessThan(0);
    expect(placements["drawer-1"].x).toBeGreaterThan(placements["base-1"].x);
    expect(placements["sink-1"].x).toBeGreaterThan(placements["drawer-1"].x);
  });

  it("generates fillers and a countertop for countertop-eligible runs", () => {
    const workflow = createCabinetPlanningWorkflow(createProject(), roomBounds);

    expect(workflow.countertops).toHaveLength(1);
    expect(workflow.countertops[0].cabinetIds).toEqual(["base-1", "drawer-1", "sink-1"]);
    expect(workflow.countertops[0].widthMm).toBeGreaterThan(2000);
    expect(workflow.fillers.length).toBeGreaterThanOrEqual(1);
  });
});
