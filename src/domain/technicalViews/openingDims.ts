import type { CabinetInstance } from "../cabinetDimensions";
import { clampProjectDrafting } from "../draftingAnnotations";
import {
  layoutCabinetElevationFace,
  type OpeningFaceRect,
} from "../openingLayout";
import { SCALE } from "./constants";
import { DIM_OPENING_OFFSET } from "./constants";
import {
  overallSpanHorizontal,
  overallSpanVertical,
} from "./dimGraphics";
import { resolveDimOpts } from "./resolveDimOpts";
import { dimensionLabel } from "./svgPrimitives";
import type { TechnicalViewOptions } from "./types";

function openingTargets(
  openings: OpeningFaceRect[],
  activeOpeningId: string | null | undefined,
): OpeningFaceRect[] {
  if (!openings.length) return [];
  if (activeOpeningId) {
    const active = openings.find((item) => item.id === activeOpeningId);
    if (active) return [active];
  }
  // Authored default: primary face openings only (skip tiny dividers)
  return openings.filter(
    (item) =>
      item.contentType !== "divider" &&
      item.widthMm >= 80 &&
      item.heightMm >= 80,
  ).slice(0, 4);
}

/**
 * Elevation opening dimensions for the active cabinet face.
 * Width above opening, height to the right — grip-editable.
 */
export function openingElevationDimensions(
  cabinet: CabinetInstance,
  roomHeightMm: number,
  ox: number,
  oy: number,
  options: TechnicalViewOptions,
  axis: "x" | "z",
) {
  const layout = layoutCabinetElevationFace(cabinet.config);
  const targets = openingTargets(
    layout.openings,
    options.activeOpeningId ??
      (options.activeCabinetId === cabinet.id
        ? layout.activeOpeningId
        : null),
  );
  if (!targets.length) return [];

  const drafting = clampProjectDrafting(options.drafting);
  const floorY = oy + roomHeightMm / SCALE / 2;
  const fpWidth =
    axis === "x"
      ? cabinet.config.dimensions.width
      : cabinet.config.dimensions.depth;
  const center =
    axis === "x" ? cabinet.placement.x : cabinet.placement.z;
  const carcassLeft = ox + center / SCALE - fpWidth / SCALE / 2;
  const toe = layout.toeKickHeightMm;
  const elements: string[] = [];

  for (const opening of targets) {
    const left =
      carcassLeft + (layout.leftFillerMm + opening.xMm) / SCALE;
    const right = left + opening.widthMm / SCALE;
    const bottomY =
      floorY - (cabinet.placement.y + toe + opening.yMm) / SCALE;
    const topY = bottomY - opening.heightMm / SCALE;
    const widthId = `opening-${cabinet.id}-${opening.id}-w`;
    const heightId = `opening-${cabinet.id}-${opening.id}-h`;

    elements.push(
      ...overallSpanHorizontal(
        left,
        right,
        topY - DIM_OPENING_OFFSET,
        dimensionLabel(opening.widthMm),
        topY,
        "opening",
        resolveDimOpts(drafting, widthId, options.activeDraftObjectId),
      ),
      ...overallSpanVertical(
        topY,
        bottomY,
        right + DIM_OPENING_OFFSET,
        dimensionLabel(opening.heightMm),
        right,
        "opening",
        "start",
        resolveDimOpts(drafting, heightId, options.activeDraftObjectId),
      ),
    );
  }

  return elements;
}
