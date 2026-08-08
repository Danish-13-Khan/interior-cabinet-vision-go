import {
  getFootprintDimensions,
  type CabinetProject,
} from "../cabinetDimensions";
import { formatOpeningTag } from "../draftingAnnotations";
import { clampJobMeta, formatJobSubtitle, formatJobTitle } from "../jobMeta";
import {
  collectElevationHorizontalChain,
  collectElevationVerticalChain,
  filterDimensionChain,
} from "../placementSnap";
import { renderElevationRunDrafting } from "../runDrafting";
import type { RoomConfig } from "../roomModel";
import { cabinetElevationGraphics } from "./cabinetSvg";
import { MARGIN, SCALE } from "./constants";
import { runDraftingOptionsFromDisplay } from "./runDraftingOptions";
import {
  dimensionChainHorizontal,
  dimensionChainVertical,
  dimensionLabel,
  line,
  rect,
  text,
} from "./svgPrimitives";
import type { TechnicalViewOptions, TechnicalViewResult } from "./types";
import {
  cabinetIndexMap,
  draftingLayer,
  elevationGrid,
  resolveDisplay,
  selectedElevationDimensions,
  snapGuideLines,
  titleBlock,
} from "./viewLayers";

export function frontView(
  project: CabinetProject,
  room: RoomConfig,
  options: TechnicalViewOptions = {},
): TechnicalViewResult {
  const rw = room.dimensions.widthMm;
  const rh = room.dimensions.heightMm;
  const svgWidth = rw / SCALE + MARGIN * 2 + 20;
  const svgHeight = rh / SCALE + MARGIN * 2 + (options.mode === "print" ? 20 : 0) + 20;
  const ox = MARGIN + rw / SCALE / 2;
  const oy = MARGIN + rh / SCALE / 2 + (options.mode === "print" ? 18 : 0);
  const elements: string[] = [];
  const display = resolveDisplay(options);
  const indexMap = cabinetIndexMap(project);
  const sheetMeta =
    options.sheetMeta ??
    (() => {
      const job = clampJobMeta(project.job);
      return `${formatJobTitle(job)} · ${formatJobSubtitle(job)}`;
    })();

  elements.push(rect(0, 0, svgWidth, svgHeight, `fill="${options.mode === "print" ? "#ffffff" : "#f1f5f9"}" class="twod-sheet"`));
  if (options.mode === "print") {
    elements.push(
      ...titleBlock(
        svgWidth,
        options.title ?? "Front Elevation",
        options.projectName ?? "Cabinet Project",
        "FRONT ELEV.",
        `1:${SCALE * 25}`,
        sheetMeta,
      ),
    );
  }

  if (options.showGrid) {
    elements.push(...elevationGrid(ox, oy, rw, rh, 500));
  }

  elements.push(rect(
    ox - rw / SCALE / 2,
    oy - rh / SCALE / 2,
    rw / SCALE,
    rh / SCALE,
    `class="twod-wall twod-wall-outline" fill="#f8fafc" stroke="#0f172a" stroke-width="2.25"`,
  ));

  // Floor line emphasis
  elements.push(line(
    ox - rw / SCALE / 2,
    oy + rh / SCALE / 2,
    ox + rw / SCALE / 2,
    oy + rh / SCALE / 2,
    `class="twod-wall twod-floor-line" stroke="#0f172a" stroke-width="2.4"`,
  ));

  if (display.showWallLabels) {
    elements.push(text(ox, oy - rh / SCALE / 2 - 8, "BACK WALL ELEVATION", `class="twod-wall-label" font-size="8" font-weight="700" fill="#64748b" text-anchor="middle"`));
  }

  for (const [winIndex, window] of room.windows.filter((item) => item.side === "back-wall").entries()) {
    const x = ox + window.positionMm / SCALE - window.widthMm / SCALE / 2;
    const y = oy + rh / SCALE / 2 - (window.sillHeightMm + window.heightMm) / SCALE;
    elements.push(rect(x, y, window.widthMm / SCALE, window.heightMm / SCALE, `class="twod-opening" fill="#dbeafe" stroke="#1d4ed8" stroke-width="1.45"`));
    if (display.showOpeningTags) {
      elements.push(
        text(
          x + window.widthMm / SCALE / 2,
          y - 4,
          formatOpeningTag("window", winIndex, window.widthMm, window.heightMm, window.sillHeightMm),
          `class="twod-tag twod-tag-opening" font-size="7" font-weight="700" fill="#1d4ed8" text-anchor="middle"`,
        ),
      );
    }
  }

  for (const [doorIndex, door] of room.doors.filter((item) => item.side === "back-wall").entries()) {
    const x = ox + door.positionMm / SCALE - door.widthMm / SCALE / 2;
    const y = oy + rh / SCALE / 2 - door.heightMm / SCALE;
    elements.push(rect(x, y, door.widthMm / SCALE, door.heightMm / SCALE, `class="twod-opening" fill="#eff6ff" stroke="#2563eb" stroke-width="1.45"`));
    if (display.showOpeningTags) {
      elements.push(
        text(
          x + door.widthMm / SCALE / 2,
          y - 4,
          formatOpeningTag("door", doorIndex, door.widthMm, door.heightMm),
          `class="twod-tag twod-tag-opening" font-size="7" font-weight="700" fill="#1d4ed8" text-anchor="middle"`,
        ),
      );
    }
  }

  const visibleCabinets = project.cabinets.filter((cabinet) => {
    const side = cabinet.placement.attachment;
    return side === "floor" || side === "back-wall";
  });

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
    const fill = cabinet.placement.attachment === "back-wall" ? "#d6c3a4" : "#c4a574";
    elements.push(
      ...cabinetElevationGraphics(
        cabinet,
        x,
        y,
        width,
        height,
        options,
        fill,
        fp.width,
        indexMap.get(cabinet.id) ?? 0,
      ),
    );
  }

  // Run drafting: fillers, labels, countertop spans, run dim chains
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

  // Wall-cabinet height relationships: clearances above floor cabinets / below ceiling
  const wallCabinets = visibleCabinets.filter((cabinet) => cabinet.placement.attachment === "back-wall");
  const floorCabinets = visibleCabinets.filter((cabinet) => cabinet.placement.attachment === "floor");
  for (const wallCab of wallCabinets) {
    const bottom = wallCab.placement.y;
    const top = wallCab.placement.y + wallCab.config.dimensions.height;
    const ceilingClear = rh - top;
    const cx = ox + wallCab.placement.x / SCALE;
    const bottomY = oy + rh / SCALE / 2 - bottom / SCALE;
    const topY = oy + rh / SCALE / 2 - top / SCALE;
    const ceilingY = oy - rh / SCALE / 2;
    if (ceilingClear > 20) {
      elements.push(line(cx + 18, topY, cx + 18, ceilingY, `class="twod-dim twod-wall-clearance" stroke="#0369a1" stroke-width="1" stroke-dasharray="3 2"`));
      elements.push(text(cx + 22, (topY + ceilingY) / 2, `${dimensionLabel(ceilingClear)} clear`, `class="twod-annotation" font-size="6.5" fill="#0369a1"`));
    }
    for (const floorCab of floorCabinets) {
      if (Math.abs(floorCab.placement.x - wallCab.placement.x) > Math.max(floorCab.config.dimensions.width, wallCab.config.dimensions.width)) {
        continue;
      }
      const gap = bottom - (floorCab.placement.y + floorCab.config.dimensions.height);
      if (gap > 20) {
        const floorTopY = oy + rh / SCALE / 2 - (floorCab.placement.y + floorCab.config.dimensions.height) / SCALE;
        elements.push(line(cx - 18, floorTopY, cx - 18, bottomY, `class="twod-dim twod-wall-clearance" stroke="#0369a1" stroke-width="1" stroke-dasharray="3 2"`));
        elements.push(text(cx - 22, (floorTopY + bottomY) / 2, `${dimensionLabel(gap)} gap`, `class="twod-annotation" font-size="6.5" fill="#0369a1" text-anchor="end"`));
      }
      break;
    }
  }

  if (options.snapGuides?.length) {
    elements.push(...snapGuideLines(options.snapGuides, ox, oy, rw, rh, "front"));
  }

  elements.push(...selectedElevationDimensions(visibleCabinets, rh, ox, oy, options, "x"));

  // Overall dims
  const roomDimX = ox - rw / SCALE / 2 - 24;
  elements.push(line(roomDimX, oy - rh / SCALE / 2, roomDimX, oy + rh / SCALE / 2, `class="twod-dim twod-dim-overall" stroke="#0f172a" stroke-width="1.35"`));
  elements.push(text(roomDimX - 4, oy, `${dimensionLabel(rh)} mm`, `class="twod-annotation twod-dim-overall" font-size="9" font-weight="700" fill="#0f172a" text-anchor="end"`));
  const bottomDimY = oy + rh / SCALE / 2 + 18;
  elements.push(line(ox - rw / SCALE / 2, bottomDimY, ox + rw / SCALE / 2, bottomDimY, `class="twod-dim twod-dim-overall" stroke="#0f172a" stroke-width="1.35"`));
  elements.push(text(ox, bottomDimY + 11, `${dimensionLabel(rw)} mm`, `class="twod-annotation twod-dim-overall" font-size="9" font-weight="700" fill="#0f172a" text-anchor="middle"`));

  if (display.showDimensionChains && visibleCabinets.length > 0) {
    const minSeg = display.dimMinSegmentMm;
    const horizontal = filterDimensionChain(
      collectElevationHorizontalChain(visibleCabinets, rw, "x"),
      minSeg,
    );
    elements.push(...dimensionChainHorizontal(horizontal.positions, horizontal.labels, ox, oy + rh / SCALE / 2 + 34));

    const vertical = filterDimensionChain(
      collectElevationVerticalChain(visibleCabinets, rh),
      minSeg,
    );
    elements.push(...dimensionChainVertical(vertical.positions, vertical.labels, ox + rw / SCALE / 2 + 28, oy, rh));
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
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" class="twod-draft">${elements.join("")}</svg>`,
  };
}
