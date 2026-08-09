import type { CabinetInstance } from "../cabinetDimensions";
import type {
  CabinetElevationFaceLayout,
  OpeningFaceRect,
} from "../openingLayout";
import { elevMm, openingHitAttrs } from "./faceMetrics";
import { faceToSvg, line, rect } from "./svgPrimitives";

export function renderOpenShelf(
  opening: OpeningFaceRect,
  cabinet: CabinetInstance,
  cabinetSvgX: number,
  cabinetSvgY: number,
  layout: CabinetElevationFaceLayout,
  scale: number,
  active: boolean,
): string[] {
  const elements: string[] = [];
  const faceOriginX = layout.leftFillerMm;
  const faceOriginY = layout.toeKickHeightMm;
  const boardMm = layout.boardThicknessMm;
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
  const inset = elevMm(scale, Math.min(12, boardMm * 0.5));

  elements.push(
    rect(
      topLeft.x,
      topLeft.y,
      width,
      height,
      openingHitAttrs(cabinet.id, opening.id, opening.contentType, active),
    ),
  );

  // Interior cavity outline
  elements.push(
    rect(
      topLeft.x + inset,
      topLeft.y + inset,
      Math.max(1, width - inset * 2),
      Math.max(1, height - inset * 2),
      `class="twod-shelf-cavity twod-line-interior" fill="none" pointer-events="none"`,
    ),
  );

  const shelves = Math.max(0, opening.shelfCount);
  const shelfThick = elevMm(scale, boardMm);
  for (let index = 1; index <= shelves; index += 1) {
    const sy = topLeft.y + (height * index) / (shelves + 1);
    elements.push(
      rect(
        topLeft.x + inset,
        sy - shelfThick / 2,
        Math.max(1, width - inset * 2),
        shelfThick,
        `class="twod-shelf-board" pointer-events="none"`,
      ),
      line(
        topLeft.x + inset,
        sy,
        topLeft.x + width - inset,
        sy,
        `class="twod-cabinet-opening twod-shelf-line twod-line-interior" pointer-events="none"`,
      ),
    );
    const pinSetback = elevMm(scale, 30);
    elements.push(
      line(
        topLeft.x + pinSetback,
        sy - elevMm(scale, 8),
        topLeft.x + pinSetback,
        sy + elevMm(scale, 8),
        `class="twod-shelf-pin twod-line-hidden" pointer-events="none"`,
      ),
      line(
        topLeft.x + width - pinSetback,
        sy - elevMm(scale, 8),
        topLeft.x + width - pinSetback,
        sy + elevMm(scale, 8),
        `class="twod-shelf-pin twod-line-hidden" pointer-events="none"`,
      ),
    );
  }
  return elements;
}
