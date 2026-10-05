import type { CabinetConfig } from "../cabinetDimensions";
import { resolveFrontGaps, type FrontLeaf } from "../cabinetConstruction/frontGaps";
import type { CabinetElevationFaceLayout } from "../openingLayout";
import { faceToSvg, rect } from "./svgPrimitives";

export type ElevationOpeningFronts = { leaves: FrontLeaf[]; centerMm: number };

/** Production-sized fronts for one opening, so elevation sheets match the cut list (gola bands included). */
export function resolvedOpeningFronts(config: CabinetConfig, openingId: string): ElevationOpeningFronts | null {
  const fronts = resolveFrontGaps(config);
  const entry = fronts.openings.find((item) => item.opening.id === openingId);
  return entry?.leaves.length ? { leaves: entry.leaves, centerMm: fronts.gaps.centerMm } : null;
}

export function leafSpan(leaves: FrontLeaf[]): FrontLeaf {
  const left = Math.min(...leaves.map((leaf) => leaf.xMm));
  const right = Math.max(...leaves.map((leaf) => leaf.xMm + leaf.widthMm));
  const bottom = Math.min(...leaves.map((leaf) => leaf.yMm));
  const top = Math.max(...leaves.map((leaf) => leaf.yMm + leaf.heightMm));
  return { xMm: left, yMm: bottom, widthMm: right - left, heightMm: top - bottom, golaGrip: leaves.every((leaf) => leaf.golaGrip) || undefined };
}

/** SVG box for a face-coordinate rectangle (face origin = after left filler, above toe kick). */
export function faceRectToSvg(
  box: FrontLeaf,
  layout: CabinetElevationFaceLayout,
  cabinetSvgX: number,
  cabinetSvgY: number,
  scale: number,
) {
  const topLeft = faceToSvg(
    layout.leftFillerMm + box.xMm,
    layout.toeKickHeightMm + box.yMm + box.heightMm,
    cabinetSvgX,
    cabinetSvgY,
    layout.carcassHeightMm,
    scale,
  );
  return { x: topLeft.x, y: topLeft.y, width: box.widthMm / scale, height: box.heightMm / scale };
}

export function renderGolaProfiles(
  config: CabinetConfig,
  layout: CabinetElevationFaceLayout,
  cabinetSvgX: number,
  cabinetSvgY: number,
  scale: number,
): string[] {
  return resolveFrontGaps(config).profiles.map((band) => {
    const box = faceRectToSvg(
      { xMm: band.xMm, yMm: band.yMm, widthMm: band.lengthMm, heightMm: band.heightMm },
      layout, cabinetSvgX, cabinetSvgY, scale,
    );
    return rect(box.x, box.y, box.width, box.height,
      `class="twod-gola-profile" data-gola-kind="${band.kind}" fill="none" pointer-events="none"`);
  });
}
