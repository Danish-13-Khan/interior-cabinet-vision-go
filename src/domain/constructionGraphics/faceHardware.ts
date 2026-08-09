import type { CabinetElevationFaceLayout } from "../openingLayout";
import { hatchFill } from "./hatch";
import { line, rect } from "./svg";

/** Stronger toe-kick band with recess return line. */
export function renderToeKickBand(
  cabinetSvgX: number,
  cabinetSvgY: number,
  cabinetSvgWidth: number,
  cabinetSvgHeight: number,
  layout: CabinetElevationFaceLayout,
  scale: number,
  toeKickInsetMm = 0,
): string[] {
  if (layout.toeKickHeightMm <= 0) return [];
  const toeH = layout.toeKickHeightMm / scale;
  const y = cabinetSvgY + cabinetSvgHeight - toeH;
  const elements = [
    rect(
      cabinetSvgX,
      y,
      cabinetSvgWidth,
      toeH,
      `class="twod-toe-kick" pointer-events="none"`,
    ),
    line(
      cabinetSvgX,
      y,
      cabinetSvgX + cabinetSvgWidth,
      y,
      `class="twod-toe-kick-line twod-line-outline" pointer-events="none"`,
    ),
    line(
      cabinetSvgX,
      y + toeH,
      cabinetSvgX + cabinetSvgWidth,
      y + toeH,
      `class="twod-toe-kick-line" pointer-events="none"`,
    ),
  ];
  if (toeKickInsetMm > 0) {
    const inset = Math.min(cabinetSvgWidth * 0.35, toeKickInsetMm / scale);
    elements.push(
      line(
        cabinetSvgX + inset,
        y,
        cabinetSvgX + inset,
        y + toeH,
        `class="twod-toe-kick-return twod-line-hidden" pointer-events="none"`,
      ),
      line(
        cabinetSvgX + cabinetSvgWidth - inset,
        y,
        cabinetSvgX + cabinetSvgWidth - inset,
        y + toeH,
        `class="twod-toe-kick-return twod-line-hidden" pointer-events="none"`,
      ),
    );
  }
  return elements;
}

export function renderCarcassFillers(
  cabinetSvgX: number,
  cabinetSvgY: number,
  cabinetSvgWidth: number,
  cabinetSvgHeight: number,
  layout: CabinetElevationFaceLayout,
  scale: number,
): string[] {
  const elements: string[] = [];
  const bodyH = cabinetSvgHeight - layout.toeKickHeightMm / scale;
  if (layout.leftFillerMm > 0) {
    const w = layout.leftFillerMm / scale;
    elements.push(
      ...hatchFill(
        cabinetSvgX,
        cabinetSvgY,
        w,
        bodyH,
        "filler",
        "twod-filler twod-filler-board",
      ),
    );
  }
  if (layout.rightFillerMm > 0) {
    const w = layout.rightFillerMm / scale;
    elements.push(
      ...hatchFill(
        cabinetSvgX + cabinetSvgWidth - w,
        cabinetSvgY,
        w,
        bodyH,
        "filler",
        "twod-filler twod-filler-board",
      ),
    );
  }
  return elements;
}

export function renderEndPanels(
  cabinetSvgX: number,
  cabinetSvgY: number,
  cabinetSvgWidth: number,
  cabinetSvgHeight: number,
  layout: CabinetElevationFaceLayout,
  boardThicknessMm: number,
  scale: number,
): string[] {
  const elements: string[] = [];
  const panelW = Math.max(1.8, boardThicknessMm / scale);
  if (layout.leftEndPanel) {
    elements.push(
      rect(
        cabinetSvgX - panelW,
        cabinetSvgY,
        panelW,
        cabinetSvgHeight,
        `class="twod-end-panel" pointer-events="none"`,
      ),
      line(
        cabinetSvgX - panelW,
        cabinetSvgY,
        cabinetSvgX - panelW,
        cabinetSvgY + cabinetSvgHeight,
        `class="twod-end-panel-edge" pointer-events="none"`,
      ),
      line(
        cabinetSvgX,
        cabinetSvgY,
        cabinetSvgX,
        cabinetSvgY + cabinetSvgHeight,
        `class="twod-end-panel-edge twod-line-outline" pointer-events="none"`,
      ),
    );
  }
  if (layout.rightEndPanel) {
    elements.push(
      rect(
        cabinetSvgX + cabinetSvgWidth,
        cabinetSvgY,
        panelW,
        cabinetSvgHeight,
        `class="twod-end-panel" pointer-events="none"`,
      ),
      line(
        cabinetSvgX + cabinetSvgWidth + panelW,
        cabinetSvgY,
        cabinetSvgX + cabinetSvgWidth + panelW,
        cabinetSvgY + cabinetSvgHeight,
        `class="twod-end-panel-edge" pointer-events="none"`,
      ),
      line(
        cabinetSvgX + cabinetSvgWidth,
        cabinetSvgY,
        cabinetSvgX + cabinetSvgWidth,
        cabinetSvgY + cabinetSvgHeight,
        `class="twod-end-panel-edge twod-line-outline" pointer-events="none"`,
      ),
    );
  }
  return elements;
}
