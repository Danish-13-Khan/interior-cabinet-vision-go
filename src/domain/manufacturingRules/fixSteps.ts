import {
  isStorageType,
  supportsDoors,
  supportsDrawers,
  supportsToeKick,
} from "../cabinetCapabilities";
import { getFamilyOpeningRules } from "../cabinetFamilyRules";
import type { CabinetConfig } from "../cabinetDimensions";
import { getCabinetDimensionLimits } from "./slidingLimits";
import type { ManufacturingIssue } from "./types";
import { SINGLE_DOOR_MAX_WIDTH_MM } from "./limits";

/** One auto-fix stage: returns the corrected config and appends what it changed to `fixes`. */
export type FixStep = (config: CabinetConfig, fixes: ManufacturingIssue[]) => CabinetConfig;

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Storage carcasses into their family production limits. */
export const fixFamilySize: FixStep = (config, fixes) => {
  const next = { ...config };
  const limits = getCabinetDimensionLimits(next);
  if (isStorageType(next.type)) {
    const before = { ...next.dimensions };
    next.dimensions = {
      ...next.dimensions,
      width: clampNumber(next.dimensions.width, limits.width.min, limits.width.max),
      height: clampNumber(next.dimensions.height, limits.height.min, limits.height.max),
      depth: clampNumber(next.dimensions.depth, limits.depth.min, limits.depth.max),
    };
    if (
      before.width !== next.dimensions.width ||
      before.height !== next.dimensions.height ||
      before.depth !== next.dimensions.depth
    ) {
      fixes.push({
        code: "FAMILY_WIDTH",
        severity: "info",
        autoFixed: true,
        message: `Adjusted ${next.type} size into production limits ${limits.width.min}–${limits.width.max} × ${limits.height.min}–${limits.height.max} × ${limits.depth.min}–${limits.depth.max} mm.`,
      });
    }
  }
  return next;
};

/** Toe kick removed where the family forbids it, restored where it is required. */
export const fixToeKick: FixStep = (config, fixes) => {
  let next = config;
  if (!supportsToeKick(next.type) && next.toeKickHeight > 0) {
    next = { ...next, toeKickHeight: 0, toeKickInset: 0 };
    fixes.push({
      code: "TOE_KICK_FORBIDDEN",
      severity: "info",
      autoFixed: true,
      message: `Removed toe kick from ${next.type} cabinet.`,
    });
  }

  if (supportsToeKick(next.type) && getFamilyOpeningRules(next.type).defaultToeKick && next.toeKickHeight <= 0) {
    next = { ...next, toeKickHeight: 100, toeKickInset: next.toeKickInset || 60 };
    fixes.push({
      code: "TOE_KICK_REQUIRED",
      severity: "info",
      autoFixed: true,
      message: "Restored a standard 100 mm toe kick.",
    });
  }
  return next;
};

/** Doors / drawers only where the family supports them; narrow double doors become single. */
export const fixDoorsAndDrawers: FixStep = (config, fixes) => {
  let next = config;
  if (!supportsDoors(next.type) && next.hasDoors) {
    next = { ...next, hasDoors: false };
    fixes.push({
      code: "DRAWER_DOOR_MIX",
      severity: "info",
      autoFixed: true,
      message: `Disabled doors on ${next.type} cabinet.`,
    });
  }

  if (!supportsDrawers(next.type) && (next.drawerCount ?? 0) > 0) {
    next = { ...next, drawerCount: 0 };
    fixes.push({
      code: "DRAWER_DOOR_MIX",
      severity: "info",
      autoFixed: true,
      message: `Cleared drawers from ${next.type} cabinet.`,
    });
  }

  if (supportsDoors(next.type) && next.hasDoors) {
    const style = next.composition?.doors?.style;
    if (style === "double" && next.dimensions.width < SINGLE_DOOR_MAX_WIDTH_MM) {
      next = {
        ...next,
        composition: next.composition
          ? {
              ...next.composition,
              doors: { ...next.composition.doors, style: "single", count: 1 },
            }
          : next.composition,
      };
      fixes.push({
        code: "DOOR_STYLE",
        severity: "info",
        autoFixed: true,
        message: "Switched double doors to single for narrow width.",
      });
    }
  }
  return next;
};
