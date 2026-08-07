import type { CabinetType } from "./cabinetCapabilities";
import {
  isStorageType,
  supportsDoors,
  supportsDrawers,
  supportsShelves,
  supportsToeKick,
  supportsWallPlacement,
} from "./cabinetCapabilities";
import { getFamilyOpeningRules } from "./cabinetFamilyRules";
import {
  collectOpeningLeaves,
  type OpeningLeaf,
} from "./cabinetOpeningStructure";
import type {
  CabinetConfig,
  CabinetPlacement,
  CabinetProject,
} from "./cabinetDimensions";
import {
  BOARD_MATERIALS,
  resolveCabinetMaterialSpec,
  type BoardMaterialId,
  type MaterialPresetId,
} from "./materialSystem";

export type ManufacturingSeverity = "info" | "warning" | "error";

export type ManufacturingRuleCode =
  | "FAMILY_WIDTH"
  | "FAMILY_HEIGHT"
  | "FAMILY_DEPTH"
  | "OPENING_WIDTH"
  | "OPENING_HEIGHT"
  | "OPENING_CONTENT"
  | "OPENING_LEAF_CLEARANCE"
  | "SHELF_SPAN"
  | "SHELF_SPACING"
  | "SHELF_DEPTH"
  | "DOOR_WIDTH"
  | "DOOR_STYLE"
  | "DRAWER_HEIGHT"
  | "DRAWER_DOOR_MIX"
  | "TOE_KICK_REQUIRED"
  | "TOE_KICK_FORBIDDEN"
  | "TOE_KICK_RANGE"
  | "MATERIAL_WET_ZONE"
  | "MATERIAL_SHELF_SPAN"
  | "WALL_ATTACHMENT"
  | "WALL_MOUNT_HEIGHT"
  | "WALL_BACK_REQUIRED";

export type ManufacturingIssue = {
  code: ManufacturingRuleCode;
  severity: ManufacturingSeverity;
  message: string;
  field?: string;
  autoFixed?: boolean;
};

export type ManufacturingRuleContext = {
  placement?: CabinetPlacement | null;
  roomHeightMm?: number;
};

export type FamilyDimensionLimits = {
  width: { min: number; max: number; preferredMin: number; preferredMax: number };
  height: { min: number; max: number; preferredMin: number; preferredMax: number };
  depth: { min: number; max: number; preferredMin: number; preferredMax: number };
};

const MIN_OPENING_WIDTH_MM = 120;
const MIN_OPENING_HEIGHT_MM = 180;
const MIN_SHELF_DEPTH_MM = 120;
const MIN_SHELF_SPACING_MM = 140;
const MIN_DRAWER_FRONT_HEIGHT_MM = 100;
const NARROW_DOOR_WIDTH_MM = 450;
const SINGLE_DOOR_MAX_WIDTH_MM = 600;
const DOUBLE_DOOR_MAX_WIDTH_MM = 1100;
const WALL_MOUNT_MIN_Y_MM = 1200;
const WALL_MOUNT_MAX_Y_MM = 1800;
const WALL_MOUNT_CLEARANCE_MM = 100;

/** Max unsupported shelf clear span (mm) by shelf thickness and board material. */
const SHELF_SPAN_LIMITS: Record<BoardMaterialId, Record<number, number>> = {
  ply: { 16: 700, 18: 800, 25: 1000 },
  hdhmr: { 16: 650, 18: 750, 25: 950 },
  mdf: { 16: 550, 18: 650, 25: 850 },
  particle: { 16: 450, 18: 550, 25: 700 },
};

export function getFamilyDimensionLimits(type: CabinetType): FamilyDimensionLimits {
  const global = {
    width: {
      min: 500,
      max: 1800,
      preferredMin: 500,
      preferredMax: 1800,
    },
    height: {
      min: 400,
      max: 2400,
      preferredMin: 400,
      preferredMax: 2400,
    },
    depth: {
      min: 300,
      max: 900,
      preferredMin: 300,
      preferredMax: 900,
    },
  };

  switch (type) {
    case "base":
      return {
        width: { min: 500, max: 1200, preferredMin: 600, preferredMax: 1000 },
        height: { min: 700, max: 900, preferredMin: 720, preferredMax: 860 },
        depth: { min: 500, max: 650, preferredMin: 540, preferredMax: 600 },
      };
    case "wall":
      return {
        width: { min: 500, max: 1200, preferredMin: 600, preferredMax: 1000 },
        height: { min: 400, max: 900, preferredMin: 600, preferredMax: 800 },
        depth: { min: 280, max: 400, preferredMin: 300, preferredMax: 350 },
      };
    case "tall":
    case "almirah":
      return {
        width: { min: 450, max: 900, preferredMin: 500, preferredMax: 750 },
        height: { min: 1800, max: 2400, preferredMin: 2000, preferredMax: 2200 },
        depth: { min: 500, max: 700, preferredMin: 560, preferredMax: 650 },
      };
    case "drawer":
      return {
        width: { min: 500, max: 1000, preferredMin: 600, preferredMax: 900 },
        height: { min: 500, max: 900, preferredMin: 700, preferredMax: 860 },
        depth: { min: 450, max: 650, preferredMin: 500, preferredMax: 600 },
      };
    case "sink":
      return {
        width: { min: 600, max: 1200, preferredMin: 800, preferredMax: 1000 },
        height: { min: 700, max: 900, preferredMin: 720, preferredMax: 860 },
        depth: { min: 500, max: 650, preferredMin: 560, preferredMax: 600 },
      };
    case "corner":
      return {
        width: { min: 800, max: 1200, preferredMin: 900, preferredMax: 1100 },
        height: { min: 700, max: 900, preferredMin: 720, preferredMax: 860 },
        depth: { min: 800, max: 1200, preferredMin: 900, preferredMax: 1100 },
      };
    case "open-shelf":
      return {
        width: { min: 500, max: 1200, preferredMin: 600, preferredMax: 1000 },
        height: { min: 600, max: 2100, preferredMin: 700, preferredMax: 1800 },
        depth: { min: 300, max: 450, preferredMin: 320, preferredMax: 400 },
      };
    default:
      return global;
  }
}

export function getMaxUnsupportedShelfSpanMm(
  thicknessMm: number,
  boardMaterialId: BoardMaterialId,
): number {
  const table = SHELF_SPAN_LIMITS[boardMaterialId] ?? SHELF_SPAN_LIMITS.mdf;
  const thicknesses = Object.keys(table)
    .map(Number)
    .sort((a, b) => a - b);
  let chosen = thicknesses[0];
  for (const thickness of thicknesses) {
    if (thicknessMm >= thickness) chosen = thickness;
  }
  return table[chosen] ?? 600;
}

function pushIssue(
  issues: ManufacturingIssue[],
  issue: ManufacturingIssue,
) {
  issues.push(issue);
}

function estimateLeafWidthMm(leaf: OpeningLeaf, openingWidthMm: number, siblingCount: number) {
  if (siblingCount <= 1) return openingWidthMm;
  return Math.max(40, openingWidthMm * (leaf.ratio || 1 / siblingCount));
}

function evaluateFamilyDimensions(
  config: CabinetConfig,
  issues: ManufacturingIssue[],
) {
  if (!isStorageType(config.type)) return;
  const limits = getFamilyDimensionLimits(config.type);
  const { width, height, depth } = config.dimensions;

  if (width < limits.width.min || width > limits.width.max) {
    pushIssue(issues, {
      code: "FAMILY_WIDTH",
      severity: "error",
      field: "width",
      message: `${config.type} width should be ${limits.width.min}–${limits.width.max} mm for production.`,
    });
  } else if (width < limits.width.preferredMin || width > limits.width.preferredMax) {
    pushIssue(issues, {
      code: "FAMILY_WIDTH",
      severity: "warning",
      field: "width",
      message: `${config.type} width ${width} mm is outside the preferred shop range ${limits.width.preferredMin}–${limits.width.preferredMax} mm.`,
    });
  }

  if (height < limits.height.min || height > limits.height.max) {
    pushIssue(issues, {
      code: "FAMILY_HEIGHT",
      severity: "error",
      field: "height",
      message: `${config.type} height should be ${limits.height.min}–${limits.height.max} mm for production.`,
    });
  } else if (height < limits.height.preferredMin || height > limits.height.preferredMax) {
    pushIssue(issues, {
      code: "FAMILY_HEIGHT",
      severity: "warning",
      field: "height",
      message: `${config.type} height ${height} mm is outside the preferred shop range ${limits.height.preferredMin}–${limits.height.preferredMax} mm.`,
    });
  }

  if (depth < limits.depth.min || depth > limits.depth.max) {
    pushIssue(issues, {
      code: "FAMILY_DEPTH",
      severity: "error",
      field: "depth",
      message: `${config.type} depth should be ${limits.depth.min}–${limits.depth.max} mm for production.`,
    });
  } else if (depth < limits.depth.preferredMin || depth > limits.depth.preferredMax) {
    pushIssue(issues, {
      code: "FAMILY_DEPTH",
      severity: "warning",
      field: "depth",
      message: `${config.type} depth ${depth} mm is outside the preferred shop range ${limits.depth.preferredMin}–${limits.depth.preferredMax} mm.`,
    });
  }
}

function evaluateOpenings(config: CabinetConfig, issues: ManufacturingIssue[]) {
  if (!isStorageType(config.type)) return;

  const { width, height, boardThickness } = config.dimensions;
  const toeKickHeight = supportsToeKick(config.type) ? config.toeKickHeight : 0;
  const openingWidth = width - boardThickness * 2;
  const openingHeight = height - boardThickness * 2 - toeKickHeight;
  const rules = getFamilyOpeningRules(config.type);

  if (openingWidth < MIN_OPENING_WIDTH_MM) {
    pushIssue(issues, {
      code: "OPENING_WIDTH",
      severity: "error",
      field: "width",
      message: `Internal width ${Math.round(openingWidth)} mm is below the ${MIN_OPENING_WIDTH_MM} mm manufacturing minimum.`,
    });
  }

  if (openingHeight < MIN_OPENING_HEIGHT_MM) {
    pushIssue(issues, {
      code: "OPENING_HEIGHT",
      severity: "error",
      field: "height",
      message: `Internal height ${Math.round(openingHeight)} mm is below the ${MIN_OPENING_HEIGHT_MM} mm manufacturing minimum.`,
    });
  }

  const root = config.composition?.openingStructure?.root;
  if (!root || !rules.supportsOpenings) return;

  const leaves = collectOpeningLeaves(root);
  for (const leaf of leaves) {
    if (!rules.allowedContentTypes.includes(leaf.contentType)) {
      pushIssue(issues, {
        code: "OPENING_CONTENT",
        severity: "error",
        field: "openings",
        message: `${leaf.label || "Opening"} uses ${leaf.contentType}, which is not allowed on ${config.type} cabinets.`,
      });
    }

    if (leaf.contentType === "drawer-stack" || leaf.contentType === "door") {
      const leafWidth = estimateLeafWidthMm(leaf, openingWidth, leaves.length);
      if (leafWidth < MIN_OPENING_WIDTH_MM) {
        pushIssue(issues, {
          code: "OPENING_LEAF_CLEARANCE",
          severity: "warning",
          field: "openings",
          message: `${leaf.label || "Opening"} clear width is tight at about ${Math.round(leafWidth)} mm.`,
        });
      }
    }

    if (config.type === "sink" && leaf.contentType === "drawer-stack") {
      pushIssue(issues, {
        code: "OPENING_CONTENT",
        severity: "warning",
        field: "openings",
        message: "Sink cabinets usually keep the bowl bay free of drawer stacks.",
      });
    }
  }
}

function evaluateShelfRules(config: CabinetConfig, issues: ManufacturingIssue[]) {
  if (!supportsShelves(config.type) || config.shelfCount <= 0) return;

  const { width, height, depth, boardThickness, backPanelThickness } = config.dimensions;
  const toeKickHeight = supportsToeKick(config.type) ? config.toeKickHeight : 0;
  const openingWidth = width - boardThickness * 2;
  const openingHeight = Math.max(1, height - boardThickness * 2 - toeKickHeight);
  const shelfDepth = depth - backPanelThickness - 30;
  const materialSpec = resolveCabinetMaterialSpec(config.buildRules);
  const shelfThickness = materialSpec.shelfMaterial.thicknessMm;
  const boardId = materialSpec.shelfMaterial.boardMaterialId;
  const maxSpan = getMaxUnsupportedShelfSpanMm(shelfThickness, boardId);
  const dividerCount = config.composition?.dividers?.count ?? 0;
  const unsupportedSpan =
    dividerCount > 0 ? openingWidth / (dividerCount + 1) : openingWidth;

  if (shelfDepth < MIN_SHELF_DEPTH_MM) {
    pushIssue(issues, {
      code: "SHELF_DEPTH",
      severity: "warning",
      field: "depth",
      message: `Usable shelf depth ${Math.round(shelfDepth)} mm is below ${MIN_SHELF_DEPTH_MM} mm.`,
    });
  }

  const spacing = openingHeight / (config.shelfCount + 1);
  if (spacing < MIN_SHELF_SPACING_MM) {
    pushIssue(issues, {
      code: "SHELF_SPACING",
      severity: "warning",
      field: "shelfCount",
      message: `Shelf spacing ~${Math.round(spacing)} mm is tight; reduce shelves or increase height.`,
    });
  }

  if (unsupportedSpan > maxSpan) {
    pushIssue(issues, {
      code: "SHELF_SPAN",
      severity: "error",
      field: "width",
      message: `Unsupported shelf span ${Math.round(unsupportedSpan)} mm exceeds ${maxSpan} mm for ${shelfThickness} mm ${boardId}. Add a divider or thicker shelf.`,
    });
  } else if (unsupportedSpan > maxSpan * 0.9) {
    pushIssue(issues, {
      code: "MATERIAL_SHELF_SPAN",
      severity: "warning",
      field: "width",
      message: `Shelf span ${Math.round(unsupportedSpan)} mm is near the ${maxSpan} mm limit for ${boardId}.`,
    });
  }
}

function evaluateDoorDrawerRules(config: CabinetConfig, issues: ManufacturingIssue[]) {
  const { width, height, boardThickness } = config.dimensions;
  const toeKickHeight = supportsToeKick(config.type) ? config.toeKickHeight : 0;
  const openingHeight = Math.max(1, height - boardThickness * 2 - toeKickHeight);
  const hasDoors = Boolean(config.hasDoors) && supportsDoors(config.type);
  const drawerCount = supportsDrawers(config.type) ? config.drawerCount ?? 0 : 0;
  const doorStyle = config.composition?.doors?.style ?? (width < SINGLE_DOOR_MAX_WIDTH_MM ? "single" : "double");

  if (!supportsDoors(config.type) && config.hasDoors) {
    pushIssue(issues, {
      code: "DRAWER_DOOR_MIX",
      severity: "error",
      field: "hasDoors",
      message: `${config.type} cabinets cannot use doors in production layouts.`,
    });
  }

  if (!supportsDrawers(config.type) && (config.drawerCount ?? 0) > 0) {
    pushIssue(issues, {
      code: "DRAWER_DOOR_MIX",
      severity: "error",
      field: "drawerCount",
      message: `${config.type} cabinets cannot use drawer stacks.`,
    });
  }

  if (hasDoors && width < NARROW_DOOR_WIDTH_MM) {
    pushIssue(issues, {
      code: "DOOR_WIDTH",
      severity: "warning",
      field: "width",
      message: `Doors are narrow below ${NARROW_DOOR_WIDTH_MM} mm clear cabinet width.`,
    });
  }

  if (hasDoors && doorStyle === "double" && width < SINGLE_DOOR_MAX_WIDTH_MM) {
    pushIssue(issues, {
      code: "DOOR_STYLE",
      severity: "warning",
      field: "doors",
      message: `Double doors are usually switched to single below ${SINGLE_DOOR_MAX_WIDTH_MM} mm.`,
    });
  }

  if (hasDoors && doorStyle === "single" && width > DOUBLE_DOOR_MAX_WIDTH_MM) {
    pushIssue(issues, {
      code: "DOOR_STYLE",
      severity: "warning",
      field: "doors",
      message: `Single doors become heavy above ${DOUBLE_DOOR_MAX_WIDTH_MM} mm; prefer double or split bays.`,
    });
  }

  if (drawerCount > 0) {
    const frontHeight = openingHeight / drawerCount;
    if (frontHeight < MIN_DRAWER_FRONT_HEIGHT_MM) {
      pushIssue(issues, {
        code: "DRAWER_HEIGHT",
        severity: "error",
        field: "drawerCount",
        message: `Drawer fronts average ~${Math.round(frontHeight)} mm; keep at least ${MIN_DRAWER_FRONT_HEIGHT_MM} mm per drawer.`,
      });
    }
  }

  if (config.type === "drawer" && hasDoors) {
    pushIssue(issues, {
      code: "DRAWER_DOOR_MIX",
      severity: "error",
      field: "hasDoors",
      message: "Drawer banks should not also carry hinged doors.",
    });
  }

  if (hasDoors && drawerCount > 0 && config.type === "base") {
    // Mixed fronts are allowed on base via openings, but warn when flat fields imply both full-face.
    const leaves = config.composition?.openingStructure
      ? collectOpeningLeaves(config.composition.openingStructure.root)
      : [];
    const hasDoorLeaf = leaves.some((leaf) => leaf.contentType === "door");
    const hasDrawerLeaf = leaves.some((leaf) => leaf.contentType === "drawer-stack");
    if (!hasDoorLeaf || !hasDrawerLeaf) {
      pushIssue(issues, {
        code: "DRAWER_DOOR_MIX",
        severity: "info",
        field: "openings",
        message: "Mixed door and drawer fronts should be expressed as split openings for clear shop docs.",
      });
    }
  }
}

function evaluateToeKickRules(config: CabinetConfig, issues: ManufacturingIssue[]) {
  const family = getFamilyOpeningRules(config.type);
  const hasToeKickSupport = supportsToeKick(config.type);
  const height = config.toeKickHeight;
  const inset = config.toeKickInset;

  if (!hasToeKickSupport && height > 0) {
    pushIssue(issues, {
      code: "TOE_KICK_FORBIDDEN",
      severity: "error",
      field: "toeKickHeight",
      message: `${config.type} cabinets should not have a toe kick.`,
    });
  }

  if (hasToeKickSupport && family.defaultToeKick && height <= 0) {
    pushIssue(issues, {
      code: "TOE_KICK_REQUIRED",
      severity: "warning",
      field: "toeKickHeight",
      message: `${config.type} cabinets normally need a toe kick for floor clearance.`,
    });
  }

  if (hasToeKickSupport && height > 0) {
    if (height < 80 || height > 180) {
      pushIssue(issues, {
        code: "TOE_KICK_RANGE",
        severity: "error",
        field: "toeKickHeight",
        message: "Toe kick height should stay between 80 and 180 mm.",
      });
    }
    if (inset < 20 || inset > 120) {
      pushIssue(issues, {
        code: "TOE_KICK_RANGE",
        severity: "warning",
        field: "toeKickInset",
        message: "Toe kick inset should stay between 20 and 120 mm.",
      });
    }
  }
}

function evaluateMaterialRules(config: CabinetConfig, issues: ManufacturingIssue[]) {
  if (!isStorageType(config.type)) return;
  const materialSpec = resolveCabinetMaterialSpec(config.buildRules);
  const carcassId = materialSpec.carcassMaterial.boardMaterialId;
  const carcass = BOARD_MATERIALS.find((material) => material.id === carcassId);

  if (config.type === "sink" && carcass && !carcass.moistureResistant) {
    pushIssue(issues, {
      code: "MATERIAL_WET_ZONE",
      severity: "error",
      field: "material",
      message: `Sink cabinets should use moisture-resistant carcass board (current: ${carcass.label}).`,
    });
  }

  if (
    (config.type === "base" || config.type === "tall") &&
    carcassId === "particle" &&
    config.dimensions.width > 800
  ) {
    pushIssue(issues, {
      code: "MATERIAL_SHELF_SPAN",
      severity: "warning",
      field: "material",
      message: "Wide particle-board carcasses benefit from dividers or upgrading to HDHMR/ply.",
    });
  }
}

function evaluateWallMountRules(
  config: CabinetConfig,
  context: ManufacturingRuleContext | undefined,
  issues: ManufacturingIssue[],
) {
  const placement = context?.placement;
  if (!placement) return;

  if (supportsWallPlacement(config.type)) {
    if (placement.attachment === "floor") {
      pushIssue(issues, {
        code: "WALL_ATTACHMENT",
        severity: "error",
        field: "attachment",
        message: `${config.type} units must be wall-mounted, not floor-standing.`,
      });
    }

    if (config.type === "wall" && config.dimensions.backPanelThickness < 6) {
      pushIssue(issues, {
        code: "WALL_BACK_REQUIRED",
        severity: "warning",
        field: "backPanelThickness",
        message: "Wall cabinets should keep at least a 6 mm structural back for hanging.",
      });
    }

    const minY = WALL_MOUNT_MIN_Y_MM;
    const maxY = Math.min(
      WALL_MOUNT_MAX_Y_MM,
      (context?.roomHeightMm ?? 2800) - config.dimensions.height - WALL_MOUNT_CLEARANCE_MM,
    );
    if (placement.y < minY || placement.y > maxY) {
      pushIssue(issues, {
        code: "WALL_MOUNT_HEIGHT",
        severity: "warning",
        field: "placementY",
        message: `Wall-mount bottom at ${Math.round(placement.y)} mm is outside the practical band ${minY}–${Math.round(maxY)} mm.`,
      });
    }
  } else if (
    isStorageType(config.type) &&
    placement.attachment !== "floor" &&
    config.type !== "mirror"
  ) {
    pushIssue(issues, {
      code: "WALL_ATTACHMENT",
      severity: "warning",
      field: "attachment",
      message: `${config.type} cabinets are normally floor-standing with a toe kick.`,
    });
  }
}

export function evaluateCabinetRules(
  config: CabinetConfig,
  context?: ManufacturingRuleContext,
): ManufacturingIssue[] {
  const issues: ManufacturingIssue[] = [];
  evaluateFamilyDimensions(config, issues);
  evaluateOpenings(config, issues);
  evaluateShelfRules(config, issues);
  evaluateDoorDrawerRules(config, issues);
  evaluateToeKickRules(config, issues);
  evaluateMaterialRules(config, issues);
  evaluateWallMountRules(config, context, issues);

  if (!isStorageType(config.type)) {
    if (config.dimensions.width < 400 || config.dimensions.depth < 300) {
      pushIssue(issues, {
        code: "FAMILY_WIDTH",
        severity: "warning",
        message: "This furniture piece is getting compact for comfortable use.",
      });
    }
    if (config.dimensions.height > 2200) {
      pushIssue(issues, {
        code: "WALL_MOUNT_HEIGHT",
        severity: "info",
        message: "Tall freestanding pieces may need wall fixing in a real room.",
      });
    }
  }

  return issues;
}

export function evaluateProjectRules(project: CabinetProject): ManufacturingIssue[] {
  return project.cabinets.flatMap((cabinet) =>
    evaluateCabinetRules(cabinet.config, { placement: cabinet.placement }).map((issue) => ({
      ...issue,
      message: `${cabinet.name}: ${issue.message}`,
    })),
  );
}

export function formatManufacturingIssues(
  issues: ManufacturingIssue[],
  options?: { includeInfo?: boolean },
): string[] {
  const includeInfo = options?.includeInfo ?? false;
  return issues
    .filter((issue) => includeInfo || issue.severity !== "info")
    .filter((issue) => !issue.autoFixed)
    .map((issue) => {
      const prefix =
        issue.severity === "error" ? "Error" : issue.severity === "warning" ? "Warning" : "Note";
      return `${prefix}: ${issue.message}`;
    });
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function maxDrawersForHeight(openingHeightMm: number) {
  return Math.max(1, Math.floor(openingHeightMm / MIN_DRAWER_FRONT_HEIGHT_MM));
}

/**
 * Safe production auto-corrections applied before the normal clamp pipeline.
 * Only adjusts clearly illegal family/material combinations.
 */
export function applyManufacturingFixes(config: CabinetConfig): {
  config: CabinetConfig;
  fixes: ManufacturingIssue[];
} {
  const fixes: ManufacturingIssue[] = [];
  let next: CabinetConfig = {
    ...config,
    dimensions: { ...config.dimensions },
    buildRules: { ...(config.buildRules ?? {}) },
  };

  const limits = getFamilyDimensionLimits(next.type);

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

  if (supportsShelves(next.type) && next.shelfCount > 0) {
    const openingHeight = Math.max(
      1,
      next.dimensions.height -
        next.dimensions.boardThickness * 2 -
        (supportsToeKick(next.type) ? next.toeKickHeight : 0),
    );
    const maxShelves = Math.max(0, Math.floor(openingHeight / MIN_SHELF_SPACING_MM) - 1);
    if (next.shelfCount > maxShelves) {
      next = { ...next, shelfCount: maxShelves };
      fixes.push({
        code: "SHELF_SPACING",
        severity: "info",
        autoFixed: true,
        message: `Reduced shelf count to ${maxShelves} for workable spacing.`,
      });
    }
  }

  if (supportsDrawers(next.type) && (next.drawerCount ?? 0) > 0) {
    const openingHeight = Math.max(
      1,
      next.dimensions.height -
        next.dimensions.boardThickness * 2 -
        (supportsToeKick(next.type) ? next.toeKickHeight : 0),
    );
    const maxDrawers = maxDrawersForHeight(openingHeight);
    if ((next.drawerCount ?? 0) > maxDrawers) {
      next = { ...next, drawerCount: maxDrawers };
      fixes.push({
        code: "DRAWER_HEIGHT",
        severity: "info",
        autoFixed: true,
        message: `Reduced drawer count to ${maxDrawers} for workable front heights.`,
      });
    }
  }

  if (next.type === "sink") {
    const materialSpec = resolveCabinetMaterialSpec(next.buildRules);
    const carcass = BOARD_MATERIALS.find(
      (material) => material.id === materialSpec.carcassMaterial.boardMaterialId,
    );
    if (carcass && !carcass.moistureResistant) {
      const wetPreset: MaterialPresetId = "ply-premium";
      next = {
        ...next,
        buildRules: {
          ...next.buildRules,
          materialPresetId: wetPreset,
        },
      };
      fixes.push({
        code: "MATERIAL_WET_ZONE",
        severity: "info",
        autoFixed: true,
        message: "Switched sink cabinet material preset to moisture-resistant plywood.",
      });
    }
  }

  // Shelf span: auto-add a center divider when span clearly exceeds material limit.
  if (supportsShelves(next.type) && next.shelfCount > 0) {
    const materialSpec = resolveCabinetMaterialSpec(next.buildRules);
    const openingWidth = next.dimensions.width - next.dimensions.boardThickness * 2;
    const dividerCount = next.composition?.dividers?.count ?? 0;
    const unsupportedSpan =
      dividerCount > 0 ? openingWidth / (dividerCount + 1) : openingWidth;
    const maxSpan = getMaxUnsupportedShelfSpanMm(
      materialSpec.shelfMaterial.thicknessMm,
      materialSpec.shelfMaterial.boardMaterialId,
    );
    if (unsupportedSpan > maxSpan && dividerCount < 1 && next.type !== "corner") {
      next = {
        ...next,
        composition: next.composition
          ? {
              ...next.composition,
              dividers: {
                ...next.composition.dividers,
                count: 1,
              },
            }
          : next.composition,
      };
      fixes.push({
        code: "SHELF_SPAN",
        severity: "info",
        autoFixed: true,
        message: "Added a center divider to bring shelf span within material limits.",
      });
    }
  }

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

export function getMinDividersForShelfSpan(config: CabinetConfig): number {
  if (!supportsShelves(config.type) || config.shelfCount <= 0 || config.type === "corner") {
    return 0;
  }
  const materialSpec = resolveCabinetMaterialSpec(config.buildRules);
  const openingWidth = config.dimensions.width - config.dimensions.boardThickness * 2;
  const current = config.composition?.dividers?.count ?? 0;
  const unsupportedSpan = current > 0 ? openingWidth / (current + 1) : openingWidth;
  const maxSpan = getMaxUnsupportedShelfSpanMm(
    materialSpec.shelfMaterial.thicknessMm,
    materialSpec.shelfMaterial.boardMaterialId,
  );
  if (unsupportedSpan > maxSpan) {
    return Math.max(1, current);
  }
  return current;
}
