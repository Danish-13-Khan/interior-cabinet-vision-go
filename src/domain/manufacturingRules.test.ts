import { describe, expect, it } from "vitest";
import {
  clampCabinetConfig,
  clampCabinetProject,
  getCabinetValidationMessages,
  getDefaultCabinetConfig,
  type CabinetProject,
} from "./cabinetDimensions";
import {
  applyManufacturingFixes,
  applyWallMountPlacementFix,
  evaluateCabinetRules,
  getFamilyDimensionLimits,
  getMaxUnsupportedShelfSpanMm,
  getMinDividersForShelfSpan,
} from "./manufacturingRules";

describe("manufacturing rules engine", () => {
  it("exposes family-specific dimension limits", () => {
    const wall = getFamilyDimensionLimits("wall");
    const tall = getFamilyDimensionLimits("tall");
    expect(wall.depth.max).toBeLessThanOrEqual(400);
    expect(tall.height.min).toBeGreaterThanOrEqual(1800);
  });

  it("flags and auto-corrects wall cabinets with toe kick and floor attachment", () => {
    const fixed = applyManufacturingFixes({
      ...getDefaultCabinetConfig("wall"),
      toeKickHeight: 100,
      toeKickInset: 60,
    });
    expect(fixed.config.toeKickHeight).toBe(0);
    expect(fixed.fixes.some((fix) => fix.code === "TOE_KICK_FORBIDDEN")).toBe(true);

    const placement = applyWallMountPlacementFix("wall", {
      x: 0,
      y: 0,
      z: 0,
      rotation: 0,
      attachment: "floor",
    });
    expect(placement.placement.attachment).toBe("back-wall");
    expect(placement.placement.y).toBeGreaterThanOrEqual(1200);
  });

  it("rejects non-moisture-resistant sink carcass materials and auto-upgrades", () => {
    const result = applyManufacturingFixes({
      ...getDefaultCabinetConfig("sink"),
      buildRules: {
        materialPresetId: "particle-economy",
        carcassThicknessMm: 18,
        backPanelThicknessMm: 6,
        shelfThicknessMm: 18,
        drawerBoxThicknessMm: 12,
        finishId: "laminate",
        edgeBandingId: "pvc-0.5mm",
        grainDirection: "lengthwise",
        backPanelType: "screwed",
      },
    });
    expect(result.config.buildRules?.materialPresetId).toBe("ply-premium");

    const issues = evaluateCabinetRules({
      ...getDefaultCabinetConfig("sink"),
      buildRules: {
        materialPresetId: "particle-economy",
        carcassThicknessMm: 18,
        backPanelThicknessMm: 6,
        shelfThicknessMm: 18,
        drawerBoxThicknessMm: 12,
        finishId: "laminate",
        edgeBandingId: "pvc-0.5mm",
        grainDirection: "lengthwise",
        backPanelType: "screwed",
      },
    });
    expect(issues.some((issue) => issue.code === "MATERIAL_WET_ZONE")).toBe(true);
  });

  it("enforces shelf span limits and requests dividers", () => {
    expect(getMaxUnsupportedShelfSpanMm(18, "particle")).toBeLessThan(
      getMaxUnsupportedShelfSpanMm(18, "ply"),
    );

    const wide = clampCabinetConfig({
      ...getDefaultCabinetConfig("base"),
      dimensions: {
        ...getDefaultCabinetConfig("base").dimensions,
        width: 1200,
      },
      shelfCount: 2,
      buildRules: {
        materialPresetId: "particle-economy",
        carcassThicknessMm: 18,
        backPanelThicknessMm: 6,
        shelfThicknessMm: 18,
        drawerBoxThicknessMm: 12,
        finishId: "laminate",
        edgeBandingId: "pvc-0.5mm",
        grainDirection: "lengthwise",
        backPanelType: "screwed",
      },
      composition: undefined,
    });

    expect(getMinDividersForShelfSpan(wide)).toBeGreaterThanOrEqual(0);
    expect(wide.composition?.dividers.count ?? 0).toBeGreaterThanOrEqual(1);
  });

  it("disables doors on drawer banks and reduces overcrowded drawers", () => {
    const fixed = applyManufacturingFixes({
      ...getDefaultCabinetConfig("drawer"),
      hasDoors: true,
      drawerCount: 8,
      dimensions: {
        ...getDefaultCabinetConfig("drawer").dimensions,
        height: 500,
      },
    });
    expect(fixed.config.hasDoors).toBe(false);
    expect(fixed.config.drawerCount ?? 0).toBeLessThan(8);
  });

  it("surfaces manufacturing messages through validation helper", () => {
    const messages = getCabinetValidationMessages(
      {
        ...getDefaultCabinetConfig("wall"),
      },
      {
        x: 0,
        y: 400,
        z: 0,
        rotation: 0,
        attachment: "floor",
      },
      2800,
    );
    expect(messages.some((message) => message.includes("wall-mounted") || message.includes("Wall"))).toBe(
      true,
    );
  });

  it("keeps clamped projects production-safe for default cabinets", () => {
    const project: CabinetProject = {
      version: 1,
      cabinets: [
        {
          id: "1",
          name: "Base",
          placement: { x: 0, y: 0, z: 0, rotation: 0, attachment: "floor" },
          config: getDefaultCabinetConfig("base"),
        },
        {
          id: "2",
          name: "Wall",
          placement: { x: 1000, y: 0, z: 0, rotation: 0, attachment: "floor" },
          config: getDefaultCabinetConfig("wall"),
        },
      ],
    };
    const clamped = clampCabinetProject(project);
    expect(clamped.cabinets[0].config.toeKickHeight).toBeGreaterThan(0);
    expect(clamped.cabinets[1].placement.attachment).toBe("back-wall");
    expect(clamped.cabinets[1].config.toeKickHeight).toBe(0);

    const baseIssues = evaluateCabinetRules(clamped.cabinets[0].config, {
      placement: clamped.cabinets[0].placement,
    }).filter((issue) => issue.severity === "error");
    expect(baseIssues).toHaveLength(0);
  });
});
