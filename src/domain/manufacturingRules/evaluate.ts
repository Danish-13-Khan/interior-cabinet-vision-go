import {
  isStorageType,
  supportsDoors,
  supportsDrawers,
  supportsToeKick,
  supportsWallPlacement,
} from "../cabinetCapabilities";
import { getFamilyOpeningRules } from "../cabinetFamilyRules";
import { collectOpeningLeaves } from "../cabinetOpeningStructure";
import type { CabinetConfig, CabinetProject } from "../cabinetDimensions";
import {
  BOARD_MATERIALS,
  resolveCabinetMaterialSpec,
} from "../materialSystem";
import type { ManufacturingIssue, ManufacturingRuleContext } from "./types";
import {
  DOUBLE_DOOR_MAX_WIDTH_MM,
  MIN_DRAWER_FRONT_HEIGHT_MM,
  NARROW_DOOR_WIDTH_MM,
  SINGLE_DOOR_MAX_WIDTH_MM,
  WALL_MOUNT_CLEARANCE_MM,
  WALL_MOUNT_MAX_Y_MM,
  WALL_MOUNT_MIN_Y_MM,
} from "./limits";
import {
  evaluateFamilyDimensions,
  evaluateOpenings,
  evaluateShelfRules,
  pushIssue,
} from "./evaluateStructure";

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
