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

export type OpeningStyle = "door" | "drawer" | "open" | "mixed";

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

export type DoorStyle = "none" | "single" | "double" | "bi-fold";
export type DoorHinge = "left" | "right" | "both";

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
  openings: CabinetOpening[];
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

function defaultOpeningStyle(type: CabinetType): OpeningStyle {
  if (type === "drawer") return "drawer";
  if (type === "open-shelf") return "open";
  if (type === "sink") return "open";
  return "door";
}

function defaultDoorStyle(type: CabinetType, widthMm: number, hasDoors: boolean): DoorStyle {
  if (!supportsDoors(type) || !hasDoors) return "none";
  return widthMm < 600 ? "single" : "double";
}

function doorCountForStyle(style: DoorStyle, widthMm: number): number {
  if (style === "none") return 0;
  if (style === "single") return 1;
  if (style === "bi-fold") return 2;
  return widthMm < 600 ? 1 : 2;
}

export function createDefaultComposition(
  type: CabinetType,
  seed?: Partial<CabinetConfig>,
): CabinetComposition {
  const width = seed?.dimensions?.width ?? 900;
  const shelfCount = seed?.shelfCount ?? (supportsShelves(type) ? 1 : 0);
  const drawerCount = seed?.drawerCount ?? (type === "drawer" ? 3 : 0);
  const hasDoors = seed?.hasDoors ?? supportsDoors(type);
  const doorStyle = defaultDoorStyle(type, width, hasDoors);
  const toeKickEnabled = supportsToeKick(type) && (seed?.toeKickHeight ?? 100) > 0;
  const openingStyle =
    drawerCount > 0 && hasDoors
      ? "mixed"
      : drawerCount > 0
        ? "drawer"
        : defaultOpeningStyle(type);

  return {
    openings: supportsOpenings(type)
      ? [
          {
            id: "opening-primary",
            label: type === "sink" ? "Sink Bay" : "Primary Opening",
            style: openingStyle,
          },
        ]
      : [],
    shelves: {
      count: supportsShelves(type) ? clampInt(shelfCount, SHELF_MIN, SHELF_MAX, 0) : 0,
      adjustable: true,
    },
    dividers: {
      count: type === "corner" ? 1 : 0,
    },
    doors: {
      enabled: doorStyle !== "none",
      style: doorStyle,
      hinge: doorStyle === "single" ? "left" : "both",
      count: doorCountForStyle(doorStyle, width),
    },
    drawers: {
      count: supportsCompositionDrawers(type)
        ? clampInt(drawerCount, DRAWER_MIN, DRAWER_MAX, 0)
        : 0,
      equalHeights: true,
    },
    toeKick: {
      enabled: toeKickEnabled,
      heightMm: toeKickEnabled
        ? clampInt(
            seed?.toeKickHeight ?? 100,
            TOE_KICK_HEIGHT_MIN_MM,
            TOE_KICK_HEIGHT_MAX_MM,
            100,
          )
        : 0,
      insetMm: toeKickEnabled
        ? clampInt(
            seed?.toeKickInset ?? 60,
            TOE_KICK_INSET_MIN_MM,
            TOE_KICK_INSET_MAX_MM,
            60,
          )
        : 0,
    },
    fillers: {
      leftMm: 0,
      rightMm: 0,
    },
    endPanels: {
      left: Boolean(seed?.leftEndPanel),
      right: Boolean(seed?.rightEndPanel),
    },
  };
}

export function normalizeComposition(
  type: CabinetType,
  composition: CabinetComposition,
  dimensionsWidthMm: number,
): CabinetComposition {
  const caps = getCompositionCapabilities(type);
  const doorStyle =
    !caps.doors || !composition.doors.enabled || composition.doors.style === "none"
      ? "none"
      : composition.doors.style;
  const drawerCount = caps.drawers
    ? clampInt(composition.drawers.count, DRAWER_MIN, DRAWER_MAX, 0)
    : 0;
  const doorEnabled = doorStyle !== "none";
  let openingStyle = composition.openings[0]?.style ?? defaultOpeningStyle(type);

  if (drawerCount > 0 && doorEnabled) openingStyle = "mixed";
  else if (drawerCount > 0) openingStyle = "drawer";
  else if (doorEnabled) openingStyle = "door";
  else if (type === "open-shelf" || type === "sink") openingStyle = "open";

  const toeKickEnabled = caps.toeKick && composition.toeKick.enabled;

  return {
    openings: caps.openings
      ? [
          {
            id: composition.openings[0]?.id ?? "opening-primary",
            label:
              composition.openings[0]?.label?.trim() ||
              (type === "sink" ? "Sink Bay" : "Primary Opening"),
            style: openingStyle,
          },
        ]
      : [],
    shelves: {
      count: caps.shelves
        ? clampInt(composition.shelves.count, SHELF_MIN, SHELF_MAX, 0)
        : 0,
      adjustable: caps.shelves ? Boolean(composition.shelves.adjustable) : false,
    },
    dividers: {
      count: caps.dividers
        ? clampInt(composition.dividers.count, 0, DIVIDER_MAX, type === "corner" ? 1 : 0)
        : 0,
    },
    doors: {
      enabled: doorEnabled,
      style: doorStyle,
      hinge:
        doorStyle === "single"
          ? composition.doors.hinge === "right"
            ? "right"
            : "left"
          : "both",
      count: doorCountForStyle(doorStyle, dimensionsWidthMm),
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
  return normalizeComposition(config.type, seed, config.dimensions.width);
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
  if (composition.openings[0]) {
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
