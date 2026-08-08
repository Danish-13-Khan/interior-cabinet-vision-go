import {
  getFootprintDimensions,
  type CabinetInstance,
  type CabinetProject,
} from "../cabinetDimensions";
import {
  clampDraftingDisplay,
  clampProjectDrafting,
  draftingVisibleInView,
  renderLeaderSvg,
  renderNoteSvg,
  type DraftingDisplayPreferences,
  type ProjectDrafting,
} from "../draftingAnnotations";
import type { SnapGuide } from "../placementSnap";
import { resolveSelectedCabinets } from "../placementSnap";
import { GRID_STEP_MM, SCALE } from "./constants";
import { dimTick } from "./dimGraphics";
import { resolveDimOpts } from "./resolveDimOpts";
import { dimensionLabel, line, text } from "./svgPrimitives";
import type { TechnicalViewKind, TechnicalViewOptions } from "./types";

export { titleBlock } from "./titleBlock";

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
    const fp = getFootprintDimensions(cabinet.config.dimensions, cabinet.placement.rotation);
    const ghost =
      options.ghostPlacement?.cabinetId === cabinet.id ? options.ghostPlacement : null;
    const cx = ox + (ghost?.x ?? cabinet.placement.x) / SCALE;
    const cy = oy + (ghost?.z ?? cabinet.placement.z) / SCALE;
    const bw = fp.width / SCALE;
    const bd = fp.depth / SCALE;

    const widthId = `selected-${cabinet.id}-w`;
    const depthId = `selected-${cabinet.id}-d`;
    const widthOpts = resolveDimOpts(drafting, widthId, options.activeDraftObjectId);
    const depthOpts = resolveDimOpts(drafting, depthId, options.activeDraftObjectId);

    const widthY = cy + bd / 2 + 12 + (widthOpts.dy ?? 0);
    const wdx = widthOpts.dx ?? 0;
    elements.push(
      line(
        cx - bw / 2 + wdx,
        widthY,
        cx + bw / 2 + wdx,
        widthY,
        `class="twod-dim twod-dim-selected${widthOpts.selected ? " is-selected" : ""}" data-dim-id="${widthId}" data-draft-object="dim" data-dim="selected" data-dim-axis="y" style="cursor:ns-resize"`,
      ),
      line(
        cx - bw / 2 + wdx,
        widthY,
        cx + bw / 2 + wdx,
        widthY,
        `class="twod-dim twod-dim-hit" data-dim-id="${widthId}" data-draft-object="dim" data-dim-axis="y" style="cursor:ns-resize" stroke-width="10" opacity="0"`,
      ),
    );
    elements.push(dimTick(cx - bw / 2 + wdx, widthY, true, "selected", widthOpts));
    elements.push(dimTick(cx + bw / 2 + wdx, widthY, true, "selected", widthOpts));
    elements.push(
      text(
        cx + wdx,
        widthY - 3,
        `${dimensionLabel(fp.width)} mm`,
        `class="twod-annotation twod-dim-selected" font-size="7" text-anchor="middle" pointer-events="none"`,
      ),
    );

    const depthX = cx + bw / 2 + 12 + (depthOpts.dx ?? 0);
    const ddy = depthOpts.dy ?? 0;
    elements.push(
      line(
        depthX,
        cy - bd / 2 + ddy,
        depthX,
        cy + bd / 2 + ddy,
        `class="twod-dim twod-dim-selected${depthOpts.selected ? " is-selected" : ""}" data-dim-id="${depthId}" data-draft-object="dim" data-dim="selected" data-dim-axis="x" style="cursor:ew-resize"`,
      ),
      line(
        depthX,
        cy - bd / 2 + ddy,
        depthX,
        cy + bd / 2 + ddy,
        `class="twod-dim twod-dim-hit" data-dim-id="${depthId}" data-draft-object="dim" data-dim-axis="x" style="cursor:ew-resize" stroke-width="10" opacity="0"`,
      ),
    );
    elements.push(dimTick(depthX, cy - bd / 2 + ddy, false, "selected", depthOpts));
    elements.push(dimTick(depthX, cy + bd / 2 + ddy, false, "selected", depthOpts));
    elements.push(
      text(
        depthX + 3,
        cy + 2.5 + ddy,
        `${dimensionLabel(fp.depth)} mm`,
        `class="twod-annotation twod-dim-selected" font-size="7" text-anchor="start" pointer-events="none"`,
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
    const fp = getFootprintDimensions(cabinet.config.dimensions, cabinet.placement.rotation);
    const span = axis === "x" ? fp.width : fp.depth;
    const ghost =
      options.ghostPlacement?.cabinetId === cabinet.id ? options.ghostPlacement : null;
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

    const heightId = `selected-${cabinet.id}-h`;
    const widthId = `selected-${cabinet.id}-w`;
    const heightOpts = resolveDimOpts(drafting, heightId, options.activeDraftObjectId);
    const widthOpts = resolveDimOpts(drafting, widthId, options.activeDraftObjectId);

    const heightX = right + 10 + (heightOpts.dx ?? 0);
    const hdy = heightOpts.dy ?? 0;
    elements.push(
      line(
        heightX,
        topY + hdy,
        heightX,
        bottomY + hdy,
        `class="twod-dim twod-dim-selected${heightOpts.selected ? " is-selected" : ""}" data-dim-id="${heightId}" data-draft-object="dim" data-dim="selected" data-dim-axis="x" style="cursor:ew-resize"`,
      ),
      line(
        heightX,
        topY + hdy,
        heightX,
        bottomY + hdy,
        `class="twod-dim twod-dim-hit" data-dim-id="${heightId}" data-draft-object="dim" data-dim-axis="x" style="cursor:ew-resize" stroke-width="10" opacity="0"`,
      ),
    );
    elements.push(dimTick(heightX, topY + hdy, false, "selected", heightOpts));
    elements.push(dimTick(heightX, bottomY + hdy, false, "selected", heightOpts));
    elements.push(
      text(
        heightX + 3,
        (topY + bottomY) / 2 + 2.5 + hdy,
        `${dimensionLabel(height)} mm`,
        `class="twod-annotation twod-dim-selected" font-size="7" text-anchor="start" pointer-events="none"`,
      ),
    );

    const widthY = topY - 8 + (widthOpts.dy ?? 0);
    const wdx = widthOpts.dx ?? 0;
    elements.push(
      line(
        left + wdx,
        widthY,
        right + wdx,
        widthY,
        `class="twod-dim twod-dim-selected${widthOpts.selected ? " is-selected" : ""}" data-dim-id="${widthId}" data-draft-object="dim" data-dim="selected" data-dim-axis="y" style="cursor:ns-resize"`,
      ),
      line(
        left + wdx,
        widthY,
        right + wdx,
        widthY,
        `class="twod-dim twod-dim-hit" data-dim-id="${widthId}" data-draft-object="dim" data-dim-axis="y" style="cursor:ns-resize" stroke-width="10" opacity="0"`,
      ),
    );
    elements.push(dimTick(left + wdx, widthY, true, "selected", widthOpts));
    elements.push(dimTick(right + wdx, widthY, true, "selected", widthOpts));
    elements.push(
      text(
        x + wdx,
        widthY - 2,
        `${dimensionLabel(span)} mm`,
        `class="twod-annotation twod-dim-selected" font-size="7" text-anchor="middle" pointer-events="none"`,
      ),
    );

    if (yMm > 0) {
      const clearX = left - 10;
      elements.push(
        line(
          clearX,
          bottomY,
          clearX,
          floorY,
          `class="twod-dim twod-wall-clearance" data-dim="clearance"`,
        ),
        text(
          clearX - 3,
          (bottomY + floorY) / 2 + 2.5,
          `${dimensionLabel(yMm)} mm`,
          `class="twod-annotation twod-wall-clearance" font-size="6.5" text-anchor="end" pointer-events="none"`,
        ),
      );
    }
  }

  return elements;
}

export function resolveDisplay(options: TechnicalViewOptions): DraftingDisplayPreferences {
  return clampDraftingDisplay({
    showCabinetTags: options.showCabinetTags,
    showOpeningTags: options.showOpeningTags,
    showApplianceTags: options.showApplianceTags,
    showDimensionChains: options.showDimensionChains,
    showWallLabels: options.showWallLabels,
    showRunBands: options.showRunBands,
    showRunLabels: options.showRunLabels,
    showFillers: options.showFillers,
    showCountertopSpans: options.showCountertopSpans,
    dimMinSegmentMm: options.dimMinSegmentMm,
  });
}

export function draftingLayer(
  drafting: ProjectDrafting | undefined,
  view: TechnicalViewKind,
  mapPoint: (point: { x: number; y: number; z: number }) => { x: number; y: number },
  activeDraftObjectId?: string | null,
) {
  const sheetView =
    view === "section" || view === "detail" || view === "report"
      ? "side"
      : view === "top"
        ? "top"
        : view;
  const safe = clampProjectDrafting(drafting);
  const elements: string[] = [];
  for (const note of safe.notes) {
    if (!draftingVisibleInView(note.view, sheetView)) continue;
    const point = mapPoint(note.anchor);
    elements.push(
      ...renderNoteSvg(point.x, point.y, note.text, {
        id: note.id,
        selected: activeDraftObjectId === note.id,
      }),
    );
  }
  for (const leader of safe.leaders) {
    if (!draftingVisibleInView(leader.view, sheetView)) continue;
    const target = mapPoint(leader.target);
    const label = mapPoint(leader.label);
    elements.push(
      ...renderLeaderSvg(target.x, target.y, label.x, label.y, leader.text, {
        id: leader.id,
        selected: activeDraftObjectId === leader.id,
      }),
    );
  }
  return elements;
}

export function cabinetIndexMap(project: CabinetProject) {
  return new Map(project.cabinets.map((cabinet, index) => [cabinet.id, index]));
}

export function gridLines(
  ox: number,
  oy: number,
  roomW: number,
  roomD: number,
  stepMm = GRID_STEP_MM,
) {
  const elements: string[] = [];
  const left = ox - roomW / SCALE / 2;
  const right = ox + roomW / SCALE / 2;
  const top = oy - roomD / SCALE / 2;
  const bottom = oy + roomD / SCALE / 2;

  for (let x = -roomW / 2; x <= roomW / 2; x += stepMm) {
    elements.push(
      line(ox + x / SCALE, top, ox + x / SCALE, bottom, `class="twod-grid"`),
    );
  }
  for (let z = -roomD / 2; z <= roomD / 2; z += stepMm) {
    elements.push(
      line(left, oy + z / SCALE, right, oy + z / SCALE, `class="twod-grid"`),
    );
  }
  return elements;
}

export function elevationGrid(
  ox: number,
  oy: number,
  roomSpanMm: number,
  roomHeightMm: number,
  stepMm = GRID_STEP_MM,
) {
  const elements: string[] = [];
  const left = ox - roomSpanMm / SCALE / 2;
  const right = ox + roomSpanMm / SCALE / 2;
  const top = oy - roomHeightMm / SCALE / 2;
  const bottom = oy + roomHeightMm / SCALE / 2;

  for (let x = -roomSpanMm / 2; x <= roomSpanMm / 2; x += stepMm) {
    elements.push(
      line(ox + x / SCALE, top, ox + x / SCALE, bottom, `class="twod-grid"`),
    );
  }
  for (let y = 0; y <= roomHeightMm; y += stepMm) {
    const sy = oy + roomHeightMm / SCALE / 2 - y / SCALE;
    elements.push(line(left, sy, right, sy, `class="twod-grid"`));
  }
  return elements;
}

export function snapGuideLines(
  guides: SnapGuide[],
  ox: number,
  oy: number,
  roomSpanMm: number,
  roomCrossMm: number,
  view: TechnicalViewKind,
) {
  const elements: string[] = [];
  const left = ox - roomSpanMm / SCALE / 2;
  const right = ox + roomSpanMm / SCALE / 2;
  const top = oy - roomCrossMm / SCALE / 2;
  const bottom = oy + roomCrossMm / SCALE / 2;

  for (const guide of guides) {
    const cls = `twod-guide twod-guide-${guide.kind}`;

    if (view === "top") {
      if (guide.axis === "x") {
        const x = ox + guide.positionMm / SCALE;
        elements.push(line(x, top, x, bottom, `class="${cls}"`));
      } else if (guide.axis === "z") {
        const z = oy + guide.positionMm / SCALE;
        elements.push(line(left, z, right, z, `class="${cls}"`));
      }
      continue;
    }

    if (guide.axis === "y") {
      const y = oy + roomCrossMm / SCALE / 2 - guide.positionMm / SCALE;
      elements.push(line(left, y, right, y, `class="${cls}"`));
    } else if (guide.axis === "x" || guide.axis === "z") {
      const x = ox + guide.positionMm / SCALE;
      elements.push(line(x, top, x, bottom, `class="${cls}"`));
    }
  }
  return elements;
}
