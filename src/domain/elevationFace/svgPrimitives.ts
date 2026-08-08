export type ElevationSvgOptions = {
  showDetails?: boolean;
  activeOpeningId?: string | null;
  scale: number;
};

export function rect(
  x: number,
  y: number,
  width: number,
  height: number,
  attrs: string,
) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" ${attrs} />`;
}

export function line(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  attrs: string,
) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${attrs} />`;
}

/** Convert face-local mm (origin bottom-left of carcass) to SVG within cabinet box. */
export function faceToSvg(
  faceXMm: number,
  faceYMm: number,
  cabinetSvgX: number,
  cabinetSvgY: number,
  carcassHeightMm: number,
  scale: number,
) {
  return {
    x: cabinetSvgX + faceXMm / scale,
    y: cabinetSvgY + (carcassHeightMm - faceYMm) / scale,
  };
}
