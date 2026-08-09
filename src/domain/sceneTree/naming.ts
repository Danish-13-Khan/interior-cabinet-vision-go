import {
  cabinetTypeLabels,
  type CabinetInstance,
  type CabinetType,
} from "../cabinetDimensions";
import { formatCabinetTag } from "../draftingAnnotations";
import { formatRunDraftLabel, formatRunSideLabel } from "../runDrafting";
import type { CabinetRun, CabinetRunSide } from "../cabinetLibrary";
import type { OpeningContentType, OpeningLeaf } from "../cabinetOpeningStructure";

const CONTENT_TYPE_LABELS: Record<OpeningContentType, string> = {
  door: "Door Opening",
  "drawer-stack": "Drawer Stack",
  "open-shelf": "Open Shelf Section",
  divider: "Divider Section",
  empty: "Empty",
};

/** Compact family glyphs for the object tree (CAD-style marks). */
export const cabinetFamilyIcons: Record<CabinetType, string> = {
  base: "B",
  wall: "W",
  tall: "T",
  drawer: "D",
  sink: "S",
  corner: "C",
  "open-shelf": "O",
  almirah: "A",
  table: "Tb",
  chair: "Ch",
  sofa: "Sf",
  mirror: "M",
};

export const cabinetFamilyTones: Record<CabinetType, string> = {
  base: "base",
  wall: "wall",
  tall: "tall",
  drawer: "drawer",
  sink: "sink",
  corner: "corner",
  "open-shelf": "shelf",
  almirah: "tall",
  table: "furn",
  chair: "furn",
  sofa: "furn",
  mirror: "wall",
};

const openingIcons: Record<OpeningContentType, string> = {
  door: "OP",
  "drawer-stack": "DW",
  "open-shelf": "SH",
  divider: "DV",
  empty: "—",
};

export function cabinetFamilyIcon(type: CabinetType) {
  return cabinetFamilyIcons[type] ?? "?";
}

export function cabinetFamilyTone(type: CabinetType) {
  return cabinetFamilyTones[type] ?? "base";
}

export function formatCabinetStructuredName(
  cabinet: CabinetInstance,
  markIndex: number,
) {
  const mark = formatCabinetTag(markIndex);
  const family = shortFamilyLabel(cabinet.config.type);
  const { width, height } = cabinet.config.dimensions;
  return {
    mark,
    label: `${mark} · ${cabinet.name}`,
    detail: `${family} · ${Math.round(width)}×${Math.round(height)}`,
    title: `${mark} · ${cabinet.name} · ${cabinetTypeLabels[cabinet.config.type]} · ${Math.round(width)}×${Math.round(height)}×${Math.round(cabinet.config.dimensions.depth)}`,
  };
}

export function shortFamilyLabel(type: CabinetType) {
  switch (type) {
    case "base":
      return "Base";
    case "wall":
      return "Wall";
    case "tall":
      return "Tall";
    case "drawer":
      return "Drawer";
    case "sink":
      return "Sink";
    case "corner":
      return "Corner";
    case "open-shelf":
      return "Shelf";
    case "almirah":
      return "Almirah";
    case "table":
      return "Table";
    case "chair":
      return "Chair";
    case "sofa":
      return "Sofa";
    case "mirror":
      return "Mirror";
    default:
      return cabinetTypeLabels[type] ?? type;
  }
}

export function formatWallTreeLabel(side: CabinetRunSide) {
  return formatRunSideLabel(side);
}

export function formatRunTreeLabel(run: CabinetRun, index: number) {
  return formatRunDraftLabel(run, index);
}

export function formatOpeningStructuredName(leaf: OpeningLeaf, index: number) {
  const code =
    leaf.contentType === "door"
      ? `OP-${index + 1}`
      : leaf.contentType === "drawer-stack"
        ? `DW-${index + 1}`
        : leaf.contentType === "open-shelf"
          ? `SH-${index + 1}`
          : leaf.contentType === "divider"
            ? `DV-${index + 1}`
            : `OC-${index + 1}`;
  return {
    icon: openingIcons[leaf.contentType] ?? "OC",
    label: `${code} · ${leaf.label}`,
    detail: CONTENT_TYPE_LABELS[leaf.contentType] ?? leaf.contentType,
  };
}

export function wallIcon(side: CabinetRunSide) {
  switch (side) {
    case "back-wall":
      return "BW";
    case "left-wall":
      return "LW";
    case "right-wall":
      return "RW";
    default:
      return "FR";
  }
}
