import {
  getFootprintDimensions,
  type CabinetProject,
} from "../cabinetDimensions";
import { clampJobMeta, formatJobSubtitle, formatJobTitle } from "../jobMeta";
import type { RoomConfig } from "../roomModel";
import { cabinetElevationGraphics } from "./cabinetSvg";
import { SCALE } from "./constants";
import {
  overallSpanHorizontal,
  overallSpanVertical,
} from "./dimGraphics";
import { overallDimX, overallDimY } from "./dimLayout";
import { elevationRoomShell } from "./elevationGraphics";
import {
  computeSheetFrame,
  sheetBackground,
  wrapTechnicalSvg,
} from "./sheetFrame";
import { dimensionLabel, line, text } from "./svgPrimitives";
import { titleBlock } from "./titleBlock";
import type { TechnicalViewOptions, TechnicalViewResult } from "./types";
import {
  cabinetIndexMap,
  draftingLayer,
  elevationGrid,
  resolveDisplay,
  selectedElevationDimensions,
} from "./viewLayers";

const CUT_TOLERANCE_MM = 700;

/**
 * Section A-A: vertical cut looking toward +X through mid-room X,
 * showing depth (Z) × height with cut cabinets emphasized.
 */
export function sectionView(
  project: CabinetProject,
  room: RoomConfig,
  options: TechnicalViewOptions = {},
): TechnicalViewResult {
  const rd = room.dimensions.depthMm;
  const rh = room.dimensions.heightMm;
  const display = resolveDisplay(options);
  const frame = computeSheetFrame({
    spanMm: rd,
    crossMm: rh,
    mode: options.mode,
    bottomLanes: 32,
    sideLanes: 24,
  });
  const { svgWidth, svgHeight, ox, oy } = frame;
  const elements: string[] = [];
  const indexMap = cabinetIndexMap(project);
  const sheetMeta =
    options.sheetMeta ??
    (() => {
      const job = clampJobMeta(project.job);
      return `${formatJobTitle(job)} · ${formatJobSubtitle(job)}`;
    })();

  elements.push(sheetBackground(svgWidth, svgHeight, frame.print));
  if (frame.print) {
    elements.push(
      ...titleBlock(
        svgWidth,
        options.title ?? "Section A-A",
        options.projectName ?? "Cabinet Project",
        "SECTION A-A",
        `1:${SCALE * 25}`,
        sheetMeta,
        options.sheetCode ?? "A-301",
      ),
    );
  }

  if (options.showGrid) {
    elements.push(...elevationGrid(ox, oy, rd, rh));
  }

  elements.push(
    ...elevationRoomShell(
      ox,
      oy,
      rd,
      rh,
      display.showWallLabels ? "SECTION A-A · LOOKING RIGHT" : null,
    ),
  );

  // Cut plane glyph (left of drawing)
  const cutX = ox - rd / SCALE / 2 - 10;
  const roomTop = oy - rh / SCALE / 2;
  const roomBottom = oy + rh / SCALE / 2;
  elements.push(
    line(cutX, roomTop, cutX, roomBottom, `class="twod-section-cut"`),
    text(
      cutX - 4,
      roomTop + 10,
      "A",
      `class="twod-section-mark" font-size="9" text-anchor="end"`,
    ),
    text(
      cutX - 4,
      roomBottom - 4,
      "A",
      `class="twod-section-mark" font-size="9" text-anchor="end"`,
    ),
  );

  const cutCabinets = project.cabinets.filter((cabinet) => {
    const fp = getFootprintDimensions(
      cabinet.config.dimensions,
      cabinet.placement.rotation,
    );
    return Math.abs(cabinet.placement.x) <= fp.width / 2 + CUT_TOLERANCE_MM;
  });

  for (const cabinet of cutCabinets) {
    const fp = getFootprintDimensions(
      cabinet.config.dimensions,
      cabinet.placement.rotation,
    );
    const depth = fp.depth / SCALE;
    const height = cabinet.config.dimensions.height / SCALE;
    const ghost =
      options.ghostPlacement?.cabinetId === cabinet.id
        ? options.ghostPlacement
        : null;
    const x = ox + (ghost?.z ?? cabinet.placement.z) / SCALE - depth / 2;
    const y =
      oy +
      rh / SCALE / 2 -
      ((ghost?.y ?? cabinet.placement.y) + cabinet.config.dimensions.height) /
        SCALE;
    const nearCut = Math.abs(cabinet.placement.x) <= fp.width / 2 + 120;
    elements.push(
      ...cabinetElevationGraphics(
        cabinet,
        x,
        y,
        depth,
        height,
        options,
        "",
        fp.depth,
        indexMap.get(cabinet.id) ?? 0,
      ),
    );
    if (nearCut) {
      elements.push(
        line(
          x,
          y,
          x + depth,
          y + height,
          `class="twod-section-hatch" pointer-events="none"`,
        ),
        line(
          x + depth,
          y,
          x,
          y + height,
          `class="twod-section-hatch" pointer-events="none"`,
        ),
      );
    }
  }

  elements.push(
    ...selectedElevationDimensions(cutCabinets, rh, ox, oy, options, "z"),
  );

  const roomLeft = ox - rd / SCALE / 2;
  const roomRight = ox + rd / SCALE / 2;
  elements.push(
    ...overallSpanVertical(
      roomTop,
      roomBottom,
      overallDimX(roomLeft, "left"),
      dimensionLabel(rh),
      roomLeft,
    ),
    ...overallSpanHorizontal(
      roomLeft,
      roomRight,
      overallDimY(roomBottom, "below"),
      dimensionLabel(rd),
      roomBottom,
    ),
  );

  elements.push(
    text(
      ox,
      roomBottom + 28,
      "CUT PLANE AT ROOM CENTER · DEPTH PROFILE",
      `class="twod-wall-label" font-size="6.5" text-anchor="middle"`,
    ),
  );

  elements.push(
    ...draftingLayer(options.drafting ?? project.drafting, "side", (point) => ({
      x: ox + point.z / SCALE,
      y: oy + rh / SCALE / 2 - point.y / SCALE,
    })),
  );

  return {
    width: svgWidth,
    height: svgHeight,
    originX: ox,
    originY: oy,
    scale: SCALE,
    svg: wrapTechnicalSvg(frame, "section", elements),
  };
}
