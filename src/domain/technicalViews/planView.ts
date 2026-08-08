import type { CabinetProject } from "../cabinetDimensions";
import type { CountertopSegment } from "../cabinetLibrary";
import {
  collectPlanDepthChain,
  collectPlanDimensionChain,
  collectRunDimensionChain,
  filterDimensionChain,
} from "../placementSnap";
import { renderPlanRunDrafting } from "../runDrafting";
import type { RoomConfig } from "../roomModel";
import {
  planSectionMarkers,
  resolveSectionCutPlane,
} from "../sectionCut";
import { printChromeSvg } from "../printLayout";
import { resolveDimOpts } from "./resolveDimOpts";
import { cabinetPlanGraphics } from "./cabinetSvg";
import { DIM_RUN_CHAIN_STEP, SCALE } from "./constants";
import {
  dimensionChainHorizontal,
  dimensionChainPlanDepth,
  overallSpanHorizontal,
  overallSpanVertical,
} from "./dimGraphics";
import { chainLaneX, chainLaneY, overallDimX, overallDimY } from "./dimLayout";
import { planOpeningsGraphics, planRoomOutline } from "./planGraphics";
import { runDraftingOptionsFromDisplay } from "./runDraftingOptions";
import {
  computeSheetFrame,
  sheetBackground,
  wrapTechnicalSvg,
} from "./sheetFrame";
import { dimensionLabel, rect } from "./svgPrimitives";
import type { TechnicalViewOptions, TechnicalViewResult } from "./types";
import {
  cabinetIndexMap,
  draftingLayer,
  gridLines,
  resolveDisplay,
  selectedPlanDimensions,
  snapGuideLines,
} from "./viewLayers";

export function topView(
  project: CabinetProject,
  room: RoomConfig,
  countertops: CountertopSegment[] = [],
  options: TechnicalViewOptions = {},
): TechnicalViewResult {
  const rw = room.dimensions.widthMm;
  const rd = room.dimensions.depthMm;
  const showChains = options.showDimensionChains !== false;
  const display = resolveDisplay(options);
  const runLaneCount = (options.runs ?? []).filter((run) => run.cabinetIds.length >= 2).length;
  const frame = computeSheetFrame({
    spanMm: rw,
    crossMm: rd,
    mode: options.mode,
    bottomLanes: showChains ? 36 + runLaneCount * DIM_RUN_CHAIN_STEP : 28,
    sideLanes: showChains ? 28 + Math.min(runLaneCount, 2) * DIM_RUN_CHAIN_STEP : 16,
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
        sheetTitle: "Room Plan",
        viewLabel: "PLAN",
        scaleText: `1:${SCALE * 25}`,
        sheetCode: "A-101",
        noteView: "top",
      }),
    );
  }

  if (options.showGrid) {
    elements.push(...gridLines(ox, oy, rw, rd));
  }

  elements.push(
    ...planRoomOutline(
      ox,
      oy,
      rw,
      rd,
      display.showWallLabels && options.showWallLabels !== false,
      room.dimensions.wallThicknessMm,
    ),
  );

  const runs = options.runs ?? [];
  const fillers = options.fillers ?? [];
  const tops = options.countertops ?? countertops;
  elements.push(
    ...renderPlanRunDrafting({
      runs,
      cabinets: project.cabinets,
      fillers,
      countertops: tops,
      ox,
      oy,
      scale: SCALE,
      options: runDraftingOptionsFromDisplay(display),
    }),
  );

  for (const cabinet of project.cabinets) {
    elements.push(
      ...cabinetPlanGraphics(cabinet, ox, oy, options, indexMap.get(cabinet.id) ?? 0),
    );
  }

  if (!display.showCountertopSpans) {
    for (const countertop of tops) {
      const cx = ox + countertop.positionX / SCALE;
      const cz = oy + countertop.positionZ / SCALE;
      elements.push(
        rect(
          cx - countertop.widthMm / SCALE / 2,
          cz - countertop.depthMm / SCALE / 2,
          countertop.widthMm / SCALE,
          countertop.depthMm / SCALE,
          `class="twod-countertop"`,
        ),
      );
    }
  }

  elements.push(...planOpeningsGraphics(room, ox, oy, options));

  if (options.showSectionMarkers !== false) {
    const plane = resolveSectionCutPlane(project, {
      activeCabinetId: options.activeCabinetId,
      selectedCabinetIds: options.selectedCabinetIds,
      cutPlaneXMm: options.cutPlaneXMm,
    });
    elements.push(...planSectionMarkers(plane, ox, oy, rd));
  }

  if (options.snapGuides?.length) {
    elements.push(...snapGuideLines(options.snapGuides, ox, oy, rw, rd, "top"));
  }

  elements.push(...selectedPlanDimensions(project.cabinets, ox, oy, options));

  const roomTop = oy - rd / SCALE / 2;
  const roomBottom = oy + rd / SCALE / 2;
  const roomLeft = ox - rw / SCALE / 2;
  const roomRight = ox + rw / SCALE / 2;
  const topDimY = overallDimY(roomTop, "above");
  const leftDimX = overallDimX(roomLeft, "left");

  elements.push(
    ...overallSpanHorizontal(
      roomLeft,
      roomRight,
      topDimY,
      dimensionLabel(rw),
      roomTop,
      "overall",
      resolveDimOpts(
        options.drafting ?? project.drafting,
        "plan-overall-w",
        options.activeDraftObjectId,
      ),
    ),
    ...overallSpanVertical(
      roomTop,
      roomBottom,
      leftDimX,
      dimensionLabel(rd),
      roomLeft,
      "overall",
      "end",
      resolveDimOpts(
        options.drafting ?? project.drafting,
        "plan-overall-d",
        options.activeDraftObjectId,
      ),
    ),
  );

  if (showChains && display.showDimensionChains && project.cabinets.length > 0) {
    const minSeg = display.dimMinSegmentMm;
    const drafting = options.drafting ?? project.drafting;
    const widthChain = filterDimensionChain(
      collectPlanDimensionChain(project.cabinets, rw),
      minSeg,
    );
    elements.push(
      ...dimensionChainHorizontal(
        widthChain.positions,
        widthChain.labels,
        ox,
        chainLaneY(roomBottom, 0),
        "chain",
        roomBottom,
        resolveDimOpts(drafting, "plan-chain-w", options.activeDraftObjectId),
      ),
    );

    const depthChain = filterDimensionChain(
      collectPlanDepthChain(project.cabinets, rd),
      minSeg,
    );
    elements.push(
      ...dimensionChainPlanDepth(
        depthChain.positions,
        depthChain.labels,
        chainLaneX(roomRight, 0),
        oy,
        "chain",
        roomRight,
        resolveDimOpts(drafting, "plan-chain-d", options.activeDraftObjectId),
      ),
    );

    let runOffset = 0;
    for (const run of options.runs ?? []) {
      if (run.cabinetIds.length < 2) continue;
      const chain = collectRunDimensionChain(run, project.cabinets);
      if (!chain) continue;
      const filtered = filterDimensionChain(chain, minSeg);
      const runDimId = `plan-run-${run.id}`;
      if (run.axis === "x") {
        elements.push(
          ...dimensionChainHorizontal(
            filtered.positions,
            filtered.labels,
            ox,
            chainLaneY(roomBottom, 1 + runOffset),
            "run",
            roomBottom,
            resolveDimOpts(drafting, runDimId, options.activeDraftObjectId),
          ),
        );
        runOffset += 1;
      } else {
        elements.push(
          ...dimensionChainPlanDepth(
            filtered.positions,
            filtered.labels,
            chainLaneX(roomRight, 1 + runOffset),
            oy,
            "run",
            roomRight,
            resolveDimOpts(drafting, runDimId, options.activeDraftObjectId),
          ),
        );
        runOffset += 1;
      }
    }
  }

  elements.push(
    ...draftingLayer(
      options.drafting ?? project.drafting,
      "top",
      (point) => ({
        x: ox + point.x / SCALE,
        y: oy + point.z / SCALE,
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
    svg: wrapTechnicalSvg(frame, "plan", elements),
  };
}
