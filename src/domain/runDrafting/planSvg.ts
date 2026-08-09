import type { CountertopSegment, RunFiller } from "../cabinetLibrary";
import {
  dimensionLabel,
  line,
  rect,
  text,
} from "../technicalViews/svgPrimitives";
import { formatFillerMark } from "../shopTerms";
import { renderFillerMark, renderRunMarker } from "../draftingSymbols";
import {
  buildAllRunPlanBounds,
  collectRunGapSegments,
} from "./geometry";
import type { CabinetRun, RunDraftingOptions, RunPlanBounds } from "./types";
import type { CabinetInstance } from "../cabinetDimensions";

function endTick(
  x: number,
  y: number,
  axis: "x" | "z",
  condition: string,
): string[] {
  const mark = condition === "corner" ? 6 : condition === "wall" ? 5 : 3;
  if (axis === "x") {
    return [
      line(
        x,
        y - mark,
        x,
        y + mark,
        `class="twod-countertop-end" pointer-events="none"`,
      ),
    ];
  }
  return [
    line(
      x - mark,
      y,
      x + mark,
      y,
      `class="twod-countertop-end" pointer-events="none"`,
    ),
  ];
}

function renderRunBand(bounds: RunPlanBounds, ox: number, oy: number, scale: number) {
  const pad = 6 / scale;
  const x = ox + bounds.minX / scale - pad;
  const y = oy + bounds.minZ / scale - pad;
  const width = (bounds.maxX - bounds.minX) / scale + pad * 2;
  const height = (bounds.maxZ - bounds.minZ) / scale + pad * 2;
  return rect(
    x,
    y,
    width,
    height,
    `class="twod-run-band" data-run-id="${bounds.runId}" pointer-events="none"`,
  );
}

function renderRunLabel(bounds: RunPlanBounds, ox: number, oy: number, scale: number) {
  const labelX = ox + bounds.centerX / scale;
  const labelY =
    oy +
    (bounds.axis === "x" ? bounds.minZ / scale - 10 : bounds.centerZ / scale);
  const lengthNote = `${Math.round(bounds.lengthMm)} mm`;
  return [
    ...renderRunMarker(labelX - 36, labelY - 1, bounds.shortCode),
    text(
      labelX + 8,
      labelY,
      bounds.label.replace(`${bounds.shortCode} · `, ""),
      `class="twod-run-label" font-size="8" font-weight="700" text-anchor="middle" pointer-events="none"`,
    ),
    text(
      labelX + 8,
      labelY + 10,
      lengthNote,
      `class="twod-run-length" font-size="7" text-anchor="middle" pointer-events="none"`,
    ),
  ];
}

function renderCornerMark(bounds: RunPlanBounds, ox: number, oy: number, scale: number) {
  if (!bounds.cornerTransition) return [];
  const cx = ox + bounds.maxX / scale;
  const cy = oy + bounds.centerZ / scale;
  return [
    line(
      cx - 5,
      cy - 5,
      cx + 5,
      cy + 5,
      `class="twod-run-corner" pointer-events="none"`,
    ),
    line(
      cx - 5,
      cy + 5,
      cx + 5,
      cy - 5,
      `class="twod-run-corner" pointer-events="none"`,
    ),
    text(
      cx + 8,
      cy + 3,
      "CRN",
      `class="twod-run-corner-label" font-size="6.5" font-weight="700" pointer-events="none"`,
    ),
  ];
}

export function renderPlanRunDrafting(args: {
  runs: CabinetRun[];
  cabinets: CabinetInstance[];
  fillers: RunFiller[];
  countertops: CountertopSegment[];
  ox: number;
  oy: number;
  scale: number;
  options: RunDraftingOptions;
}): string[] {
  const {
    runs,
    cabinets,
    fillers,
    countertops,
    ox,
    oy,
    scale,
    options,
  } = args;
  const elements: string[] = [];
  const boundsList = buildAllRunPlanBounds(runs, cabinets);

  if (options.showRunBands) {
    for (const bounds of boundsList) {
      elements.push(renderRunBand(bounds, ox, oy, scale));
    }
  }

  if (options.showFillers) {
    for (const run of runs) {
      for (const gap of collectRunGapSegments(run, cabinets)) {
        if (gap.kind !== "gap") continue;
        const x = ox + gap.position.x / scale - gap.size.width / scale / 2;
        const y = oy + gap.position.z / scale - gap.size.depth / scale / 2;
        elements.push(
          rect(
            x,
            y,
            gap.size.width / scale,
            gap.size.depth / scale,
            `class="twod-run-filler twod-run-gap" pointer-events="none"`,
          ),
        );
        elements.push(
          text(
            x + gap.size.width / scale / 2,
            y + gap.size.depth / scale / 2 + 2,
            `${Math.round(gap.widthMm)}`,
            `class="twod-annotation twod-run-gap-label" font-size="6.5" text-anchor="middle" pointer-events="none"`,
          ),
        );
      }
    }

    for (const filler of fillers) {
      const width = filler.size.width / scale;
      const depth = filler.size.depth / scale;
      const x = ox + filler.position.x / scale - width / 2;
      const y = oy + filler.position.z / scale - depth / 2;
      const fillerIndex = fillers.indexOf(filler);
      elements.push(
        rect(
          x,
          y,
          width,
          depth,
          `class="twod-run-filler" data-filler-id="${filler.id}" pointer-events="none"`,
        ),
      );
      elements.push(
        ...renderFillerMark(
          x + width / 2,
          y + depth / 2 + 2,
          formatFillerMark(fillerIndex),
          `${Math.round(filler.widthMm)}`,
        ),
      );
    }
  }

  if (options.showCountertopSpans) {
    for (const countertop of countertops) {
      const cx = ox + countertop.positionX / scale;
      const cz = oy + countertop.positionZ / scale;
      const w = countertop.widthMm / scale;
      const d = countertop.depthMm / scale;
      elements.push(
        rect(
          cx - w / 2,
          cz - d / 2,
          w,
          d,
          `class="twod-countertop" data-run-id="${countertop.runId}" pointer-events="none"`,
        ),
      );
      const axis = Math.abs(w) >= Math.abs(d) ? "x" : "z";
      elements.push(
        ...endTick(cx - w / 2, cz, axis, countertop.endConditionStart),
        ...endTick(cx + w / 2, cz, axis, countertop.endConditionEnd),
      );
      elements.push(
        text(
          cx,
          cz - d / 2 - 4,
          `CT ${dimensionLabel(countertop.widthMm)}`,
          `class="twod-countertop-label" font-size="6.5" font-weight="650" text-anchor="middle" pointer-events="none"`,
        ),
      );
    }
  }

  if (options.showRunLabels) {
    for (const bounds of boundsList) {
      elements.push(...renderRunLabel(bounds, ox, oy, scale));
      elements.push(...renderCornerMark(bounds, ox, oy, scale));
    }
  }

  return elements;
}
