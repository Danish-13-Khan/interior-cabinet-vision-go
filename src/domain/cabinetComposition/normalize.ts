import type { CabinetConfig } from "../cabinetDimensions";
import type { CabinetType } from "../cabinetCapabilities";
import {
  supportsDrawers,
  supportsShelves,
  supportsToeKick,
} from "../cabinetCapabilities";
import { getFamilyOpeningRules } from "../cabinetFamilyRules";
import { getFamilyEngineeringDefaults } from "../cabinetFamilyEngineering";
import {
  aggregateOpeningMetrics,
  collectOpeningLeaves,
  createDefaultOpeningStructure,
  openingStructureToLegacyStyle,
  updateOpeningLeaf,
  type OpeningLeaf,
  type OpeningStructure,
} from "../cabinetOpeningStructure";
import type { CabinetComposition } from "./types";
import {
  clampInt,
  DIVIDER_MAX,
  DRAWER_MAX,
  DRAWER_MIN,
  FILLER_MAX_MM,
  SHELF_MAX,
  SHELF_MIN,
  TOE_KICK_HEIGHT_MAX_MM,
  TOE_KICK_HEIGHT_MIN_MM,
  TOE_KICK_INSET_MAX_MM,
  TOE_KICK_INSET_MIN_MM,
} from "./constants";
import { getCompositionCapabilities } from "./capabilities";
import { doorCountForStyle, resolveStructureForComposition } from "./helpers";

export function createDefaultComposition(
  type: CabinetType,
  seed?: Partial<CabinetConfig>,
): CabinetComposition {
  const width = seed?.dimensions?.width ?? 900;
  const familyRules = getFamilyOpeningRules(type);
  const engineering = getFamilyEngineeringDefaults(type);
  const openingStructure = createDefaultOpeningStructure(type, width);
  const metrics = aggregateOpeningMetrics(openingStructure);
  const toeKickEnabled =
    engineering.toeKick.enabled &&
    supportsToeKick(type) &&
    (seed?.toeKickHeight ?? engineering.toeKick.heightMm) > 0;

  return {
    openings: familyRules.supportsOpenings
      ? [
          {
            id: openingStructure.activeOpeningId,
            label: "Primary Opening",
            style: openingStructureToLegacyStyle(openingStructure),
          },
        ]
      : [],
    openingStructure,
    shelves: {
      count: supportsShelves(type)
        ? clampInt(metrics.shelfCount || seed?.shelfCount || 0, SHELF_MIN, SHELF_MAX, 0)
        : 0,
      adjustable: metrics.shelvesAdjustable,
    },
    dividers: {
      count:
        type === "corner"
          ? Math.max(1, metrics.dividerCount)
          : clampInt(metrics.dividerCount, 0, DIVIDER_MAX, 0),
    },
    doors: {
      enabled: metrics.hasDoors,
      style: metrics.doorStyle,
      hinge: metrics.doorHinge,
      count: metrics.hasDoors
        ? metrics.doorCount || doorCountForStyle(metrics.doorStyle, width)
        : 0,
    },
    drawers: {
      count: supportsDrawers(type)
        ? clampInt(metrics.drawerCount || seed?.drawerCount || 0, DRAWER_MIN, DRAWER_MAX, 0)
        : 0,
      equalHeights: true,
    },
    toeKick: {
      enabled: toeKickEnabled,
      heightMm: toeKickEnabled
        ? clampInt(
            seed?.toeKickHeight ?? engineering.toeKick.heightMm,
            TOE_KICK_HEIGHT_MIN_MM,
            TOE_KICK_HEIGHT_MAX_MM,
            engineering.toeKick.heightMm || 100,
          )
        : 0,
      insetMm: toeKickEnabled
        ? clampInt(
            seed?.toeKickInset ?? engineering.toeKick.insetMm,
            TOE_KICK_INSET_MIN_MM,
            TOE_KICK_INSET_MAX_MM,
            engineering.toeKick.insetMm || 50,
          )
        : 0,
    },
    fillers: {
      leftMm: engineering.fillers.leftMm,
      rightMm: engineering.fillers.rightMm,
    },
    endPanels: {
      left: Boolean(seed?.leftEndPanel ?? engineering.endPanels.left),
      right: Boolean(seed?.rightEndPanel ?? engineering.endPanels.right),
    },
  };
}

function syncSingleLeafFromComposition(
  type: CabinetType,
  structure: OpeningStructure,
  composition: CabinetComposition,
  widthMm: number,
): OpeningStructure {
  const leaves = collectOpeningLeaves(structure.root);
  if (leaves.length !== 1) return structure;
  const leaf = leaves[0];
  const patch: Partial<OpeningLeaf> = {};

  if (leaf.contentType === "drawer-stack") {
    patch.drawerCount = composition.drawers.count;
  }
  if (leaf.contentType === "open-shelf" || leaf.contentType === "door") {
    patch.shelfCount = composition.shelves.count;
    patch.shelvesAdjustable = composition.shelves.adjustable;
  }
  if (leaf.contentType === "door" && composition.doors.enabled) {
    patch.doorStyle =
      composition.doors.style === "none"
        ? widthMm < 600
          ? "single"
          : "double"
        : composition.doors.style;
    patch.doorHinge = composition.doors.hinge;
  }

  return updateOpeningLeaf(structure, leaf.id, patch, type, widthMm);
}

export function normalizeComposition(
  type: CabinetType,
  composition: CabinetComposition,
  dimensionsWidthMm: number,
): CabinetComposition {
  const caps = getCompositionCapabilities(type);
  let openingStructure = resolveStructureForComposition(
    type,
    composition,
    {
      shelfCount: composition.shelves.count,
      drawerCount: composition.drawers.count,
      hasDoors: composition.doors.enabled,
    },
    dimensionsWidthMm,
  );
  openingStructure = syncSingleLeafFromComposition(
    type,
    openingStructure,
    composition,
    dimensionsWidthMm,
  );
  const metrics = aggregateOpeningMetrics(openingStructure);
  const doorStyle =
    !caps.doors || !metrics.hasDoors || metrics.doorStyle === "none"
      ? "none"
      : metrics.doorStyle;
  const drawerCount = caps.drawers
    ? clampInt(metrics.drawerCount || composition.drawers.count, DRAWER_MIN, DRAWER_MAX, 0)
    : 0;
  const doorEnabled = doorStyle !== "none";
  const openingStyle = openingStructureToLegacyStyle(openingStructure);
  const toeKickEnabled = caps.toeKick && composition.toeKick.enabled;
  const shelfCount = caps.shelves
    ? clampInt(metrics.shelfCount || composition.shelves.count, SHELF_MIN, SHELF_MAX, 0)
    : 0;

  return {
    openings: caps.openings
      ? [
          {
            id: openingStructure.activeOpeningId,
            label: "Opening Structure",
            style: openingStyle,
          },
        ]
      : [],
    openingStructure,
    shelves: {
      count: shelfCount,
      adjustable: caps.shelves
        ? Boolean(metrics.shelvesAdjustable || composition.shelves.adjustable)
        : false,
    },
    dividers: {
      count: caps.dividers
        ? clampInt(
            Math.max(metrics.dividerCount, composition.dividers.count),
            0,
            DIVIDER_MAX,
            type === "corner" ? 1 : 0,
          )
        : 0,
    },
    doors: {
      enabled: doorEnabled,
      style: doorStyle,
      hinge:
        doorStyle === "single"
          ? metrics.doorHinge === "right"
            ? "right"
            : "left"
          : "both",
      count: doorEnabled
        ? metrics.doorCount || doorCountForStyle(doorStyle, dimensionsWidthMm)
        : 0,
    },
    drawers: {
      count: drawerCount,
      equalHeights: Boolean(composition.drawers.equalHeights),
    },
    toeKick: {
      enabled: toeKickEnabled,
      heightMm: toeKickEnabled
        ? clampInt(
            composition.toeKick.heightMm,
            TOE_KICK_HEIGHT_MIN_MM,
            TOE_KICK_HEIGHT_MAX_MM,
            100,
          )
        : 0,
      insetMm: toeKickEnabled
        ? clampInt(
            composition.toeKick.insetMm,
            TOE_KICK_INSET_MIN_MM,
            TOE_KICK_INSET_MAX_MM,
            60,
          )
        : 0,
    },
    fillers: {
      leftMm: caps.fillers ? clampInt(composition.fillers.leftMm, 0, FILLER_MAX_MM, 0) : 0,
      rightMm: caps.fillers ? clampInt(composition.fillers.rightMm, 0, FILLER_MAX_MM, 0) : 0,
    },
    endPanels: {
      left: caps.endPanels ? Boolean(composition.endPanels.left) : false,
      right: caps.endPanels ? Boolean(composition.endPanels.right) : false,
    },
  };
}
