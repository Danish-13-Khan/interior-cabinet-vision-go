import type { CabinetType } from "./cabinetCapabilities";
import { isStorageType, supportsDoors, supportsDrawers, supportsShelves } from "./cabinetCapabilities";

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
};

export const CARCASS_STYLE_OPTIONS: Array<{ value: CarcassStyle; label: string }> = [
  { value: "frameless", label: "Frameless" },
  { value: "face-frame", label: "Face frame" },
];

export const CASE_JOINERY_OPTIONS: Array<{ value: CaseJoinery; label: string; note: string }> = [
  { value: "butt-screw", label: "Butt + screw", note: "Butt joint with confirmat/screw fixings" },
  { value: "dado", label: "Dado / groove", note: "Top and bottom housed in side dados" },
  { value: "rabbet", label: "Rabbet", note: "Rabbeted side edges for top/bottom" },
  { value: "confirmat", label: "Confirmat", note: "Confirmat screw carcass assembly" },
];

export const DOOR_MOUNT_OPTIONS: Array<{ value: DoorMount; label: string }> = [
  { value: "overlay", label: "Overlay" },
  { value: "full-overlay", label: "Full overlay" },
  { value: "inset", label: "Inset" },
];

export const SHELF_MOUNT_OPTIONS: Array<{ value: ShelfMount; label: string; note: string }> = [
  {
    value: "adjustable-pins",
    label: "Adjustable pins",
    note: "Adjustable on shelf pins; front edge setback",
  },
  {
    value: "fixed-dado",
    label: "Fixed dado",
    note: "Fixed shelf housed in side dados",
  },
  {
    value: "fixed-screw",
    label: "Fixed screw",
    note: "Fixed shelf screwed to cleats/sides",
  },
];

export const DRAWER_BOX_STYLE_OPTIONS: Array<{
  value: DrawerBoxStyle;
  label: string;
  note: string;
}> = [
  { value: "butt-screw", label: "Butt + screw", note: "Butt-joint drawer box with screws" },
  { value: "dado-bottom", label: "Dado bottom", note: "Drawer bottom housed in side grooves" },
  { value: "dovetail", label: "Dovetail", note: "Dovetailed drawer box corners" },
];

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

function isCarcassStyle(value: unknown): value is CarcassStyle {
  return value === "frameless" || value === "face-frame";
}

function isCaseJoinery(value: unknown): value is CaseJoinery {
  return (
    value === "butt-screw" ||
    value === "dado" ||
    value === "rabbet" ||
    value === "confirmat"
  );
}

function isDoorMount(value: unknown): value is DoorMount {
  return value === "overlay" || value === "full-overlay" || value === "inset";
}

function isShelfMount(value: unknown): value is ShelfMount {
  return (
    value === "adjustable-pins" ||
    value === "fixed-dado" ||
    value === "fixed-screw"
  );
}

function isDrawerBoxStyle(value: unknown): value is DrawerBoxStyle {
  return value === "butt-screw" || value === "dado-bottom" || value === "dovetail";
}

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
