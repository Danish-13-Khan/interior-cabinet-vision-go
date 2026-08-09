import type { CabinetProject } from "../cabinetDimensions";
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
import { GRID_STEP_MM, SCALE } from "./constants";
import { line } from "./svgPrimitives";
import type { TechnicalViewKind, TechnicalViewOptions } from "./types";

export { titleBlock } from "./titleBlock";
export {
  selectedElevationDimensions,
  selectedPlanDimensions,
} from "./selectedDims";
export { openingElevationDimensions } from "./openingDims";

export function resolveDisplay(options: TechnicalViewOptions): DraftingDisplayPreferences {
  return clampDraftingDisplay({
    showCabinetTags: options.showCabinetTags,
    showOpeningTags: options.showOpeningTags,
    showApplianceTags: options.showApplianceTags,
    showDimensionChains: options.showDimensionChains,
    showOverallDims: options.showOverallDims,
    showSelectedDims: options.showSelectedDims,
    showOpeningDims: options.showOpeningDims,
    showRunDims: options.showRunDims,
    showClearanceDims: options.showClearanceDims,
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
