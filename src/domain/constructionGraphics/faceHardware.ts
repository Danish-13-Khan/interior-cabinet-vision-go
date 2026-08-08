import type { CabinetElevationFaceLayout } from "../openingLayout";
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
      `class="twod-toe-kick" fill="rgba(68,64,60,0.2)" pointer-events="none"`,
    ),
    line(
      cabinetSvgX,
      y,
      cabinetSvgX + cabinetSvgWidth,
      y,
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
      rect(
        cabinetSvgX,
        cabinetSvgY,
        w,
        bodyH,
        `class="twod-filler" fill="rgba(148,163,184,0.4)" pointer-events="none"`,
      ),
      line(
        cabinetSvgX + w / 2,
        cabinetSvgY + 2,
        cabinetSvgX + w / 2,
        cabinetSvgY + bodyH - 2,
        `class="twod-filler-hatch twod-line-reference" pointer-events="none"`,
      ),
    );
  }
  if (layout.rightFillerMm > 0) {
    const w = layout.rightFillerMm / scale;
    elements.push(
      rect(
        cabinetSvgX + cabinetSvgWidth - w,
        cabinetSvgY,
        w,
        bodyH,
        `class="twod-filler" fill="rgba(148,163,184,0.4)" pointer-events="none"`,
      ),
      line(
        cabinetSvgX + cabinetSvgWidth - w / 2,
        cabinetSvgY + 2,
        cabinetSvgX + cabinetSvgWidth - w / 2,
        cabinetSvgY + bodyH - 2,
        `class="twod-filler-hatch twod-line-reference" pointer-events="none"`,
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
  const panelW = Math.max(2.5, Math.min(5, boardThicknessMm / scale));
  if (layout.leftEndPanel) {
    elements.push(
      rect(
        cabinetSvgX - panelW,
        cabinetSvgY,
        panelW,
        cabinetSvgHeight,
        `class="twod-end-panel" fill="#6b6560" pointer-events="none"`,
      ),
      line(
        cabinetSvgX - panelW,
        cabinetSvgY,
        cabinetSvgX - panelW,
        cabinetSvgY + cabinetSvgHeight,
        `class="twod-end-panel-edge" pointer-events="none"`,
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
        `class="twod-end-panel" fill="#6b6560" pointer-events="none"`,
      ),
      line(
        cabinetSvgX + cabinetSvgWidth + panelW,
        cabinetSvgY,
        cabinetSvgX + cabinetSvgWidth + panelW,
        cabinetSvgY + cabinetSvgHeight,
        `class="twod-end-panel-edge" pointer-events="none"`,
      ),
    );
  }
  return elements;
}
