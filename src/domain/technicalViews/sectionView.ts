import {
  getFootprintDimensions,
  type CabinetProject,
} from "../cabinetDimensions";
import { clampJobMeta, formatJobSubtitle, formatJobTitle } from "../jobMeta";
import type { RoomConfig } from "../roomModel";
import {
  cabinetsIntersectingCut,
  cabinetSectionCutGraphics,
  detailCalloutBubble,
  resolveSectionCutPlane,
} from "../sectionCut";
import { resolveDimOpts } from "./resolveDimOpts";
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
  draftingLayer,
  elevationGrid,
  resolveDisplay,
  selectedElevationDimensions,
} from "./viewLayers";

/**
 * Section A-A with true cabinet carcass section cuts.
 */
export function sectionView(
  project: CabinetProject,
  room: RoomConfig,
  options: TechnicalViewOptions = {},
): TechnicalViewResult {
  const rd = room.dimensions.depthMm;
  const rh = room.dimensions.heightMm;
  const display = resolveDisplay(options);
  const plane = resolveSectionCutPlane(project, {
    activeCabinetId: options.activeCabinetId,
    selectedCabinetIds: options.selectedCabinetIds,
    cutPlaneXMm: options.cutPlaneXMm,
  });
  const frame = computeSheetFrame({
    spanMm: rd,
    crossMm: rh,
    mode: options.mode,
    bottomLanes: 36,
    sideLanes: 28,
  });
  const { svgWidth, svgHeight, ox, oy } = frame;
  const elements: string[] = [];
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
        options.title ?? plane.label,
        options.projectName ?? "Cabinet Project",
        plane.label,
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
      display.showWallLabels
        ? `${plane.label} · LOOKING ${plane.looking.toUpperCase()}`
        : null,
    ),
  );

  const cutX = ox - rd / SCALE / 2 - 10;
  const roomTop = oy - rh / SCALE / 2;
  const roomBottom = oy + rh / SCALE / 2;
  elements.push(
    line(cutX, roomTop, cutX, roomBottom, `class="twod-section-cut"`),
    text(
      cutX - 4,
      roomTop + 10,
      plane.mark,
      `class="twod-section-mark" font-size="9" text-anchor="end"`,
    ),
    text(
      cutX - 4,
      roomBottom - 4,
      plane.mark,
      `class="twod-section-mark" font-size="9" text-anchor="end"`,
    ),
  );

  const cutCabinets = cabinetsIntersectingCut(project.cabinets, plane);
  let primaryBox: { x: number; y: number; w: number; h: number } | null = null;

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
    const isPrimary = cabinet.id === plane.cabinetId;
    elements.push(
      ...cabinetSectionCutGraphics(cabinet, x, y, SCALE, {
        emphasize: isPrimary,
        showLabels: true,
      }),
    );
    if (isPrimary) {
      primaryBox = { x, y, w: depth, h: height };
    }
  }

  if (primaryBox) {
    elements.push(
      ...detailCalloutBubble(
        primaryBox.x + primaryBox.w + 16,
        primaryBox.y + 14,
        "1",
        plane.detailRef,
        {
          x: primaryBox.x + primaryBox.w,
          y: primaryBox.y + primaryBox.h * 0.35,
        },
      ),
    );
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
      "overall",
      "end",
      resolveDimOpts(
        options.drafting ?? project.drafting,
        "section-overall-h",
        options.activeDraftObjectId,
      ),
    ),
    ...overallSpanHorizontal(
      roomLeft,
      roomRight,
      overallDimY(roomBottom, "below"),
      dimensionLabel(rd),
      roomBottom,
      "overall",
      resolveDimOpts(
        options.drafting ?? project.drafting,
        "section-overall-d",
        options.activeDraftObjectId,
      ),
    ),
  );

  elements.push(
    text(
      ox,
      roomBottom + 28,
      `CUT @ X=${Math.round(plane.xMm)} mm · SEE ${plane.detailRef}`,
      `class="twod-wall-label" font-size="6.5" text-anchor="middle"`,
    ),
  );

  elements.push(
    ...draftingLayer(
      options.drafting ?? project.drafting,
      "section",
      (point) => ({
        x: ox + point.z / SCALE,
        y: oy + rh / SCALE / 2 - point.y / SCALE,
      }),
      options.activeDraftObjectId,
    ),
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
