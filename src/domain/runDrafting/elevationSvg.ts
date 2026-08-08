import type { CabinetInstance } from "../cabinetDimensions";
import type { CabinetRun, CountertopSegment, RunFiller } from "../cabinetLibrary";
import { dimensionChainHorizontal } from "../technicalViews/dimGraphics";
import {
  dimensionLabel,
  line,
  rect,
  text,
} from "../technicalViews/svgPrimitives";
import { collectFilteredRunDraftChain, runOverallLengthMm } from "./dimensionChain";
import { buildRunPlanBounds } from "./geometry";
import type { RunDraftingOptions } from "./types";

export function renderElevationRunDrafting(args: {
  viewAxis: "x" | "z";
  runs: CabinetRun[];
  cabinets: CabinetInstance[];
  fillers: RunFiller[];
  countertops: CountertopSegment[];
  roomHeightMm: number;
  ox: number;
  oy: number;
  scale: number;
  options: RunDraftingOptions;
}): string[] {
  const {
    viewAxis,
    runs,
    cabinets,
    fillers,
    countertops,
    roomHeightMm,
    ox,
    oy,
    scale,
    options,
  } = args;
  const elements: string[] = [];
  const floorY = oy + roomHeightMm / scale / 2;
  const visibleRuns = runs.filter((run) => run.axis === viewAxis);

  if (options.showFillers) {
    for (const filler of fillers) {
      const run = runs.find((item) => item.id === filler.runId);
      if (run && run.axis !== viewAxis) continue;
      const width =
        (viewAxis === "x" ? filler.size.width : filler.size.depth) / scale;
      const height = filler.size.height / scale;
      const primary =
        viewAxis === "x" ? filler.position.x : filler.position.z;
      const x = ox + primary / scale - width / 2;
      const y = floorY - (filler.position.y + filler.size.height) / scale;
      elements.push(
        rect(
          x,
          y,
          width,
          height,
          `class="twod-run-filler" data-filler-id="${filler.id}" fill="rgba(148,163,184,0.45)" stroke="#475569" stroke-width="1" pointer-events="none"`,
        ),
      );
      elements.push(
        text(
          x + width / 2,
          y + height / 2 + 2,
          `${Math.round(filler.widthMm)}`,
          `class="twod-annotation twod-run-gap-label" font-size="6.5" fill="#334155" text-anchor="middle" pointer-events="none"`,
        ),
      );
    }
  }

  for (const run of visibleRuns) {
    const index = Math.max(
      0,
      runs.findIndex((item) => item.id === run.id),
    );
    const bounds = buildRunPlanBounds(run, cabinets, index);
    if (!bounds) continue;
    const start = viewAxis === "x" ? bounds.minX : bounds.minZ;
    const end = viewAxis === "x" ? bounds.maxX : bounds.maxZ;
    const x0 = ox + start / scale;
    const x1 = ox + end / scale;
    const baseline = floorY + 8;

    if (options.showRunBands) {
      elements.push(
        line(
          x0,
          baseline,
          x1,
          baseline,
          `class="twod-run-band twod-run-baseline" stroke="#64748b" stroke-width="1.35" pointer-events="none"`,
        ),
      );
    }

    if (options.showRunLabels) {
      elements.push(
        text(
          (x0 + x1) / 2,
          baseline + 10,
          `${bounds.shortCode} · ${dimensionLabel(runOverallLengthMm(run, cabinets))} mm`,
          `class="twod-run-label" font-size="7.5" font-weight="700" fill="#334155" text-anchor="middle" pointer-events="none"`,
        ),
      );
      if (bounds.cornerTransition) {
        elements.push(
          text(
            x1 + 4,
            baseline + 10,
            "CRN",
            `class="twod-run-corner-label" font-size="6.5" font-weight="700" fill="#b45309" pointer-events="none"`,
          ),
        );
      }
    }

    if (options.showCountertopSpans) {
      for (const countertop of countertops.filter((item) => item.runId === run.id)) {
        const ctY = floorY - countertop.positionY / scale;
        const ctStart =
          viewAxis === "x"
            ? countertop.positionX - countertop.widthMm / 2
            : countertop.positionZ - countertop.widthMm / 2;
        const ctEnd = ctStart + countertop.widthMm;
        elements.push(
          line(
            ox + ctStart / scale,
            ctY,
            ox + ctEnd / scale,
            ctY,
            `class="twod-countertop twod-countertop-elev" stroke="#4d7c0f" stroke-width="1.6" stroke-dasharray="4 2" pointer-events="none"`,
          ),
        );
        elements.push(
          text(
            ox + (ctStart + ctEnd) / 2 / scale,
            ctY - 4,
            `CT ${dimensionLabel(countertop.widthMm)}`,
            `class="twod-countertop-label" font-size="6.5" fill="#3f6212" text-anchor="middle" pointer-events="none"`,
          ),
        );
      }
    }
  }

  if (options.showDimensionChains) {
    let runOffset = 0;
    for (const run of visibleRuns) {
      if (run.cabinetIds.length < 1) continue;
      const chain = collectFilteredRunDraftChain(
        run,
        cabinets,
        fillers,
        options.dimMinSegmentMm,
      );
      if (!chain || chain.positions.length < 2) continue;
      elements.push(
        ...dimensionChainHorizontal(
          chain.positions,
          chain.labels,
          ox,
          floorY + 22 + runOffset,
        ),
      );
      runOffset += 14;
    }
  }

  return elements;
}
