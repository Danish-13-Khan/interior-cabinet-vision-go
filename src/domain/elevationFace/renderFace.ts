import type { CabinetInstance } from "../cabinetDimensions";
import {
  layoutCabinetElevationFace,
  type CabinetElevationFaceLayout,
} from "../openingLayout";
import {
  renderCarcassFillers,
  renderEndPanels,
  renderToeKickBand,
} from "../constructionGraphics";
import { renderCarcassFrame } from "./carcassFrame";
import {
  renderDividerOrEmpty,
  renderDoorLeaf,
  renderDrawerStack,
  renderOpenShelf,
} from "./renderOpenings";
import {
  renderOpeningBoundaries,
  renderOpeningChrome,
} from "./openingChrome";
import { renderGolaProfiles } from "./resolvedFronts";
import { hasSlidingFronts, renderSlidingLeaves } from "./slidingLeaves";
import type { ElevationSvgOptions } from "./svgPrimitives";

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
  const boardT = layout.boardThicknessMm;

  elements.push(
    ...renderToeKickBand(
      cabinetSvgX,
      cabinetSvgY,
      cabinetSvgWidth,
      cabinetSvgHeight,
      layout,
      scale,
      cabinet.config.toeKickInset ?? 0,
    ),
    ...renderCarcassFillers(
      cabinetSvgX,
      cabinetSvgY,
      cabinetSvgWidth,
      cabinetSvgHeight,
      layout,
      scale,
    ),
    ...renderEndPanels(
      cabinetSvgX,
      cabinetSvgY,
      cabinetSvgWidth,
      cabinetSvgHeight,
      layout,
      boardT,
      scale,
    ),
    ...renderCarcassFrame(
      cabinetSvgX,
      cabinetSvgY,
      cabinetSvgWidth,
      cabinetSvgHeight,
      layout,
      scale,
    ),
  );

  elements.push(
    ...renderOpeningBoundaries(layout, cabinetSvgX, cabinetSvgY, scale),
  );

  const sliding = hasSlidingFronts(cabinet);
  for (const opening of layout.openings) {
    const active = activeId === opening.id;
    if (opening.contentType === "door") {
      // Sliding shutters span the whole face; they are drawn once below, with no hinge marks.
      if (!sliding) elements.push(
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
    elements.push(
      ...renderOpeningChrome(
        opening,
        cabinet.id,
        layout,
        cabinetSvgX,
        cabinetSvgY,
        scale,
        active,
      ),
    );
  }
  if (sliding) elements.push(...renderSlidingLeaves(cabinet, layout, cabinetSvgX, cabinetSvgY, scale, activeId));
  elements.push(...renderGolaProfiles(cabinet.config, layout, cabinetSvgX, cabinetSvgY, scale));

  return elements;
}

export function describeElevationFace(layout: CabinetElevationFaceLayout): string {
  return `${layout.openings.length} openings · clear ${Math.round(layout.clearWidthMm)}×${Math.round(layout.clearHeightMm)} · toe ${layout.toeKickHeightMm}`;
}
