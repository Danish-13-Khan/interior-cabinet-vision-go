import { describe, expect, it } from "vitest";
import { clampCabinetConfig, getDefaultCabinetConfig, type CabinetConfig, type CabinetInstance, type CabinetType } from "../cabinetDimensions";
import { normalizeConstructionSpec } from "../cabinetConstructionSpec";
import { createCabinetGeometry } from "../cabinetGeometry";
import { DEFAULT_COSTING_SETTINGS } from "../costingSettings";
import { renderElevationFaceGraphics } from "../elevationFace";
import { defaultGolaProfiles, type FrontSystem } from "../frontSystem";
import { buildHardwareLines } from "../hardwareSystem";
import { createCabinetConstruction } from "./createConstruction";
import { handledFrontCount, resolveFrontGaps } from "./frontGaps";

const GOLA: FrontSystem = { kind: "gola", profiles: defaultGolaProfiles() };

function withFronts(type: CabinetType, frontSystem: FrontSystem): CabinetConfig {
  const config = getDefaultCabinetConfig(type);
  return clampCabinetConfig({ ...config, construction: { ...normalizeConstructionSpec(type, config.construction), frontSystem } });
}

function cabinet(config: CabinetConfig): CabinetInstance {
  return { id: "c", name: "c", config, placement: { x: 0, y: 0, z: 0, rotation: 0, attachment: "floor" } };
}

function elevationSvg(config: CabinetConfig) {
  const { width, height } = config.dimensions;
  return renderElevationFaceGraphics(cabinet(config), 0, 0, width, height, { scale: 1, showDetails: true }).join("");
}

const rectHeights = (svg: string, className: string) =>
  [...svg.matchAll(new RegExp(`<rect [^>]*height="([\\d.]+)"[^>]*class="${className}"`, "g"))].map((match) => Number(match[1]));

describe("gola fronts without a profile", () => {
  it("a lone tall door keeps its handle and is counted on the hardware list", () => {
    const config = withFronts("tall", GOLA);
    const fronts = resolveFrontGaps(config);
    expect(fronts.profiles).toEqual([]);
    const ungripped = handledFrontCount(fronts);
    expect(ungripped).toBeGreaterThan(0);
    const lines = buildHardwareLines(cabinet(config), createCabinetConstruction(config), DEFAULT_COSTING_SETTINGS);
    expect(lines.find((line) => line.kind === "handle")?.quantity).toBe(ungripped);
  });

  it("gripped fronts drop the handle: base door under L, every drawer in a bank", () => {
    expect(handledFrontCount(resolveFrontGaps(withFronts("base", GOLA)))).toBe(0);
    expect(handledFrontCount(resolveFrontGaps(withFronts("drawer", GOLA)))).toBe(0);
    expect(handledFrontCount(resolveFrontGaps(withFronts("wall", GOLA)))).toBe(0);
  });
});

describe("gola on factory sheets", () => {
  it("notch note names its reference edges and the notch span", () => {
    const config = withFronts("base", GOLA);
    const note = createCabinetConstruction(config).parts.find((part) => part.id === "left-side")?.notes ?? "";
    const top = config.dimensions.height;
    expect(note).toContain(`L 60×27 mm from ${top - 60} to ${top} mm`);
    expect(note).toContain("heights from the side's bottom edge, depth from its front edge");
  });

  it("elevation fronts match the cut list and drop handles under gola", () => {
    for (const frontSystem of [{ kind: "handled" } as FrontSystem, GOLA]) {
      const config = withFronts("base", frontSystem);
      const doors = createCabinetConstruction(config).parts.filter((part) => part.category === "Door");
      const svg = elevationSvg(config);
      expect(rectHeights(svg, "twod-door-leaf-edge").map(Math.round)).toEqual(
        doors.flatMap((part) => Array.from({ length: part.quantity }, () => part.lengthMm)),
      );
      expect(svg.includes("twod-door-handle")).toBe(frontSystem.kind === "handled");
      expect(svg.includes("twod-gola-profile")).toBe(frontSystem.kind === "gola");
    }
  });

  it("elevation drawer fronts match production under gola", () => {
    const config = withFronts("drawer", GOLA);
    const fronts = createCabinetConstruction(config).parts.filter((part) => part.category === "DrawerFront");
    const svg = elevationSvg(config);
    expect(rectHeights(svg, "twod-drawer-front-edge").map(Math.round).sort()).toEqual(
      fronts.flatMap((part) => Array.from({ length: part.quantity }, () => part.lengthMm)).sort(),
    );
    expect(svg).not.toContain("twod-drawer-pull");
  });
});

describe("gola in 3D", () => {
  it("full-width profiles stop inside the sides and under the top panel", () => {
    const config = withFronts("base", GOLA);
    const { width, boardThickness } = config.dimensions;
    const panel = createCabinetGeometry(config).find((item) => item.name.startsWith("gola-l"))!;
    expect(panel.size[0] * 1000).toBeCloseTo(width - boardThickness * 2, 6);
    expect(panel.size[1] * 1000).toBeCloseTo(60 - boardThickness, 6);
  });
});
