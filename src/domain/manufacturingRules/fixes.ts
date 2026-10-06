import type { CabinetType } from "../cabinetCapabilities";
import { supportsWallPlacement } from "../cabinetCapabilities";
import type { CabinetConfig, CabinetPlacement } from "../cabinetDimensions";
import type { ManufacturingIssue } from "./types";
import { WALL_MOUNT_MAX_Y_MM, WALL_MOUNT_MIN_Y_MM } from "./limits";
import { clampNumber, fixDoorsAndDrawers, fixFamilySize, fixToeKick, type FixStep } from "./fixSteps";
import { fixShelfAndDrawerCounts, fixShelfSpan, fixWetZoneMaterial } from "./fixStepsCapacity";

export { getMinDividersForShelfSpan } from "./shelfSpan";

/** Order matters: sizes first, then capability cleanup, counts, material and shelf span. */
const FIX_STEPS: readonly FixStep[] = [
  fixFamilySize,
  fixToeKick,
  fixDoorsAndDrawers,
  fixShelfAndDrawerCounts,
  fixWetZoneMaterial,
  fixShelfSpan,
];

/**
 * Safe production auto-corrections applied before the normal clamp pipeline.
 * Only adjusts clearly illegal family/material combinations.
 */
export function applyManufacturingFixes(config: CabinetConfig): {
  config: CabinetConfig;
  fixes: ManufacturingIssue[];
} {
  const fixes: ManufacturingIssue[] = [];
  const start: CabinetConfig = {
    ...config,
    dimensions: { ...config.dimensions },
    buildRules: { ...(config.buildRules ?? {}) },
  };
  const next = FIX_STEPS.reduce((current, step) => step(current, fixes), start);
  return { config: next, fixes };
}

export function applyWallMountPlacementFix(
  type: CabinetType,
  placement: CabinetPlacement,
): { placement: CabinetPlacement; fixes: ManufacturingIssue[] } {
  const fixes: ManufacturingIssue[] = [];
  let next = { ...placement };

  if (supportsWallPlacement(type) && next.attachment === "floor") {
    next = {
      ...next,
      attachment: "back-wall",
      y: next.y > 0 ? next.y : type === "mirror" ? 300 : 1400,
    };
    fixes.push({
      code: "WALL_ATTACHMENT",
      severity: "info",
      autoFixed: true,
      message: `Set ${type} attachment to back-wall mounting.`,
    });
  }

  if (supportsWallPlacement(type)) {
    const clampedY = clampNumber(next.y, WALL_MOUNT_MIN_Y_MM, WALL_MOUNT_MAX_Y_MM);
    if (clampedY !== next.y) {
      next = { ...next, y: clampedY };
      fixes.push({
        code: "WALL_MOUNT_HEIGHT",
        severity: "info",
        autoFixed: true,
        message: `Adjusted wall-mount height into ${WALL_MOUNT_MIN_Y_MM}–${WALL_MOUNT_MAX_Y_MM} mm.`,
      });
    }
  }

  return { placement: next, fixes };
}
