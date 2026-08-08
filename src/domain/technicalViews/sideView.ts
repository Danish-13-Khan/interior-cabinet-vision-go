import {
  getFootprintDimensions,
  type CabinetProject,
} from "../cabinetDimensions";
import {
  collectElevationHorizontalChain,
  collectElevationVerticalChain,
  filterDimensionChain,
} from "../placementSnap";
import { renderElevationRunDrafting } from "../runDrafting";
import type { RoomConfig } from "../roomModel";
import { printChromeSvg } from "../printLayout";
import { resolveDimOpts } from "./resolveDimOpts";
import { cabinetElevationGraphics } from "./cabinetSvg";
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
  sideMountIndicators,
} from "./elevationGraphics";
import { runDraftingOptionsFromDisplay } from "./runDraftingOptions";
import {
  computeSheetFrame,
  sheetBackground,
  wrapTechnicalSvg,
} from "./sheetFrame";
import { dimensionLabel } from "./svgPrimitives";
import type { TechnicalViewOptions, TechnicalViewResult } from "./types";
import {
  cabinetIndexMap,
  draftingLayer,
  elevationGrid,
  resolveDisplay,
  selectedElevationDimensions,
  snapGuideLines,
} from "./viewLayers";

export function sideView(
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
    bottomLanes: display.showDimensionChains ? 40 : 28,
    sideLanes: display.showDimensionChains ? 32 : 18,
  });
  const { svgWidth, svgHeight, ox, oy } = frame;
  const elements: string[] = [];
  const indexMap = cabinetIndexMap(project);

  elements.push(sheetBackground(svgWidth, svgHeight, frame.print));
  if (frame.print) {
    elements.push(
      ...printChromeSvg({
        svgWidth,
        svgHeight,
        project,
        options,
        sheetTitle: "Side Elevation",
        viewLabel: "SIDE ELEV.",
        scaleText: `1:${SCALE * 25}`,
        sheetCode: "A-202",
        noteView: "side",
      }),
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
      display.showWallLabels ? "SIDE WALL ELEVATION" : null,
    ),
  );

  // Back wall face in side view (left edge)
  elements.push(
    ...elevationOpeningsGraphics(
      room,
      ox,
      oy,
      rh,
      ["left-wall", "right-wall"],
      options,
    ),
  );

  const visibleCabinets = project.cabinets.filter(
    (cabinet) =>
      cabinet.placement.attachment === "floor" ||
      cabinet.placement.attachment === "left-wall" ||
      cabinet.placement.attachment === "right-wall",
  );

  for (const cabinet of visibleCabinets) {
    const fp = getFootprintDimensions(cabinet.config.dimensions, cabinet.placement.rotation);
    const depth = fp.depth / SCALE;
    const height = cabinet.config.dimensions.height / SCALE;
    const ghost =
      options.ghostPlacement?.cabinetId === cabinet.id ? options.ghostPlacement : null;
    const x = ox + (ghost?.z ?? cabinet.placement.z) / SCALE - depth / 2;
    const y =
      oy +
      rh / SCALE / 2 -
      ((ghost?.y ?? cabinet.placement.y) + cabinet.config.dimensions.height) / SCALE;
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
  }

  elements.push(
    ...sideMountIndicators(visibleCabinets, ox, oy, rh, rd),
    ...renderElevationRunDrafting({
      viewAxis: "z",
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

  if (options.snapGuides?.length) {
    elements.push(...snapGuideLines(options.snapGuides, ox, oy, rd, rh, "side"));
  }

  elements.push(...selectedElevationDimensions(visibleCabinets, rh, ox, oy, options, "z"));

  const roomTop = oy - rh / SCALE / 2;
  const roomBottom = oy + rh / SCALE / 2;
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
        "side-overall-h",
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
        "side-overall-d",
        options.activeDraftObjectId,
      ),
    ),
  );

  if (display.showDimensionChains && visibleCabinets.length > 0) {
    const minSeg = display.dimMinSegmentMm;
    const drafting = options.drafting ?? project.drafting;
    const horizontal = filterDimensionChain(
      collectElevationHorizontalChain(visibleCabinets, rd, "z"),
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
        resolveDimOpts(drafting, "side-chain-d", options.activeDraftObjectId),
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
        resolveDimOpts(drafting, "side-chain-h", options.activeDraftObjectId),
      ),
    );
  }

  elements.push(
    ...draftingLayer(
      options.drafting ?? project.drafting,
      "side",
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
    svg: wrapTechnicalSvg(frame, "side", elements),
  };
}
