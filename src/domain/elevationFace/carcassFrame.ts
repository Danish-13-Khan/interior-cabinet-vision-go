import type { CabinetElevationFaceLayout } from "../openingLayout";
import { elevMm } from "./faceMetrics";
import { line, rect } from "./svgPrimitives";

/**
 * Draw carcass side/top boards so openings sit in a clear face opening.
 */
export function renderCarcassFrame(
  cabinetSvgX: number,
  cabinetSvgY: number,
  cabinetSvgWidth: number,
  cabinetSvgHeight: number,
  layout: CabinetElevationFaceLayout,
  scale: number,
): string[] {
  const board = elevMm(scale, layout.boardThicknessMm);
  const toeH = layout.toeKickHeightMm / scale;
  const leftF = layout.leftFillerMm / scale;
  const rightF = layout.rightFillerMm / scale;
  const bodyH = cabinetSvgHeight - toeH;
  const faceX = cabinetSvgX + leftF;
  const faceW = cabinetSvgWidth - leftF - rightF;
  const elements: string[] = [];

  // Left / right carcass sides within clear face band
  elements.push(
    rect(
      faceX,
      cabinetSvgY,
      board,
      bodyH,
      `class="twod-carcass-board twod-carcass-side-board" pointer-events="none"`,
    ),
    rect(
      faceX + faceW - board,
      cabinetSvgY,
      board,
      bodyH,
      `class="twod-carcass-board twod-carcass-side-board" pointer-events="none"`,
    ),
  );

  // Top rail
  elements.push(
    rect(
      faceX,
      cabinetSvgY,
      faceW,
      board,
      `class="twod-carcass-board twod-carcass-top-rail" pointer-events="none"`,
    ),
  );

  // Bottom rail above toe kick
  if (bodyH > board * 2) {
    elements.push(
      rect(
        faceX + board,
        cabinetSvgY + bodyH - board,
        Math.max(1, faceW - board * 2),
        board,
        `class="twod-carcass-board twod-carcass-bottom-rail" pointer-events="none"`,
      ),
    );
  }

  // Inner clear-opening outline
  const clearX = faceX + board;
  const clearY = cabinetSvgY + board;
  const clearW = Math.max(1, faceW - board * 2);
  const clearH = Math.max(1, bodyH - board * 2);
  elements.push(
    rect(
      clearX,
      clearY,
      clearW,
      clearH,
      `class="twod-clear-opening twod-line-interior" fill="none" pointer-events="none"`,
    ),
  );

  // Side edge emphasis
  elements.push(
    line(
      faceX + board,
      cabinetSvgY + board,
      faceX + board,
      cabinetSvgY + bodyH - board,
      `class="twod-line-outline twod-carcass-edge" pointer-events="none"`,
    ),
    line(
      faceX + faceW - board,
      cabinetSvgY + board,
      faceX + faceW - board,
      cabinetSvgY + bodyH - board,
      `class="twod-line-outline twod-carcass-edge" pointer-events="none"`,
    ),
  );

  return elements;
}
