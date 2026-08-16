import { describe, expect, it } from "vitest";
import {
  getDefaultCabinetConfig,
  type CabinetInstance,
  type CabinetProject,
} from "./cabinetDimensions";
import { createCabinetConstruction } from "./cabinetConstruction";
import { DEFAULT_COSTING_SETTINGS } from "./costingSettings";
import {
  buildHardwareLines,
  createHardwareSchedule,
  isAccessoryCompatible,
  normalizeCabinetHardware,
} from "./hardwareSystem";
import { createProjectReport } from "./projectReport";
import type { RoomConfig } from "./roomModel";

const room: RoomConfig = {
  dimensions: {
    widthMm: 6000,
    depthMm: 4000,
    heightMm: 2800,
    wallThicknessMm: 120,
    showBackWall: true,
    showLeftWall: true,
    showRightWall: true,
  },
  doors: [],
  windows: [],
};

function makeCabinet(
  id: string,
  type: "base" | "sink" | "wall",
  extras: Partial<CabinetInstance["config"]> = {},
): CabinetInstance {
  return {
    id,
    name: id,
    placement: {
      x: 0,
      y: type === "wall" ? 1400 : 0,
      z: 0,
      rotation: 0,
      attachment: type === "wall" ? "back-wall" : "floor",
    },
    config: {
      ...getDefaultCabinetConfig(type),
      ...extras,
      hardware: normalizeCabinetHardware(type, {
        ...(extras.hardware ?? {}),
      }),
    },
  };
}

describe("hardware + accessory system", () => {
  it("normalizes sink inserts and accessory compatibility", () => {
    const sinkHardware = normalizeCabinetHardware("sink", {
      insertKind: "none",
      accessories: [{ id: "trash-pullout", quantity: 1 }, { id: "tray-cutlery", quantity: 2 }],
    });
    expect(sinkHardware.insertKind).toBe("sink-bowl");
    expect(sinkHardware.accessories.map((line) => line.id)).toEqual(["trash-pullout"]);
    expect(isAccessoryCompatible("tray-cutlery", "sink", "sink-bowl")).toBe(false);
    expect(isAccessoryCompatible("basket-pullout", "base", "none")).toBe(true);
  });

  it("retains custom appliance envelope dimensions", () => {
    expect(normalizeCabinetHardware("base", {
      insertKind: "dishwasher-gap",
      applianceWidthMm: 598,
      applianceHeightMm: 820,
      applianceDepthMm: 560,
    })).toMatchObject({
      applianceWidthMm: 598,
      applianceHeightMm: 820,
      applianceDepthMm: 560,
    });
  });

  it("builds hinge, slide, leg, and accessory lines with costing", () => {
    const cabinet = makeCabinet("base-1", "base", {
      hardware: normalizeCabinetHardware("base", {
        hingeId: "hinge-inset",
        slideId: "drawer-slide-undermount",
        handleId: "handle-cup",
        legId: "leg-plinth",
        accessories: [{ id: "basket-wire", quantity: 1 }],
      }),
    });
    // Force drawers via flat field after default
    cabinet.config = {
      ...cabinet.config,
      drawerCount: 2,
      hasDoors: true,
      hardware: normalizeCabinetHardware("base", {
        hingeId: "hinge-inset",
        slideId: "drawer-slide-undermount",
        handleId: "handle-cup",
        legId: "leg-plinth",
        accessories: [{ id: "basket-wire", quantity: 1 }],
      }),
    };

    const construction = createCabinetConstruction(cabinet.config);
    const lines = buildHardwareLines(cabinet, construction, DEFAULT_COSTING_SETTINGS);
    expect(lines.some((line) => line.id === "hinge-inset")).toBe(true);
    expect(lines.some((line) => line.id === "leg-plinth")).toBe(true);
    expect(lines.some((line) => line.id === "basket-wire" && line.quantity === 1)).toBe(true);
    expect(lines.reduce((sum, line) => sum + line.totalCost, 0)).toBeGreaterThan(0);
  });

  it("creates project hardware schedules and report packet section", () => {
    const project: CabinetProject = {
      version: 1,
      cabinets: [
        makeCabinet("base-1", "base", {
          hardware: normalizeCabinetHardware("base", {
            accessories: [{ id: "basket-pullout", quantity: 1 }],
          }),
        }),
        makeCabinet("sink-1", "sink", {
          hardware: normalizeCabinetHardware("sink", {
            accessories: [{ id: "trash-pullout", quantity: 1 }],
          }),
        }),
      ],
    };

    const report = createProjectReport(project, room);
    expect(report.hardwareSchedule.length).toBeGreaterThan(0);
    expect(report.hardwareByCabinet).toHaveLength(2);
    expect(report.packetSections.some((section) => section.id === "hardware")).toBe(true);
    expect(
      report.hardwareByCabinet.find((row) => row.cabinetId === "sink-1")?.insertKind,
    ).toBe("sink-bowl");

    const schedule = createHardwareSchedule(
      project.cabinets,
      new Map(
        report.projectCost.cabinets.map((cost) => [cost.cabinetId, cost.hardwareLines]),
      ),
    );
    expect(schedule.project.some((row) => row.kind === "accessory")).toBe(true);
  });
});
