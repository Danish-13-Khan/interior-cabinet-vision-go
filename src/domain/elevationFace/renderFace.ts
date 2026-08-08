import type { CabinetInstance } from "../cabinetDimensions";
import {
  layoutCabinetElevationFace,
  type CabinetElevationFaceLayout,
} from "../openingLayout";
import {
  renderDividerOrEmpty,
  renderDoorLeaf,
  renderDrawerStack,
  renderOpenShelf,
} from "./renderOpenings";
import { line, rect, type ElevationSvgOptions } from "./svgPrimitives";

/**
 * Draw engineered cabinet face details for front/side elevation.
 * Coordinates: cabinetSvgX/Y is top-left of the carcass box in SVG space.
 */
export function renderElevationFaceGraphics(
  cabinet: CabinetInstance,
  cabinetSvgX: number,
  cabinetSvgY: number,
  cabinetSvgWidth: number,
  cabinetSvgHeight: number,
  options: ElevationSvgOptions,
): string[] {
  const elements: string[] = [];
  if (options.showDetails === false) return elements;

  const layout = layoutCabinetElevationFace(cabinet.config);
  const scale = options.scale;
  const activeId =
    options.activeOpeningId ?? layout.activeOpeningId ?? null;

  // Toe kick band
  if (layout.toeKickHeightMm > 0) {
    const toeH = layout.toeKickHeightMm / scale;
    elements.push(
      rect(
        cabinetSvgX,
        cabinetSvgY + cabinetSvgHeight - toeH,
        cabinetSvgWidth,
        toeH,
        `class="twod-toe-kick" fill="rgba(68,64,60,0.18)" stroke="#57534e" stroke-width="1" pointer-events="none"`,
      ),
    );
    elements.push(
      line(
        cabinetSvgX,
        cabinetSvgY + cabinetSvgHeight - toeH,
        cabinetSvgX + cabinetSvgWidth,
        cabinetSvgY + cabinetSvgHeight - toeH,
        `class="twod-toe-kick-line" stroke="#57534e" stroke-width="1.1" pointer-events="none"`,
      ),
    );
  }

  // Carcass fillers
  if (layout.leftFillerMm > 0) {
    const w = layout.leftFillerMm / scale;
    elements.push(
      rect(
        cabinetSvgX,
        cabinetSvgY,
        w,
        cabinetSvgHeight - layout.toeKickHeightMm / scale,
        `class="twod-filler" fill="rgba(148,163,184,0.35)" stroke="#64748b" stroke-width="0.9" pointer-events="none"`,
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
        cabinetSvgHeight - layout.toeKickHeightMm / scale,
        `class="twod-filler" fill="rgba(148,163,184,0.35)" stroke="#64748b" stroke-width="0.9" pointer-events="none"`,
      ),
    );
  }

  // End panels as thicker outer edges
  if (layout.leftEndPanel) {
    elements.push(
      rect(
        cabinetSvgX - 3,
        cabinetSvgY,
        3,
        cabinetSvgHeight,
        `class="twod-end-panel" fill="#78716c" stroke="#44403c" stroke-width="0.6" pointer-events="none"`,
      ),
    );
  }
  if (layout.rightEndPanel) {
    elements.push(
      rect(
        cabinetSvgX + cabinetSvgWidth,
        cabinetSvgY,
        3,
        cabinetSvgHeight,
        `class="twod-end-panel" fill="#78716c" stroke="#44403c" stroke-width="0.6" pointer-events="none"`,
      ),
    );
  }

  for (const opening of layout.openings) {
    const active = activeId === opening.id;
    if (opening.contentType === "door") {
      elements.push(
        ...renderDoorLeaf(
          opening,
          cabinet,
          cabinetSvgX,
          cabinetSvgY,
          layout,
          scale,
          active,
        ),
      );
    } else if (opening.contentType === "drawer-stack") {
      elements.push(
        ...renderDrawerStack(
          opening,
          cabinet,
          cabinetSvgX,
          cabinetSvgY,
          layout,
          scale,
          active,
        ),
      );
    } else if (opening.contentType === "open-shelf") {
      elements.push(
        ...renderOpenShelf(
          opening,
          cabinet,
          cabinetSvgX,
          cabinetSvgY,
          layout,
          scale,
          active,
        ),
      );
    } else {
      elements.push(
        ...renderDividerOrEmpty(
          opening,
          cabinet,
          cabinetSvgX,
          cabinetSvgY,
          layout,
          scale,
          active,
        ),
      );
    }
  }

  return elements;
}

export function describeElevationFace(layout: CabinetElevationFaceLayout): string {
  return `${layout.openings.length} openings · face ${Math.round(layout.faceWidthMm)}×${Math.round(layout.faceHeightMm)} · toe ${layout.toeKickHeightMm}`;
}
