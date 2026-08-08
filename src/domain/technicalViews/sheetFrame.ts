import {
  MARGIN,
  PRINT_TOP_PAD,
  SCALE,
  TITLE_BLOCK_HEIGHT,
} from "./constants";

export type SheetFrameInput = {
  spanMm: number;
  crossMm: number;
  mode?: "interactive" | "print";
  /** Extra bottom space for dimension lanes (SVG px). */
  bottomLanes?: number;
  /** Extra side space for dimension lanes (SVG px). */
  sideLanes?: number;
};

export type SheetFrame = {
  svgWidth: number;
  svgHeight: number;
  ox: number;
  oy: number;
  scale: number;
  print: boolean;
};

export function computeSheetFrame(input: SheetFrameInput): SheetFrame {
  const print = input.mode === "print";
  const bottom = input.bottomLanes ?? (print ? 28 : 36);
  const side = input.sideLanes ?? (print ? 16 : 20);
  const top = print ? PRINT_TOP_PAD + TITLE_BLOCK_HEIGHT : 0;
  const svgWidth = input.spanMm / SCALE + MARGIN * 2 + side;
  const svgHeight = input.crossMm / SCALE + MARGIN * 2 + top + bottom;
  const ox = MARGIN + input.spanMm / SCALE / 2;
  const oy = MARGIN + input.crossMm / SCALE / 2 + (print ? PRINT_TOP_PAD : 0);
  return { svgWidth, svgHeight, ox, oy, scale: SCALE, print };
}

export function sheetBackground(svgWidth: number, svgHeight: number, print: boolean) {
  const fill = print ? "#ffffff" : "var(--drawing-bg, #ffffff)";
  return `<rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" fill="${fill}" class="twod-sheet" />`;
}

export function wrapTechnicalSvg(
  frame: SheetFrame,
  view: "plan" | "front" | "side" | "section" | "report",
  elements: string[],
) {
  const mode = frame.print ? "print" : "interactive";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${frame.svgWidth}" height="${frame.svgHeight}" viewBox="0 0 ${frame.svgWidth} ${frame.svgHeight}" class="twod-draft" data-view="${view}" data-mode="${mode}">${elements.join("")}</svg>`;
}
