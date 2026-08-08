import {
  getFootprintDimensions,
  type CabinetProject,
} from "../cabinetDimensions";
import { clampJobMeta, formatJobSubtitle, formatJobTitle } from "../jobMeta";
import {
  collectElevationHorizontalChain,
  collectElevationVerticalChain,
  filterDimensionChain,
} from "../placementSnap";
import { renderElevationRunDrafting } from "../runDrafting";
import type { RoomConfig } from "../roomModel";
import { cabinetElevationGraphics, cabinetRectAttrs } from "./cabinetSvg";
import { SCALE } from "./constants";
import {
  dimensionChainHorizontal,
  dimensionChainVertical,
  overallSpanHorizontal,
  overallSpanVertical,
} from "./dimGraphics";
import { chainLaneX, chainLaneY, overallDimX, overallDimY } from "./dimLayout";
import {
  elevationOpeningsGraphics,
  elevationRoomShell,
  wallCabinetClearances,
} from "./elevationGraphics";
import { runDraftingOptionsFromDisplay } from "./runDraftingOptions";
import {
  computeSheetFrame,
  sheetBackground,
  wrapTechnicalSvg,
} from "./sheetFrame";
import { dimensionLabel, rect, text } from "./svgPrimitives";
import { titleBlock } from "./titleBlock";
import type { TechnicalViewOptions, TechnicalViewResult } from "./types";
import {
  cabinetIndexMap,
  draftingLayer,
  elevationGrid,
  resolveDisplay,
  selectedElevationDimensions,
  snapGuideLines,
} from "./viewLayers";

export function frontView(
  project: CabinetProject,
  room: RoomConfig,
  options: TechnicalViewOptions = {},
): TechnicalViewResult {
  const rw = room.dimensions.widthMm;
  const rh = room.dimensions.heightMm;
  const display = resolveDisplay(options);
  const frame = computeSheetFrame({
    spanMm: rw,
    crossMm: rh,
    mode: options.mode,
    bottomLanes: display.showDimensionChains ? 40 : 28,
    sideLanes: display.showDimensionChains ? 32 : 18,
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
        options.title ?? "Front Elevation",
        options.projectName ?? "Cabinet Project",
        "FRONT ELEV.",
        `1:${SCALE * 25}`,
        sheetMeta,
        options.sheetCode ?? "A-201",
      ),
    );
  }

  if (options.showGrid) {
    elements.push(...elevationGrid(ox, oy, rw, rh));
  }

  elements.push(
    ...elevationRoomShell(
      ox,
      oy,
      rw,
      rh,
      display.showWallLabels ? "BACK WALL ELEVATION" : null,
    ),
  );

  elements.push(
    ...elevationOpeningsGraphics(room, ox, oy, rh, ["back-wall"], options),
  );

  const visibleCabinets = project.cabinets.filter((cabinet) => {
    const side = cabinet.placement.attachment;
    return side === "floor" || side === "back-wall";
  });
  const sideWallProfiles = project.cabinets.filter(
    (cabinet) =>
      cabinet.placement.attachment === "left-wall" ||
      cabinet.placement.attachment === "right-wall",
  );

  for (const cabinet of visibleCabinets) {
    const fp = getFootprintDimensions(cabinet.config.dimensions, cabinet.placement.rotation);
    const width = fp.width / SCALE;
    const height = cabinet.config.dimensions.height / SCALE;
    const ghost =
      options.ghostPlacement?.cabinetId === cabinet.id ? options.ghostPlacement : null;
    const x = ox + (ghost?.x ?? cabinet.placement.x) / SCALE - width / 2;
    const y =
      oy +
      rh / SCALE / 2 -
      ((ghost?.y ?? cabinet.placement.y) + cabinet.config.dimensions.height) / SCALE;
    elements.push(
      ...cabinetElevationGraphics(
        cabinet,
        x,
        y,
        width,
        height,
        options,
        "",
        fp.width,
        indexMap.get(cabinet.id) ?? 0,
      ),
    );
  }

  for (const cabinet of sideWallProfiles) {
    const fp = getFootprintDimensions(cabinet.config.dimensions, cabinet.placement.rotation);
    const profileWidth = fp.depth / SCALE;
    const height = cabinet.config.dimensions.height / SCALE;
    const y =
      oy +
      rh / SCALE / 2 -
      (cabinet.placement.y + cabinet.config.dimensions.height) / SCALE;
    const x =
      cabinet.placement.attachment === "left-wall"
        ? ox - rw / SCALE / 2
        : ox + rw / SCALE / 2 - profileWidth;
    elements.push(
      rect(
        x,
        y,
        profileWidth,
        height,
        `${cabinetRectAttrs(cabinet.id, "", options, "twod-cabinet-edge-profile")}`,
      ),
      text(
        x + profileWidth / 2,
        y - 3,
        `${cabinet.placement.attachment === "left-wall" ? "L" : "R"} profile`,
        `class="twod-annotation twod-edge-profile" font-size="6" text-anchor="middle" pointer-events="none"`,
      ),
    );
  }

  elements.push(
    ...renderElevationRunDrafting({
      viewAxis: "x",
      runs: options.runs ?? [],
      cabinets: visibleCabinets,
      fillers: options.fillers ?? [],
      countertops: options.countertops ?? [],
      roomHeightMm: rh,
      ox,
      oy,
      scale: SCALE,
      options: runDraftingOptionsFromDisplay(display),
    }),
  );

  const wallCabinets = visibleCabinets.filter(
    (cabinet) => cabinet.placement.attachment === "back-wall",
  );
  const floorCabinets = visibleCabinets.filter(
    (cabinet) => cabinet.placement.attachment === "floor",
  );
  elements.push(
    ...wallCabinetClearances(wallCabinets, floorCabinets, rh, ox, oy),
  );

  if (options.snapGuides?.length) {
    elements.push(...snapGuideLines(options.snapGuides, ox, oy, rw, rh, "front"));
  }

  elements.push(...selectedElevationDimensions(visibleCabinets, rh, ox, oy, options, "x"));

  const roomTop = oy - rh / SCALE / 2;
  const roomBottom = oy + rh / SCALE / 2;
  const roomLeft = ox - rw / SCALE / 2;
  const roomRight = ox + rw / SCALE / 2;

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
      dimensionLabel(rw),
      roomBottom,
    ),
  );

  if (display.showDimensionChains && visibleCabinets.length > 0) {
    const minSeg = display.dimMinSegmentMm;
    const horizontal = filterDimensionChain(
      collectElevationHorizontalChain(visibleCabinets, rw, "x"),
      minSeg,
    );
    elements.push(
      ...dimensionChainHorizontal(
        horizontal.positions,
        horizontal.labels,
        ox,
        chainLaneY(roomBottom, 0),
        "chain",
        roomBottom,
      ),
    );

    const vertical = filterDimensionChain(
      collectElevationVerticalChain(visibleCabinets, rh),
      minSeg,
    );
    elements.push(
      ...dimensionChainVertical(
        vertical.positions,
        vertical.labels,
        chainLaneX(roomRight, 0),
        oy,
        rh,
        "chain",
        roomRight,
      ),
    );
  }

  elements.push(
    ...draftingLayer(options.drafting ?? project.drafting, "front", (point) => ({
      x: ox + point.x / SCALE,
      y: oy + rh / SCALE / 2 - point.y / SCALE,
    })),
  );

  return {
    width: svgWidth,
    height: svgHeight,
    originX: ox,
    originY: oy,
    scale: SCALE,
    svg: wrapTechnicalSvg(frame, "front", elements),
  };
}
