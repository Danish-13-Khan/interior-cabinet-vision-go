import { describe, expect, it } from "vitest";
import { clampCabinetConfig, getDefaultCabinetConfig } from "./cabinetDimensions";
import {
  createCabinetCutlist,
  createCabinetDerivedMetrics,
  createCabinetDimensionGuides,
  createCabinetGeometry,
} from "./cabinetGeometry";

function getPanel(configType: "base" | "wall" | "tall" | "almirah", panelName: string) {
  return createCabinetGeometry(getDefaultCabinetConfig(configType)).find(
    (panel) => panel.name === panelName,
  );
}

describe("createCabinetGeometry", () => {
  it("builds the default base cabinet panels and features", () => {
    const panels = createCabinetGeometry(getDefaultCabinetConfig("base"));

    expect(panels.some((panel) => panel.name === "left-side-panel")).toBe(true);
    expect(panels.some((panel) => panel.name === "right-side-panel")).toBe(true);
    expect(panels.some((panel) => panel.name === "shelf-1")).toBe(true);
    expect(panels.some((panel) => panel.name === "toe-kick")).toBe(true);
    expect(panels.some((panel) => panel.name === "left-door")).toBe(true);
    expect(panels.some((panel) => panel.name === "right-door")).toBe(true);
  });

  it("moves left and right side panels when width changes", () => {
    const narrowConfig = getDefaultCabinetConfig("base");
    const wideConfig = clampCabinetConfig({
      ...getDefaultCabinetConfig("base"),
      dimensions: {
        ...getDefaultCabinetConfig("base").dimensions,
        width: 1200,
      },
    });

    const narrowLeft = createCabinetGeometry(narrowConfig).find(
      (panel) => panel.name === "left-side-panel",
    );
    const wideLeft = createCabinetGeometry(wideConfig).find(
      (panel) => panel.name === "left-side-panel",
    );
    const narrowRight = createCabinetGeometry(narrowConfig).find(
      (panel) => panel.name === "right-side-panel",
    );
    const wideRight = createCabinetGeometry(wideConfig).find(
      (panel) => panel.name === "right-side-panel",
    );

    expect(wideLeft?.position[0]).toBeLessThan(narrowLeft?.position[0] ?? 0);
    expect(wideRight?.position[0]).toBeGreaterThan(narrowRight?.position[0] ?? 0);
  });

  it("updates top, bottom, and back widths when width changes", () => {
    const narrowConfig = getDefaultCabinetConfig("base");
    const wideConfig = clampCabinetConfig({
      ...getDefaultCabinetConfig("base"),
      dimensions: {
        ...getDefaultCabinetConfig("base").dimensions,
        width: 1200,
      },
    });

    const narrowTop = createCabinetGeometry(narrowConfig).find(
      (panel) => panel.name === "top-panel",
    );
    const wideTop = createCabinetGeometry(wideConfig).find(
      (panel) => panel.name === "top-panel",
    );
    const narrowBack = createCabinetGeometry(narrowConfig).find(
      (panel) => panel.name === "back-panel",
    );
    const wideBack = createCabinetGeometry(wideConfig).find(
      (panel) => panel.name === "back-panel",
    );

    expect(wideTop?.size[0]).toBeGreaterThan(narrowTop?.size[0] ?? 0);
    expect(wideBack?.size[0]).toBeGreaterThan(narrowBack?.size[0] ?? 0);
  });

  it("clamps invalid width safely", () => {
    const clampedConfig = clampCabinetConfig({
      ...getDefaultCabinetConfig("base"),
      dimensions: {
        ...getDefaultCabinetConfig("base").dimensions,
        width: 100,
      },
    });
    const topPanel = createCabinetGeometry(clampedConfig).find(
      (panel) => panel.name === "top-panel",
    );

    expect(topPanel?.size[0]).toBeCloseTo(0.464);
  });

  it("builds guide labels from dimensions", () => {
    const guides = createCabinetDimensionGuides(
      clampCabinetConfig({
        ...getDefaultCabinetConfig("base"),
        dimensions: {
          ...getDefaultCabinetConfig("base").dimensions,
          width: 1200,
          height: 800,
          depth: 600,
        },
      }),
    );

    expect(guides).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "width", label: "1200 mm" }),
        expect.objectContaining({ id: "height", label: "800 mm" }),
        expect.objectContaining({ id: "depth", label: "600 mm" }),
      ]),
    );
  });

  it("creates derived metrics and a cutlist", () => {
    const config = getDefaultCabinetConfig("tall");
    const metrics = createCabinetDerivedMetrics(config);
    const cutlist = createCabinetCutlist(config);

    expect(metrics.openingHeightMm).toBeGreaterThan(1500);
    expect(metrics.estimatedPanelCount).toBeGreaterThan(8);
    expect(cutlist.some((item) => item.key === "shelves")).toBe(true);
    expect(cutlist.some((item) => item.key === "doors")).toBe(true);
  });

  it("removes toe kick on wall cabinets", () => {
    expect(getPanel("wall", "toe-kick")).toBeUndefined();
  });

  it("builds a table with a top and four legs", () => {
    const panels = createCabinetGeometry(getDefaultCabinetConfig("table"));

    expect(panels.some((panel) => panel.name === "table-top")).toBe(true);
    expect(panels.filter((panel) => panel.name.startsWith("leg-"))).toHaveLength(4);
  });

  it("builds a mirror with glass and frame parts", () => {
    const panels = createCabinetGeometry(getDefaultCabinetConfig("mirror"));

    expect(panels.some((panel) => panel.name === "mirror-glass")).toBe(true);
    expect(panels.some((panel) => panel.name === "frame-left")).toBe(true);
    expect(panels.some((panel) => panel.name === "frame-top")).toBe(true);
  });
});
