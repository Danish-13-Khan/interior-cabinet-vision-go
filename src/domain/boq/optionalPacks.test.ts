import { describe, expect, it } from "vitest";
import { buildBoqFromReport } from "./fromReport";
import {
  buildOptionalBoqLine,
  buildOptionalBoqLines,
  groupOptionalByKind,
  listOptionalPackSkus,
  sumOptionalPackSell,
} from "./optionalPacks";
import { mergeOptionalIntoBoqViews, optionalLineToBoqLine } from "./mergeOptional";
import { getDefaultCabinetConfig, type CabinetProject } from "../cabinetDimensions";
import { createDefaultJobMeta } from "../jobMeta";
import { createProjectReport } from "../projectReport";
import { DEFAULT_QUOTE_SETTINGS } from "../quoteSettings";
import type { RoomConfig } from "../roomModel";

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

const project: CabinetProject = {
  version: 1,
  cabinets: [
    {
      id: "cab-1",
      name: "Base Cabinet",
      placement: { x: 900, y: 0, z: 300, rotation: 0, attachment: "floor" },
      config: getDefaultCabinetConfig("base"),
    },
  ],
  job: createDefaultJobMeta({
    customerName: "Test",
    projectNumber: "JOB-F",
    revision: "A",
  }),
  preferences: {
    snapSizeMm: 50,
    showGrid: true,
    autoSaveToBrowser: true,
    quote: { ...DEFAULT_QUOTE_SETTINGS },
  },
};

describe("optional BOQ packs (Phase F)", () => {
  it("exposes louvers, area finishes, and fixtures catalogs", () => {
    expect(listOptionalPackSkus("louvers").length).toBeGreaterThan(0);
    expect(listOptionalPackSkus("area_finish").some((s) => s.unit === "m2")).toBe(true);
    expect(listOptionalPackSkus("fixture").map((s) => s.id)).toContain("fixture.tap");
  });

  it("builds priced optional lines from SKU defaults", () => {
    const paint = buildOptionalBoqLine({ skuId: "finish.paint.wall", quantity: 40 });
    expect(paint.packKind).toBe("area_finish");
    expect(paint.unit).toBe("m2");
    expect(paint.sellPrice).toBe(40 * 45);
    const tap = buildOptionalBoqLine({
      skuId: "fixture.tap", quantity: 2, unitRate: 3000,
    });
    expect(tap.sellPrice).toBe(6000);
  });

  it("merges optional packs into BOQ views on the existing path", () => {
    const report = createProjectReport(project, room);
    const core = buildBoqFromReport(report);
    const optional = buildOptionalBoqLines([
      { skuId: "louver.panel.std", quantity: 3.5 },
      { skuId: "fixture.mirror", quantity: 1 },
    ]);
    const merged = mergeOptionalIntoBoqViews(core, optional);
    expect(merged.lines.length).toBe(core.lines.length + 2);
    expect(merged.byOptionalPack.map((g) => g.key)).toEqual([
      "optional:louvers",
      "optional:fixture",
    ]);
    expect(merged.optionalSellTotal).toBe(sumOptionalPackSell(optional));
    expect(optionalLineToBoqLine(optional[0]).role).toBe("other");
    expect(optionalLineToBoqLine(optional[0]).cabinetId).toBe("optional");
    const grouped = groupOptionalByKind(optional);
    expect(grouped.louvers).toHaveLength(1);
    expect(grouped.fixture).toHaveLength(1);
    expect(grouped.area_finish).toHaveLength(0);
  });
});
