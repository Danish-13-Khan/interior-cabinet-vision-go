import { describe, expect, it } from "vitest";
import {
  createCabinetPlanningWorkflow,
  createRunAlignedPlacements,
  detectCabinetRuns,
  snapPlacementIntoRuns,
} from "./index";
import {
  getDefaultCabinetConfig,
  type CabinetInstance,
  type CabinetProject,
  type RoomBounds,
} from "../cabinetDimensions";

const roomBounds: RoomBounds = {
  widthMm: 6000,
  depthMm: 4000,
  heightMm: 2800,
};

function makeCabinet(
  id: string,
  type: CabinetInstance["config"]["type"],
  x: number,
  z: number,
  extras: Partial<CabinetInstance["placement"]> = {},
): CabinetInstance {
  return {
    id,
    name: id,
    placement: {
      x,
      y: type === "wall" ? 1400 : 0,
      z,
      rotation: 0,
      attachment: type === "wall" ? "back-wall" : "floor",
      ...extras,
    },
    config: getDefaultCabinetConfig(type),
  };
}

function createProject(): CabinetProject {
  return {
    version: 1,
    cabinets: [
      makeCabinet("base-1", "base", -900, -1720),
      makeCabinet("drawer-1", "drawer", 50, -1720),
      makeCabinet("sink-1", "sink", 1150, -1720),
    ],
  };
}

describe("cabinet run assembly", () => {
  it("detects a straight base run along the back wall", () => {
    const runs = detectCabinetRuns(createProject().cabinets, roomBounds);
    expect(runs).toHaveLength(1);
    expect(runs[0]!.side).toBe("back-wall");
    expect(runs[0]!.band).toBe("base");
    expect(runs[0]!.axis).toBe("x");
    expect(runs[0]!.cabinetIds).toEqual(["base-1", "drawer-1", "sink-1"]);
  });

  it("keeps wall and base runs in separate bands", () => {
    const cabinets = [
      makeCabinet("base-1", "base", -900, -1720),
      makeCabinet("wall-1", "wall", -900, -1850),
      makeCabinet("wall-2", "wall", 0, -1850),
    ];
    const runs = detectCabinetRuns(cabinets, roomBounds);
    expect(runs.some((run) => run.band === "base")).toBe(true);
    expect(runs.some((run) => run.band === "wall")).toBe(true);
  });

  it("aligns cabinets flush to the wall face", () => {
    const project = createProject();
    const run = detectCabinetRuns(project.cabinets, roomBounds)[0]!;
    const placements = createRunAlignedPlacements(run, project, roomBounds);

    expect(placements["drawer-1"]!.x).toBeGreaterThan(placements["base-1"]!.x);
    expect(placements["sink-1"]!.x).toBeGreaterThan(placements["drawer-1"]!.x);
    // Flush toward back wall
    expect(placements["base-1"]!.z).toBeLessThan(-1500);
  });

  it("creates inter-cabinet and wall-end fillers where gaps fit", () => {
    const project: CabinetProject = {
      version: 1,
      cabinets: [
        makeCabinet("base-1", "base", -2400, -1720),
        makeCabinet("base-2", "base", -1400, -1720),
      ],
    };
    const workflow = createCabinetPlanningWorkflow(project, roomBounds);
    expect(workflow.fillers.some((filler) => filler.side === "between")).toBe(
      true,
    );
    expect(
      workflow.fillers.some(
        (filler) => filler.side === "start" || filler.side === "end",
      ),
    ).toBe(true);
  });

  it("builds countertops only for base runs and splits on large gaps", () => {
    const project: CabinetProject = {
      version: 1,
      cabinets: [
        makeCabinet("base-1", "base", -900, -1720),
        makeCabinet("tall-1", "tall", 200, -1720),
        makeCabinet("base-2", "base", 1200, -1720),
        makeCabinet("wall-1", "wall", -900, -1850),
      ],
    };
    const workflow = createCabinetPlanningWorkflow(project, roomBounds);
    expect(workflow.countertops.every((ct) => !ct.cabinetIds.includes("wall-1"))).toBe(
      true,
    );
    expect(workflow.countertops.every((ct) => !ct.cabinetIds.includes("tall-1"))).toBe(
      true,
    );
    expect(workflow.countertops.length).toBeGreaterThanOrEqual(1);
    expect(workflow.countertops.every((ct) => ct.axis === "x")).toBe(true);
  });

  it("does not author a countertop on a run filler", () => {
    const filler = makeCabinet("filler-1", "base", 2100, -1720);
    filler.runFiller = { runId: "run-1", side: "end" };
    filler.config = {
      ...filler.config,
      dimensions: { ...filler.config.dimensions, width: 100, depth: 18 },
    };
    const workflow = createCabinetPlanningWorkflow(
      {
        version: 1,
        cabinets: [
          makeCabinet("base-1", "base", -900, -1720),
          makeCabinet("drawer-1", "drawer", 50, -1720),
          filler,
        ],
      },
      roomBounds,
    );
    expect(workflow.countertops.every((top) => !top.cabinetIds.includes("filler-1"))).toBe(true);
    expect(workflow.countertops.some((top) => top.cabinetIds.includes("base-1"))).toBe(true);
  });

  it("splits a generated countertop at an authored break", () => {
    const first = makeCabinet("base-1", "base", -450, -1720);
    first.config = { ...first.config, countertopBreakAfter: true };
    const project: CabinetProject = {
      version: 1,
      cabinets: [first, makeCabinet("base-2", "base", 450, -1720)],
    };

    const workflow = createCabinetPlanningWorkflow(project, roomBounds);
    expect(workflow.countertops).toHaveLength(2);
    expect(workflow.countertops[0]!.cabinetIds).toEqual(["base-1"]);
    expect(workflow.countertops[1]!.cabinetIds).toEqual(["base-2"]);
  });

  it("snaps a cabinet onto a neighboring run line", () => {
    const others = [
      makeCabinet("base-1", "base", -900, -1720),
      makeCabinet("base-2", "base", 0, -1720),
    ];
    const moving = makeCabinet("base-3", "base", 900, -1600);
    const snapped = snapPlacementIntoRuns({
      cabinet: moving,
      others,
      proposed: moving.placement,
      roomBounds,
    });
    expect(Math.abs(snapped.placement.z - -1720)).toBeLessThan(5);
    expect(snapped.guides.some((guide) => guide.kind === "align")).toBe(true);
  });

  it("marks corner transitions for L-shaped wall runs", () => {
    const cabinets = [
      makeCabinet("base-back", "base", -900, -1720),
      makeCabinet("base-corner", "corner", 2000, -1720),
      makeCabinet("base-left", "base", -2720, -900, {
        rotation: 90,
        attachment: "left-wall",
      }),
    ];
    const runs = detectCabinetRuns(cabinets, roomBounds);
    expect(runs.some((run) => run.cornerTransition)).toBe(true);
  });
});
