import type { CabinetType } from "./cabinetCapabilities";
import { isStorageType, supportsDoors, supportsDrawers, supportsShelves } from "./cabinetCapabilities";
import {
  CARCASS_STYLE_OPTIONS,
  CASE_JOINERY_OPTIONS,
  DOOR_MOUNT_OPTIONS,
  DRAWER_BOX_STYLE_OPTIONS,
  SHELF_MOUNT_OPTIONS,
} from "./cabinetConstructionOptions";
import { normalizeFrontSystem, type FrontSystem } from "./frontSystem/golaProfiles";
import { normalizeDoorFrontStyle, type DoorFrontStyle } from "./frontSystem/doorStyles";

export { CARCASS_STYLE_OPTIONS, CASE_JOINERY_OPTIONS, DOOR_MOUNT_OPTIONS, DRAWER_BOX_STYLE_OPTIONS, SHELF_MOUNT_OPTIONS };

export type CarcassStyle = "frameless" | "face-frame";
export type CaseJoinery = "butt-screw" | "dado" | "rabbet" | "confirmat";
export type DoorMount = "overlay" | "full-overlay" | "inset";
export type ShelfMount = "adjustable-pins" | "fixed-dado" | "fixed-screw";
export type DrawerBoxStyle = "butt-screw" | "dado-bottom" | "dovetail";

export type FaceFrameSpec = {
  stileWidthMm: number;
  railWidthMm: number;
};

export type CabinetConstructionSpec = {
  carcassStyle: CarcassStyle;
  /** How sides meet top/bottom panels. */
  caseJoinery: CaseJoinery;
  doorMount: DoorMount;
  shelfMount: ShelfMount;
  drawerBoxStyle: DrawerBoxStyle;
  faceFrame: FaceFrameSpec;
  /** Absent = handles. Normalised specs only carry it for gola, so handled projects serialise unchanged. */
  frontSystem?: FrontSystem;
  /** Absent = slab doors. Shaker / glass frames reuse the face-frame stile and rail widths. */
  frontStyle?: DoorFrontStyle;
};

function golaFrontSystem(type: CabinetType, value: unknown): { frontSystem?: FrontSystem } {
  if (!supportsDoors(type) && !supportsDrawers(type)) return {};
  const frontSystem = normalizeFrontSystem(value);
  return frontSystem.kind === "gola" ? { frontSystem } : {};
}

function frontStyleField(type: CabinetType, value: unknown): { frontStyle?: DoorFrontStyle } {
  const frontStyle = normalizeDoorFrontStyle(type, value);
  return frontStyle ? { frontStyle } : {};
}

export const DEFAULT_FACE_FRAME: FaceFrameSpec = {
  stileWidthMm: 50,
  railWidthMm: 50,
};

export const DEFAULT_CONSTRUCTION_SPEC: CabinetConstructionSpec = {
  carcassStyle: "frameless",
  caseJoinery: "butt-screw",
  doorMount: "overlay",
  shelfMount: "adjustable-pins",
  drawerBoxStyle: "butt-screw",
  faceFrame: { ...DEFAULT_FACE_FRAME },
};

/** Named front gaps used by part generation. */
export const DOOR_GAP = {
  overlay: { sideMm: 2, centerMm: 4, bottomMm: 8 },
  "full-overlay": { sideMm: 1, centerMm: 2, bottomMm: 4 },
  inset: { sideMm: 2, centerMm: 3, bottomMm: 3 },
} as const;

export const SHELF_PIN_SETBACK_MM = 30;
export const FACE_FRAME_STILE_MIN_MM = 40;
export const FACE_FRAME_STILE_MAX_MM = 80;
export const FACE_FRAME_RAIL_MIN_MM = 40;
export const FACE_FRAME_RAIL_MAX_MM = 80;

const oneOf = <T extends string>(values: readonly T[]) => (value: unknown): value is T => values.includes(value as T);
const isCarcassStyle = oneOf<CarcassStyle>(["frameless", "face-frame"]);
const isCaseJoinery = oneOf<CaseJoinery>(["butt-screw", "dado", "rabbet", "confirmat"]);
const isDoorMount = oneOf<DoorMount>(["overlay", "full-overlay", "inset"]);
const isShelfMount = oneOf<ShelfMount>(["adjustable-pins", "fixed-dado", "fixed-screw"]);
const isDrawerBoxStyle = oneOf<DrawerBoxStyle>(["butt-screw", "dado-bottom", "dovetail"]);

function clampMm(value: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function getDefaultConstructionSpec(type: CabinetType): CabinetConstructionSpec {
  const base = { ...DEFAULT_CONSTRUCTION_SPEC, faceFrame: { ...DEFAULT_FACE_FRAME } };
  if (!isStorageType(type)) {
    return base;
  }

  switch (type) {
    case "open-shelf":
      return {
        ...base,
        caseJoinery: "dado",
        shelfMount: "adjustable-pins",
        doorMount: "overlay",
      };
    case "media-unit":
      return {
        ...base,
        caseJoinery: "dado",
        shelfMount: "adjustable-pins",
        doorMount: "full-overlay",
      };
    case "drawer":
      return {
        ...base,
        drawerBoxStyle: "dado-bottom",
        shelfMount: "fixed-screw",
      };
    case "sink":
      return {
        ...base,
        caseJoinery: "confirmat",
        shelfMount: "fixed-screw",
      };
    case "wall":
      return {
        ...base,
        caseJoinery: "dado",
        doorMount: "overlay",
      };
    default:
      return base;
  }
}

export function shelfMountFromAdjustable(adjustable: boolean): ShelfMount {
  return adjustable ? "adjustable-pins" : "fixed-dado";
}

export function shelvesAreAdjustable(mount: ShelfMount): boolean {
  return mount === "adjustable-pins";
}

export function getCaseJoineryNote(joinery: CaseJoinery): string {
  return CASE_JOINERY_OPTIONS.find((option) => option.value === joinery)?.note ?? joinery;
}

export function getShelfMountNote(mount: ShelfMount): string {
  return SHELF_MOUNT_OPTIONS.find((option) => option.value === mount)?.note ?? mount;
}

export function getDrawerBoxStyleNote(style: DrawerBoxStyle): string {
  return DRAWER_BOX_STYLE_OPTIONS.find((option) => option.value === style)?.note ?? style;
}

export function getDoorMountLabel(mount: DoorMount): string {
  return DOOR_MOUNT_OPTIONS.find((option) => option.value === mount)?.label ?? mount;
}

export function normalizeConstructionSpec(
  type: CabinetType,
  spec: Partial<CabinetConstructionSpec> | undefined,
  options?: { shelvesAdjustable?: boolean },
): CabinetConstructionSpec {
  const defaults = getDefaultConstructionSpec(type);
  const merged: CabinetConstructionSpec = {
    ...defaults,
    ...(spec ?? {}),
    faceFrame: {
      ...defaults.faceFrame,
      ...(spec?.faceFrame ?? {}),
    },
  };

  let shelfMount = isShelfMount(merged.shelfMount)
    ? merged.shelfMount
    : defaults.shelfMount;
  if (typeof options?.shelvesAdjustable === "boolean") {
    // Keep adjustable flag and shelf mount aligned when composition drives the value.
    if (options.shelvesAdjustable && shelfMount !== "adjustable-pins") {
      shelfMount = "adjustable-pins";
    }
    if (!options.shelvesAdjustable && shelfMount === "adjustable-pins") {
      shelfMount = "fixed-dado";
    }
  }

  if (!supportsShelves(type)) {
    shelfMount = "fixed-screw";
  }
  if (!supportsDoors(type)) {
    merged.doorMount = defaults.doorMount;
  }
  if (!supportsDrawers(type)) {
    merged.drawerBoxStyle = defaults.drawerBoxStyle;
  }

  return {
    carcassStyle: isCarcassStyle(merged.carcassStyle) ? merged.carcassStyle : defaults.carcassStyle,
    caseJoinery: isCaseJoinery(merged.caseJoinery) ? merged.caseJoinery : defaults.caseJoinery,
    doorMount: isDoorMount(merged.doorMount) ? merged.doorMount : defaults.doorMount,
    shelfMount,
    drawerBoxStyle: isDrawerBoxStyle(merged.drawerBoxStyle)
      ? merged.drawerBoxStyle
      : defaults.drawerBoxStyle,
    ...golaFrontSystem(type, merged.frontSystem),
    ...frontStyleField(type, merged.frontStyle),
    faceFrame: {
      stileWidthMm: clampMm(
        merged.faceFrame.stileWidthMm,
        FACE_FRAME_STILE_MIN_MM,
        FACE_FRAME_STILE_MAX_MM,
        DEFAULT_FACE_FRAME.stileWidthMm,
      ),
      railWidthMm: clampMm(
        merged.faceFrame.railWidthMm,
        FACE_FRAME_RAIL_MIN_MM,
        FACE_FRAME_RAIL_MAX_MM,
        DEFAULT_FACE_FRAME.railWidthMm,
      ),
    },
  };
}

export function describeConstructionSpec(spec: CabinetConstructionSpec): string {
  const carcass =
    spec.carcassStyle === "face-frame"
      ? `Face frame ${spec.faceFrame.stileWidthMm}/${spec.faceFrame.railWidthMm}`
      : "Frameless";
  return `${carcass} · ${getCaseJoineryNote(spec.caseJoinery)} · doors ${getDoorMountLabel(spec.doorMount).toLowerCase()} · shelves ${spec.shelfMount}`;
}
