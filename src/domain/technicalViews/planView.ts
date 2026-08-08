import type { CabinetProject } from "../cabinetDimensions";
import type { CountertopSegment } from "../cabinetLibrary";
import { formatOpeningTag } from "../draftingAnnotations";
import { clampJobMeta, formatJobSubtitle, formatJobTitle } from "../jobMeta";
import {
  collectPlanDepthChain,
  collectPlanDimensionChain,
  collectRunDimensionChain,
  filterDimensionChain,
} from "../placementSnap";
import { renderPlanRunDrafting } from "../runDrafting";
import type { RoomConfig } from "../roomModel";
import { cabinetPlanGraphics } from "./cabinetSvg";
import { MARGIN, SCALE } from "./constants";
import { runDraftingOptionsFromDisplay } from "./runDraftingOptions";
import {
  dimensionChainHorizontal,
  dimensionLabel,
  dimTick,
  line,
  rect,
  text,
} from "./svgPrimitives";
import type { TechnicalViewOptions, TechnicalViewResult } from "./types";
import {
  cabinetIndexMap,
  draftingLayer,
  gridLines,
  resolveDisplay,
  selectedPlanDimensions,
  snapGuideLines,
  titleBlock,
} from "./viewLayers";

export function topView(
  project: CabinetProject,
  room: RoomConfig,
  countertops: CountertopSegment[] = [],
  options: TechnicalViewOptions = {},
): TechnicalViewResult {
  const rw = room.dimensions.widthMm;
  const rd = room.dimensions.depthMm;
  const svgWidth = rw / SCALE + MARGIN * 2;
  const svgHeight = rd / SCALE + MARGIN * 2 + (options.mode === "print" ? 20 : 0) + 24;
  const ox = MARGIN + rw / SCALE / 2;
  const oy = MARGIN + rd / SCALE / 2 + (options.mode === "print" ? 18 : 0);
  const elements: string[] = [];
  const showChains = options.showDimensionChains !== false;
  const showWallLabels = options.showWallLabels !== false;
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
        options.title ?? "Room Plan",
        options.projectName ?? "Cabinet Project",
        "PLAN",
        `1:${SCALE * 25}`,
        sheetMeta,
      ),
    );
  }

  if (options.showGrid) {
    elements.push(...gridLines(ox, oy, rw, rd, 500));
  }

  elements.push(rect(
    ox - rw / SCALE / 2,
    oy - rd / SCALE / 2,
    rw / SCALE,
    rd / SCALE,
    `class="twod-wall twod-wall-outline" fill="#f8fafc" stroke="#0f172a" stroke-width="2.25"`,
  ));

  if (showWallLabels && display.showWallLabels) {
    elements.push(text(ox, oy - rd / SCALE / 2 - 8, "BACK WALL", `class="twod-wall-label" font-size="8" font-weight="700" fill="#64748b" text-anchor="middle"`));
    elements.push(text(ox, oy + rd / SCALE / 2 + 14, "FRONT", `class="twod-wall-label" font-size="8" font-weight="700" fill="#64748b" text-anchor="middle"`));
    elements.push(text(ox - rw / SCALE / 2 - 10, oy, "LEFT", `class="twod-wall-label" font-size="8" font-weight="700" fill="#64748b" text-anchor="middle" transform="rotate(-90 ${ox - rw / SCALE / 2 - 10} ${oy})"`));
    elements.push(text(ox + rw / SCALE / 2 + 12, oy, "RIGHT", `class="twod-wall-label" font-size="8" font-weight="700" fill="#64748b" text-anchor="middle" transform="rotate(90 ${ox + rw / SCALE / 2 + 12} ${oy})"`));
  }

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
      elements.push(rect(
        cx - countertop.widthMm / SCALE / 2,
        cz - countertop.depthMm / SCALE / 2,
        countertop.widthMm / SCALE,
        countertop.depthMm / SCALE,
        `class="twod-countertop" fill="none" stroke="#4d7c0f" stroke-width="1.5" stroke-dasharray="5 3"`,
      ));
    }
  }

  for (const [doorIndex, door] of room.doors.entries()) {
    const dx = door.side === "back-wall" ? ox + door.positionMm / SCALE
      : door.side === "left-wall" ? ox - rw / SCALE / 2 - 6 : ox + rw / SCALE / 2 + 2;
    const dy = door.side === "back-wall" ? oy - rd / SCALE / 2 - 6 : oy + door.positionMm / SCALE;
    const dw = door.side === "back-wall" ? door.widthMm / SCALE : 4;
    const dh = door.side === "back-wall" ? 4 : door.widthMm / SCALE;
    elements.push(rect(dx - dw / 2, dy - dh / 2, dw, dh, `class="twod-opening" fill="#dbeafe" stroke="#1d4ed8" stroke-width="1.35"`));
    if (display.showOpeningTags) {
      elements.push(
        text(
          dx,
          dy - 8,
          formatOpeningTag("door", doorIndex, door.widthMm, door.heightMm),
          `class="twod-tag twod-tag-opening" font-size="7" font-weight="700" fill="#1d4ed8" text-anchor="middle"`,
        ),
      );
    }
  }

  for (const [winIndex, win] of room.windows.entries()) {
    const wx = win.side === "back-wall" ? ox + win.positionMm / SCALE
      : win.side === "left-wall" ? ox - rw / SCALE / 2 - 6 : ox + rw / SCALE / 2 + 2;
    const wy = win.side === "back-wall" ? oy - rd / SCALE / 2 - 6 : oy + win.positionMm / SCALE;
    const ww = win.side === "back-wall" ? win.widthMm / SCALE : 4;
    const wh = win.side === "back-wall" ? 4 : win.widthMm / SCALE;
    elements.push(rect(wx - ww / 2, wy - wh / 2, ww, wh, `class="twod-opening" fill="#ccfbf1" stroke="#0f766e" stroke-width="1.35"`));
    if (display.showOpeningTags) {
      elements.push(
        text(
          wx,
          wy - 8,
          formatOpeningTag("window", winIndex, win.widthMm, win.heightMm, win.sillHeightMm),
          `class="twod-tag twod-tag-opening" font-size="7" font-weight="700" fill="#0f766e" text-anchor="middle"`,
        ),
      );
    }
  }

  if (options.snapGuides?.length) {
    elements.push(...snapGuideLines(options.snapGuides, ox, oy, rw, rd, "top"));
  }

  elements.push(...selectedPlanDimensions(project.cabinets, ox, oy, options));

  // Overall room dimensions
  const topDimY = oy - rd / SCALE / 2 - 24;
  elements.push(line(ox - rw / SCALE / 2, topDimY, ox + rw / SCALE / 2, topDimY, `class="twod-dim twod-dim-overall" stroke="#0f172a" stroke-width="1.35"`));
  elements.push(dimTick(ox - rw / SCALE / 2, topDimY, true));
  elements.push(dimTick(ox + rw / SCALE / 2, topDimY, true));
  elements.push(text(ox, topDimY - 4, `${dimensionLabel(rw)} mm`, `class="twod-annotation twod-dim-overall" font-size="9" font-weight="700" fill="#0f172a" text-anchor="middle"`));

  const leftDimX = ox - rw / SCALE / 2 - 24;
  elements.push(line(leftDimX, oy - rd / SCALE / 2, leftDimX, oy + rd / SCALE / 2, `class="twod-dim twod-dim-overall" stroke="#0f172a" stroke-width="1.35"`));
  elements.push(dimTick(leftDimX, oy - rd / SCALE / 2, false));
  elements.push(dimTick(leftDimX, oy + rd / SCALE / 2, false));
  elements.push(text(leftDimX - 4, oy, `${dimensionLabel(rd)} mm`, `class="twod-annotation twod-dim-overall" font-size="9" font-weight="700" fill="#0f172a" text-anchor="end"`));

  if (showChains && display.showDimensionChains && project.cabinets.length > 0) {
    const minSeg = display.dimMinSegmentMm;
    const widthChain = filterDimensionChain(collectPlanDimensionChain(project.cabinets, rw), minSeg);
    elements.push(...dimensionChainHorizontal(widthChain.positions, widthChain.labels, ox, oy + rd / SCALE / 2 + 28));

    const depthChain = filterDimensionChain(collectPlanDepthChain(project.cabinets, rd), minSeg);
    const depthChainX = ox + rw / SCALE / 2 + 28;
    const floorish = oy;
    if (depthChain.positions.length >= 2) {
      const z0 = floorish + depthChain.positions[0] / SCALE;
      const z1 = floorish + depthChain.positions[depthChain.positions.length - 1] / SCALE;
      elements.push(line(depthChainX, z0, depthChainX, z1, `class="twod-dim twod-dim-chain" stroke="#334155" stroke-width="1"`));
      for (let index = 0; index < depthChain.positions.length; index += 1) {
        const z = floorish + depthChain.positions[index] / SCALE;
        elements.push(dimTick(depthChainX, z, false));
        if (index < depthChain.labels.length) {
          const mid = floorish + (depthChain.positions[index] + depthChain.positions[index + 1]) / 2 / SCALE;
          elements.push(
            text(
              depthChainX + 4,
              mid + 3,
              `${depthChain.labels[index]} mm`,
              `class="twod-annotation twod-dim-chain" font-size="7.5" fill="#1e293b" text-anchor="start" pointer-events="none"`,
            ),
          );
        }
      }
    }

    let runOffset = 0;
    for (const run of options.runs ?? []) {
      if (run.cabinetIds.length < 2) continue;
      const chain = collectRunDimensionChain(run, project.cabinets);
      if (!chain) continue;
      const filtered = filterDimensionChain(chain, minSeg);
      if (run.axis === "x") {
        elements.push(
          ...dimensionChainHorizontal(
            filtered.positions,
            filtered.labels,
            ox,
            oy + rd / SCALE / 2 + 44 + runOffset,
          ),
        );
        runOffset += 14;
      } else {
        const runX = ox + rw / SCALE / 2 + 44 + runOffset;
        if (filtered.positions.length >= 2) {
          const z0 = floorish + filtered.positions[0] / SCALE;
          const z1 = floorish + filtered.positions[filtered.positions.length - 1] / SCALE;
          elements.push(line(runX, z0, runX, z1, `class="twod-dim twod-dim-run" stroke="#475569" stroke-width="1"`));
          for (let index = 0; index < filtered.positions.length; index += 1) {
            const z = floorish + filtered.positions[index] / SCALE;
            elements.push(dimTick(runX, z, false));
            if (index < filtered.labels.length) {
              const mid =
                floorish + (filtered.positions[index] + filtered.positions[index + 1]) / 2 / SCALE;
              elements.push(
                text(
                  runX + 4,
                  mid + 3,
                  `${filtered.labels[index]} mm`,
                  `class="twod-annotation twod-dim-run" font-size="7" fill="#334155" text-anchor="start" pointer-events="none"`,
                ),
              );
            }
          }
          runOffset += 14;
        }
      }
    }
  }

  elements.push(
    ...draftingLayer(options.drafting ?? project.drafting, "top", (point) => ({
      x: ox + point.x / SCALE,
      y: oy + point.z / SCALE,
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
