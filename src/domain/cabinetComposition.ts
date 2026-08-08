import type { CabinetConfig } from "./cabinetDimensions";
import type { CabinetType } from "./cabinetCapabilities";
import {
  isStorageType,
  supportsDoors,
  supportsDrawers,
  supportsEndPanels,
  supportsShelves,
  supportsToeKick,
} from "./cabinetCapabilities";
import { getFamilyOpeningRules } from "./cabinetFamilyRules";
import { getFamilyEngineeringDefaults } from "./cabinetFamilyEngineering";
import {
  aggregateOpeningMetrics,
  collectOpeningLeaves,
  createDefaultOpeningStructure,
  describeOpeningStructure,
  migrateLegacyOpeningsToStructure,
  normalizeOpeningStructure,
  openingStructureToLegacyStyle,
  updateOpeningLeaf,
  type DoorHinge,
  type DoorStyle,
  type OpeningLeaf,
  type OpeningStructure,
  type OpeningStyle,
} from "./cabinetOpeningStructure";

export type { DoorHinge, DoorStyle, OpeningStyle } from "./cabinetOpeningStructure";
export type {
  OpeningStructure,
  OpeningContentType,
  OpeningLeaf,
  OpeningNode,
  OpeningSplitAxis,
} from "./cabinetOpeningStructure";

const SHELF_MIN = 0;
const SHELF_MAX = 6;
const DRAWER_MIN = 0;
const DRAWER_MAX = 8;
const TOE_KICK_HEIGHT_MIN_MM = 80;
const TOE_KICK_HEIGHT_MAX_MM = 180;
const TOE_KICK_INSET_MIN_MM = 20;
const TOE_KICK_INSET_MAX_MM = 120;

export type CabinetOpening = {
  id: string;
  label: string;
  style: OpeningStyle;
};

export type CabinetShelfSpec = {
  count: number;
  adjustable: boolean;
};

export type CabinetDividerSpec = {
  count: number;
};

export type CabinetDoorSpec = {
  enabled: boolean;
  style: DoorStyle;
  hinge: DoorHinge;
  count: number;
};

export type CabinetDrawerSpec = {
  count: number;
  equalHeights: boolean;
};

export type CabinetToeKickSpec = {
  enabled: boolean;
  heightMm: number;
  insetMm: number;
};

export type CabinetFillerSpec = {
  leftMm: number;
  rightMm: number;
};

export type CabinetEndPanelSpec = {
  left: boolean;
  right: boolean;
};

export type CabinetComposition = {
  /** @deprecated Prefer openingStructure leaves; kept for compatibility. */
  openings: CabinetOpening[];
  openingStructure?: OpeningStructure;
  shelves: CabinetShelfSpec;
  dividers: CabinetDividerSpec;
  doors: CabinetDoorSpec;
  drawers: CabinetDrawerSpec;
  toeKick: CabinetToeKickSpec;
  fillers: CabinetFillerSpec;
  endPanels: CabinetEndPanelSpec;
};

export type CompositionCapabilities = {
  openings: boolean;
  shelves: boolean;
  dividers: boolean;
  doors: boolean;
  drawers: boolean;
  toeKick: boolean;
  fillers: boolean;
  endPanels: boolean;
};

const FILLER_MAX_MM = 150;
const DIVIDER_MAX = 3;

function clampInt(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function supportsDividers(type: CabinetType): boolean {
  return (
    type === "base" ||
    type === "wall" ||
    type === "tall" ||
    type === "corner" ||
    type === "open-shelf" ||
    type === "almirah"
  );
}

export function supportsFillers(type: CabinetType): boolean {
  return isStorageType(type) && type !== "corner";
}

export function supportsCompositionDrawers(type: CabinetType): boolean {
  return supportsDrawers(type);
}

export function supportsOpenings(type: CabinetType): boolean {
  return isStorageType(type);
}

export function getCompositionCapabilities(type: CabinetType): CompositionCapabilities {
  return {
    openings: supportsOpenings(type),
    shelves: supportsShelves(type),
    dividers: supportsDividers(type),
    doors: supportsDoors(type),
    drawers: supportsCompositionDrawers(type),
    toeKick: supportsToeKick(type),
    fillers: supportsFillers(type),
    endPanels: supportsEndPanels(type),
  };
}

function doorCountForStyle(style: DoorStyle, widthMm: number): number {
  if (style === "none") return 0;
  if (style === "single") return 1;
  if (style === "bi-fold") return 2;
  return widthMm < 600 ? 1 : 2;
}

function resolveStructureForComposition(
  type: CabinetType,
  composition: Partial<CabinetComposition> | undefined,
  seed: Partial<CabinetConfig> | undefined,
  widthMm: number,
): OpeningStructure {
  if (composition?.openingStructure) {
    return normalizeOpeningStructure(type, composition.openingStructure, widthMm);
  }

  return normalizeOpeningStructure(
    type,
    migrateLegacyOpeningsToStructure(
      type,
      widthMm,
      composition?.openings?.[0]?.style,
      seed?.shelfCount ?? composition?.shelves?.count ?? (supportsShelves(type) ? 1 : 0),
      seed?.drawerCount ?? composition?.drawers?.count ?? (type === "drawer" ? 3 : 0),
      seed?.hasDoors ?? composition?.doors?.enabled ?? supportsDoors(type),
    ),
    widthMm,
  );
}

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

export function resolveCabinetComposition(config: CabinetConfig): CabinetComposition {
  const seed = config.composition
    ? config.composition
    : createDefaultComposition(config.type, config);
  return normalizeComposition(
    config.type,
    {
      ...createDefaultComposition(config.type, config),
      ...seed,
      openings: seed.openings ?? [],
    },
    config.dimensions.width,
  );
}

export function syncFlatFieldsFromComposition(
  composition: CabinetComposition,
): Pick<
  CabinetConfig,
  | "shelfCount"
  | "hasDoors"
  | "drawerCount"
  | "toeKickHeight"
  | "toeKickInset"
  | "leftEndPanel"
  | "rightEndPanel"
> {
  return {
    shelfCount: composition.shelves.count,
    hasDoors: composition.doors.enabled && composition.doors.style !== "none",
    drawerCount: composition.drawers.count,
    toeKickHeight: composition.toeKick.enabled ? composition.toeKick.heightMm : 0,
    toeKickInset: composition.toeKick.enabled ? composition.toeKick.insetMm : 0,
    leftEndPanel: composition.endPanels.left,
    rightEndPanel: composition.endPanels.right,
  };
}

export function getResolvedDoorCount(config: CabinetConfig): number {
  const composition = resolveCabinetComposition(config);
  return composition.doors.count;
}

export function getResolvedDividerCount(config: CabinetConfig): number {
  return resolveCabinetComposition(config).dividers.count;
}

export function getResolvedFillers(config: CabinetConfig): CabinetFillerSpec {
  return resolveCabinetComposition(config).fillers;
}

export function describeComposition(composition: CabinetComposition): string {
  const parts: string[] = [];
  if (composition.openingStructure) {
    parts.push(describeOpeningStructure(composition.openingStructure));
  } else if (composition.openings[0]) {
    parts.push(`${composition.openings[0].label} (${composition.openings[0].style})`);
  }
  if (composition.shelves.count > 0) {
    parts.push(
      `${composition.shelves.count} shelf${composition.shelves.count === 1 ? "" : "ves"}${composition.shelves.adjustable ? " adj." : ""}`,
    );
  }
  if (composition.dividers.count > 0) {
    parts.push(`${composition.dividers.count} divider${composition.dividers.count === 1 ? "" : "s"}`);
  }
  if (composition.doors.enabled && composition.doors.style !== "none") {
    parts.push(`${composition.doors.count}× ${composition.doors.style} door`);
  }
  if (composition.drawers.count > 0) {
    parts.push(`${composition.drawers.count} drawer${composition.drawers.count === 1 ? "" : "s"}`);
  }
  if (composition.toeKick.enabled) {
    parts.push(`toe kick ${composition.toeKick.heightMm}mm`);
  }
  if (composition.fillers.leftMm > 0 || composition.fillers.rightMm > 0) {
    parts.push(`fillers L${composition.fillers.leftMm}/R${composition.fillers.rightMm}`);
  }
  if (composition.endPanels.left || composition.endPanels.right) {
    parts.push(
      `ends ${[composition.endPanels.left ? "L" : "", composition.endPanels.right ? "R" : ""].join("")}`,
    );
  }
  return parts.join(" · ") || "Empty carcass";
}
