import {
  isStorageType,
  supportsShelves,
  supportsToeKick,
} from "../cabinetCapabilities";
import { getFamilyOpeningRules } from "../cabinetFamilyRules";
import {
  collectOpeningLeaves,
  type OpeningLeaf,
} from "../cabinetOpeningStructure";
import type { CabinetConfig } from "../cabinetDimensions";
import { resolveCabinetMaterialSpec } from "../materialSystem";
import type { ManufacturingIssue } from "./types";
import {
  getFamilyDimensionLimits,
  getMaxUnsupportedShelfSpanMm,
  MIN_OPENING_HEIGHT_MM,
  MIN_OPENING_WIDTH_MM,
  MIN_SHELF_DEPTH_MM,
  MIN_SHELF_SPACING_MM,
} from "./limits";

export function pushIssue(
  issues: ManufacturingIssue[],
  issue: ManufacturingIssue,
) {
  issues.push(issue);
}

function estimateLeafWidthMm(leaf: OpeningLeaf, openingWidthMm: number, siblingCount: number) {
  if (siblingCount <= 1) return openingWidthMm;
  return Math.max(40, openingWidthMm * (leaf.ratio || 1 / siblingCount));
}

export function evaluateFamilyDimensions(
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

export function evaluateOpenings(config: CabinetConfig, issues: ManufacturingIssue[]) {
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

export function evaluateShelfRules(config: CabinetConfig, issues: ManufacturingIssue[]) {
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

