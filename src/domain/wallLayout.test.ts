import { describe, expect, it } from "vitest";
import {
  defaultCabinetProject,
  getDefaultCabinetConfig,
  type CabinetInstance,
  type CabinetProject,
  type CabinetType,
} from "./cabinetDimensions";
import { createCabinetPlanningWorkflow } from "./cabinetLibrary";
import { DEFAULT_ROOM } from "./roomModel";
import {
  cabinetBelongsToWall,
  createWallLayoutSummary,
  findAvailableWallPlacement,
} from "./wallLayout";

const bounds = { widthMm: 6000, depthMm: 4000, heightMm: 2800 };

function cabinet(
  id: string,
  type: CabinetType,
  x: number,
  z: number,
  rotation: 0 | 90 | 270 = 0,
): CabinetInstance {
  return {
    id,
    name: id,
    config: getDefaultCabinetConfig(type),
    placement: { x, y: type === "wall" ? 1400 : 0, z, rotation, attachment: type === "wall" ? "back-wall" : "floor" },
    layerId: "layer-default",
    groupId: null,
  };
}

function project(cabinets: CabinetInstance[]): CabinetProject {
  return { ...defaultCabinetProject, cabinets };
}

describe("wall layout", () => {
  it("summarizes wall runs, free span, fillers and countertops", () => {
    const cabinets = [
      cabinet("base-1", "base", -1000, -1720),
      cabinet("base-2", "drawer", -50, -1720),
    ];
    const value = project(cabinets);
    const workflow = createCabinetPlanningWorkflow(value, bounds);
    const summary = createWallLayoutSummary({
      project: value,
      room: DEFAULT_ROOM,
      roomBounds: bounds,
      workflow,
      side: "back-wall",
    });

    expect(summary.cabinetIds).toEqual(["base-1", "base-2"]);
    expect(summary.runIds).toHaveLength(1);
    expect(summary.availableBaseMm).toBeLessThan(6000);
    expect(summary.countertopCount).toBe(1);
  });

  it("separates cabinets by active wall", () => {
    const left = cabinet("left-1", "base", -2550, -800, 90);
    expect(cabinetBelongsToWall(left, "left-wall", bounds)).toBe(true);
    expect(cabinetBelongsToWall(left, "back-wall", bounds)).toBe(false);
  });

  it("places a dropped cabinet in the nearest clear span", () => {
    const existing = cabinet("center", "base", 0, -1720);
    const value = project([existing]);
    const placement = findAvailableWallPlacement({
      project: value,
      room: DEFAULT_ROOM,
      roomBounds: bounds,
      config: getDefaultCabinetConfig("base"),
      side: "back-wall",
      provisionalId: "dropped",
      preferredPrimaryMm: 1800,
      snapMm: 50,
    });

    expect(placement).not.toBeNull();
    expect(placement!.x).toBeGreaterThan(900);
  });

  it("places a base cabinet flush to the selected side wall", () => {
    const placement = findAvailableWallPlacement({
      project: project([]),
      room: DEFAULT_ROOM,
      roomBounds: bounds,
      config: getDefaultCabinetConfig("base"),
      side: "right-wall",
      provisionalId: "new-1",
      preferredPrimaryMm: 0,
    });

    expect(placement).not.toBeNull();
    expect(placement?.rotation).toBe(270);
    expect(placement?.attachment).toBe("floor");
    expect(placement?.x).toBe(2550);
  });

  it("moves wall cabinets away from a window at the preferred drop point", () => {
    const placement = findAvailableWallPlacement({
      project: project([]),
      room: DEFAULT_ROOM,
      roomBounds: bounds,
      config: getDefaultCabinetConfig("wall"),
      side: "back-wall",
      provisionalId: "wall-1",
      preferredPrimaryMm: -1500,
    });

    expect(placement).not.toBeNull();
    expect(placement?.x).not.toBe(-1500);
    expect(placement?.attachment).toBe("back-wall");
  });

  it("returns null when no valid wall span remains", () => {
    const full = cabinet("full", "base", 0, -1720);
    full.config = {
      ...full.config,
      dimensions: { ...full.config.dimensions, width: 6000 },
    };
    const placement = findAvailableWallPlacement({
      project: project([full]),
      room: DEFAULT_ROOM,
      roomBounds: bounds,
      config: getDefaultCabinetConfig("base"),
      side: "back-wall",
      provisionalId: "new-2",
    });
    expect(placement).toBeNull();
  });
});
