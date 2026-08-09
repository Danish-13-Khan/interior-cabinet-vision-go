import type { OpeningContentType } from "../cabinetOpeningStructure";

function padMark(index1Based: number, width = 2) {
  return String(Math.max(1, index1Based)).padStart(width, "0");
}

/** Cabinet mark C01 — `index` is 0-based position in the room schedule. */
export function formatCabinetMark(index: number) {
  return `C${padMark(index + 1)}`;
}

/** Run mark R01 — `index` is 0-based. */
export function formatRunMark(index: number) {
  return `R${padMark(index + 1)}`;
}

/** Filler / end-panel mark FL-1. */
export function formatFillerMark(index: number) {
  return `FL-${index + 1}`;
}

/** Face opening mark OP-1 / DW-1 / SH-1 / DV-1. */
export function formatOpeningMark(contentType: string, index: number) {
  const code =
    contentType === "door"
      ? "OP"
      : contentType === "drawer-stack"
        ? "DW"
        : contentType === "open-shelf"
          ? "SH"
          : contentType === "divider"
            ? "DV"
            : "OC";
  return `${code}-${index + 1}`;
}

/** Wall opening DR-1 / WN-1 with optional size. */
export function formatWallOpeningMark(
  kind: "door" | "window",
  index: number,
  widthMm: number,
  heightMm: number,
  sillHeightMm?: number,
) {
  const code = kind === "door" ? "DR" : "WN";
  const size = `${Math.round(widthMm)}×${Math.round(heightMm)}`;
  if (kind === "window" && typeof sillHeightMm === "number") {
    return `${code}-${index + 1} ${size} S${Math.round(sillHeightMm)}`;
  }
  return `${code}-${index + 1} ${size}`;
}

/** Cutlist part shop ref C01-P01 — cabinetIndex and partIndex are 1-based. */
export function formatPartShopRef(cabinetIndex: number, partIndex: number) {
  return `C${padMark(cabinetIndex)}-P${padMark(partIndex)}`;
}

export function formatElevationTagLine(
  mark: string,
  name: string,
  widthMm: number,
  heightMm: number,
) {
  const short = name.length > 16 ? `${name.slice(0, 15)}…` : name;
  return `${mark} · ${short} · ${Math.round(widthMm)}×${Math.round(heightMm)}`;
}

export const OPENING_CONTENT_TERMS: Record<OpeningContentType, string> = {
  door: "Door Opening",
  "drawer-stack": "Drawer Stack",
  "open-shelf": "Open Shelf Section",
  divider: "Divider Section",
  empty: "Empty Bay",
};

export function openingContentTerm(type: OpeningContentType): string {
  return OPENING_CONTENT_TERMS[type] ?? type;
}
