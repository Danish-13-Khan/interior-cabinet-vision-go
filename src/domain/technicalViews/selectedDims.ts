import {
  getFootprintDimensions,
  type CabinetInstance,
} from "../cabinetDimensions";
import { clampProjectDrafting } from "../draftingAnnotations";
import { resolveSelectedCabinets } from "../placementSnap";
import { DIM_SELECTED_OFFSET, SCALE } from "./constants";
import {
  overallSpanHorizontal,
  overallSpanVertical,
} from "./dimGraphics";
import { resolveDimOpts } from "./resolveDimOpts";
import { dimensionLabel } from "./svgPrimitives";
import type { TechnicalViewOptions } from "./types";

export function selectedPlanDimensions(
  cabinets: CabinetInstance[],
  ox: number,
  oy: number,
  options: TechnicalViewOptions,
) {
  const selected = resolveSelectedCabinets(
    cabinets,
    options.selectedCabinetIds,
    options.activeCabinetId,
  );
  const drafting = clampProjectDrafting(options.drafting);
  const elements: string[] = [];

  for (const cabinet of selected) {
    const fp = getFootprintDimensions(
      cabinet.config.dimensions,
      cabinet.placement.rotation,
    );
    const ghost =
      options.ghostPlacement?.cabinetId === cabinet.id
        ? options.ghostPlacement
        : null;
    const cx = ox + (ghost?.x ?? cabinet.placement.x) / SCALE;
    const cy = oy + (ghost?.z ?? cabinet.placement.z) / SCALE;
    const bw = fp.width / SCALE;
    const bd = fp.depth / SCALE;
    const left = cx - bw / 2;
    const right = cx + bw / 2;
    const top = cy - bd / 2;
    const bottom = cy + bd / 2;

    elements.push(
      ...overallSpanHorizontal(
        left,
        right,
        bottom + DIM_SELECTED_OFFSET,
        dimensionLabel(fp.width),
        bottom,
        "selected",
        resolveDimOpts(
          drafting,
          `selected-${cabinet.id}-w`,
          options.activeDraftObjectId,
        ),
      ),
      ...overallSpanVertical(
        top,
        bottom,
        right + DIM_SELECTED_OFFSET,
        dimensionLabel(fp.depth),
        right,
        "selected",
        "start",
        resolveDimOpts(
          drafting,
          `selected-${cabinet.id}-d`,
          options.activeDraftObjectId,
        ),
      ),
    );
  }

  return elements;
}

export function selectedElevationDimensions(
  cabinets: CabinetInstance[],
  roomHeightMm: number,
  ox: number,
  oy: number,
  options: TechnicalViewOptions,
  axis: "x" | "z",
  includeClearance = true,
) {
  const selected = resolveSelectedCabinets(
    cabinets,
    options.selectedCabinetIds,
    options.activeCabinetId,
  );
  const drafting = clampProjectDrafting(options.drafting);
  const elements: string[] = [];
  const floorY = oy + roomHeightMm / SCALE / 2;

  for (const cabinet of selected) {
    const fp = getFootprintDimensions(
      cabinet.config.dimensions,
      cabinet.placement.rotation,
    );
    const span = axis === "x" ? fp.width : fp.depth;
    const ghost =
      options.ghostPlacement?.cabinetId === cabinet.id
        ? options.ghostPlacement
        : null;
    const center =
      axis === "x"
        ? (ghost?.x ?? cabinet.placement.x)
        : (ghost?.z ?? cabinet.placement.z);
    const yMm = ghost?.y ?? cabinet.placement.y;
    const height = cabinet.config.dimensions.height;
    const x = ox + center / SCALE;
    const topY = floorY - (yMm + height) / SCALE;
    const bottomY = floorY - yMm / SCALE;
    const left = x - span / SCALE / 2;
    const right = x + span / SCALE / 2;

    elements.push(
      ...overallSpanVertical(
        topY,
        bottomY,
        right + DIM_SELECTED_OFFSET,
        dimensionLabel(height),
        right,
        "selected",
        "start",
        resolveDimOpts(
          drafting,
          `selected-${cabinet.id}-h`,
          options.activeDraftObjectId,
        ),
      ),
      ...overallSpanHorizontal(
        left,
        right,
        topY - DIM_SELECTED_OFFSET,
        dimensionLabel(span),
        topY,
        "selected",
        resolveDimOpts(
          drafting,
          `selected-${cabinet.id}-w`,
          options.activeDraftObjectId,
        ),
      ),
    );

    if (includeClearance && yMm > 0) {
      const clearId = `selected-${cabinet.id}-clear`;
      const clearOpts = resolveDimOpts(
        drafting,
        clearId,
        options.activeDraftObjectId,
      );
      const clearX = left - DIM_SELECTED_OFFSET + (clearOpts.dx ?? 0);
      const cdy = clearOpts.dy ?? 0;
      elements.push(
        ...overallSpanVertical(
          bottomY + cdy,
          floorY + cdy,
          clearX,
          dimensionLabel(yMm),
          left,
          "clearance",
          "end",
          clearOpts,
        ),
      );
    }
  }

  return elements;
}
