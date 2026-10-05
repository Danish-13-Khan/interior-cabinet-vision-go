import { describe, expect, it } from "vitest";
import { clampCabinetConfig, getDefaultCabinetConfig, type CabinetConfig, type CabinetInstance, type CabinetType } from "../cabinetDimensions";
import { normalizeConstructionSpec } from "../cabinetConstructionSpec";
import { createCabinetGeometry, isFrontLeafPanel } from "../cabinetGeometry";
import { DEFAULT_COSTING_SETTINGS } from "../costingSettings";
import { defaultGolaProfiles, type FrontSystem } from "../frontSystem";
import { buildHardwareLines, createHardwareSchedule } from "../hardwareSystem";
import { createCabinetConstruction } from "./createConstruction";
import { resolveFrontGaps } from "./frontGaps";

const GOLA: FrontSystem = { kind: "gola", profiles: defaultGolaProfiles() };

function withFronts(type: CabinetType, frontSystem: FrontSystem): CabinetConfig {
  const config = getDefaultCabinetConfig(type);
  return clampCabinetConfig({ ...config, construction: { ...normalizeConstructionSpec(type, config.construction), frontSystem } });
}

const leafHeights = (config: CabinetConfig) => resolveFrontGaps(config).openings.flatMap((entry) => entry.leaves.map((leaf) => leaf.heightMm));
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

function cabinet(id: string, config: CabinetConfig): CabinetInstance {
  return { id, name: id, config, placement: { x: 0, y: 0, z: 0, rotation: 0, attachment: "floor" } };
}

describe("gola fronts", () => {
  it("base door loses the L profile height at the top", () => {
    const handled = leafHeights(withFronts("base", { kind: "handled" }));
    const gola = resolveFrontGaps(withFronts("base", GOLA));
    expect(gola.openings[0]!.leaves.map((leaf) => leaf.heightMm)).toEqual(handled.map((height) => height - 60));
    expect(gola.profiles.map((band) => band.kind)).toEqual(["L"]);
  });

  it("drawer bank: L on top and a 74 mm C between each pair of drawers", () => {
    const handledConfig = withFronts("drawer", { kind: "handled" });
    const config = withFronts("drawer", GOLA);
    const { profiles, gaps } = resolveFrontGaps(config);
    const count = leafHeights(config).length;
    expect(count).toBeGreaterThan(1);
    expect(profiles.filter((band) => band.kind === "C")).toHaveLength(count - 1);
    expect(sum(leafHeights(handledConfig)) - sum(leafHeights(config))).toBeCloseTo(60 + (count - 1) * (74 - gaps.centerMm), 6);
  });

  it("wall unit takes the slim profile along the bottom edge", () => {
    const { openings, profiles } = resolveFrontGaps(withFronts("wall", GOLA));
    expect(openings[0]!.leaves[0]!.yMm).toBe(23);
    expect(profiles).toEqual([expect.objectContaining({ kind: "wall", yMm: 0, heightMm: 23, depthMm: 23 })]);
  });

  it("3D fronts still equal production parts, and 3D draws the profiles", () => {
    for (const type of ["base", "drawer", "wall", "sink"] as CabinetType[]) {
      const config = withFronts(type, GOLA);
      const parts = createCabinetConstruction(config).parts
        .filter((part) => part.category === "Door" || part.category === "DrawerFront")
        .flatMap((part) => Array.from({ length: part.quantity }, () => `${part.lengthMm}x${part.widthMm}`)).sort();
      const panels = createCabinetGeometry(config);
      const fronts = panels.filter(isFrontLeafPanel)
        .map((panel) => `${Math.round(Number((panel.size[1] * 1000).toFixed(6)))}x${Math.round(Number((panel.size[0] * 1000).toFixed(6)))}`).sort();
      expect(fronts).toEqual(parts);
      expect(panels.filter((panel) => panel.name.startsWith("gola-"))).toHaveLength(resolveFrontGaps(config).profiles.length);
    }
  });

  it("switching back to handles restores the original parts exactly", () => {
    const original = createCabinetConstruction(getDefaultCabinetConfig("drawer")).parts;
    expect(createCabinetConstruction(withFronts("drawer", { kind: "handled" })).parts).toEqual(original);
    expect(createCabinetConstruction(withFronts("drawer", GOLA)).parts).not.toEqual(original);
  });

  it("notes the profile notch on both carcass sides", () => {
    const parts = createCabinetConstruction(withFronts("base", GOLA)).parts;
    expect(parts.find((part) => part.id === "left-side")?.notes).toContain("Gola notch: L 60×27 mm");
    expect(parts.find((part) => part.id === "right-side")?.notes).toContain("Gola notch");
  });

  it("hardware: no handles, run-length metres of profile in the schedule", () => {
    const run = ["a", "b", "c"].map((id) => cabinet(id, withFronts("base", GOLA)));
    const lines = new Map(run.map((item) => [item.id, buildHardwareLines(item, createCabinetConstruction(item.config), DEFAULT_COSTING_SETTINGS)]));
    expect([...lines.values()].flat().some((line) => line.kind === "handle")).toBe(false);
    const width = run[0]!.config.dimensions.width / 1000;
    const profile = createHardwareSchedule(run, lines).project.find((row) => row.hardwareId === "gola-l");
    expect(profile?.quantity).toBeCloseTo(width * 3, 6);
    expect(profile?.kind).toBe("profile");
  });
});
