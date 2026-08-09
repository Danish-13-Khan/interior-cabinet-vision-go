import type { CabinetInstance } from "../cabinetDimensions";
import type {
  CabinetElevationFaceLayout,
  OpeningFaceRect,
} from "../openingLayout";
import { elevMm, openingHitAttrs } from "./faceMetrics";
import { faceToSvg, line, rect } from "./svgPrimitives";

export function renderDividerOrEmpty(
  opening: OpeningFaceRect,
  cabinet: CabinetInstance,
  cabinetSvgX: number,
  cabinetSvgY: number,
  layout: CabinetElevationFaceLayout,
  scale: number,
  active: boolean,
): string[] {
  const faceOriginX = layout.leftFillerMm;
  const faceOriginY = layout.toeKickHeightMm;
  const ox = faceOriginX + opening.xMm;
  const oy = faceOriginY + opening.yMm;
  const topLeft = faceToSvg(
    ox,
    oy + opening.heightMm,
    cabinetSvgX,
    cabinetSvgY,
    layout.carcassHeightMm,
    scale,
  );
  const width = opening.widthMm / scale;
  const height = opening.heightMm / scale;
  if (opening.contentType === "divider") {
    const panelW = elevMm(scale, layout.boardThicknessMm);
    const x = topLeft.x + width / 2 - panelW / 2;
    return [
      rect(
        x,
        topLeft.y,
        panelW,
        height,
        openingHitAttrs(cabinet.id, opening.id, opening.contentType, active),
      ),
      line(
        x,
        topLeft.y,
        x,
        topLeft.y + height,
        `class="twod-divider-edge twod-line-outline" pointer-events="none"`,
      ),
      line(
        x + panelW,
        topLeft.y,
        x + panelW,
        topLeft.y + height,
        `class="twod-divider-edge twod-line-outline" pointer-events="none"`,
      ),
    ];
  }
  return [
    rect(
      topLeft.x,
      topLeft.y,
      width,
      height,
      openingHitAttrs(cabinet.id, opening.id, opening.contentType, active),
    ),
    rect(
      topLeft.x + elevMm(scale, 6),
      topLeft.y + elevMm(scale, 6),
      Math.max(1, width - elevMm(scale, 12)),
      Math.max(1, height - elevMm(scale, 12)),
      `class="twod-empty-cavity twod-line-interior" fill="none" pointer-events="none"`,
    ),
  ];
}
