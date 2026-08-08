import { TITLE_BLOCK_HEIGHT } from "./constants";
import { line, rect, shortLabel, text } from "./svgPrimitives";

export function titleBlock(
  svgWidth: number,
  title: string,
  projectName: string,
  viewLabel: string,
  scaleText: string,
  sheetMeta = "",
) {
  const blockH = TITLE_BLOCK_HEIGHT;
  const y = 4;
  const inset = 6;
  return [
    rect(
      inset,
      y,
      svgWidth - inset * 2,
      blockH,
      `class="twod-titleblock"`,
    ),
    line(
      svgWidth - 220,
      y,
      svgWidth - 220,
      y + blockH,
      `class="twod-titleblock-rule"`,
    ),
    line(
      svgWidth - 118,
      y,
      svgWidth - 118,
      y + blockH,
      `class="twod-titleblock-rule"`,
    ),
    text(
      inset + 6,
      y + 11,
      shortLabel(projectName || "Cabinet Project", 34),
      `class="twod-titleblock-text twod-titleblock-strong" font-size="9" text-anchor="start"`,
    ),
    text(
      inset + 6,
      y + 22,
      shortLabel(title + (sheetMeta ? ` · ${sheetMeta}` : ""), 44),
      `class="twod-titleblock-text" font-size="7" text-anchor="start"`,
    ),
    text(
      svgWidth - 214,
      y + 11,
      viewLabel,
      `class="twod-titleblock-text twod-titleblock-strong" font-size="7.5" text-anchor="start"`,
    ),
    text(
      svgWidth - 214,
      y + 22,
      scaleText,
      `class="twod-titleblock-text" font-size="7" text-anchor="start"`,
    ),
    text(
      svgWidth - 112,
      y + 11,
      "TECHNICAL SHEET",
      `class="twod-titleblock-text twod-titleblock-strong" font-size="7.5" text-anchor="start"`,
    ),
    text(
      svgWidth - 112,
      y + 22,
      new Date().toLocaleDateString(),
      `class="twod-titleblock-text" font-size="7" text-anchor="start"`,
    ),
  ];
}
