import { TITLE_BLOCK_HEIGHT } from "../technicalViews/constants";
import { line, rect, shortLabel, text } from "../technicalViews/svgPrimitives";
import type { TitleBlockData } from "./types";

/**
 * Standard multi-cell title block for printable technical sheets.
 * Layout (left → right): Project | Sheet/Scale | Rev/Date/Info
 */
export function renderStandardTitleBlock(
  svgWidth: number,
  data: TitleBlockData,
): string[] {
  const blockH = TITLE_BLOCK_HEIGHT;
  const y = 4;
  const inset = 6;
  const left = inset;
  const width = svgWidth - inset * 2;
  const mid = left + width * 0.52;
  const right = left + width * 0.72;
  const info = left + width * 0.86;

  return [
    rect(left, y, width, blockH, `class="twod-titleblock"`),
    line(mid, y, mid, y + blockH, `class="twod-titleblock-rule"`),
    line(right, y, right, y + blockH, `class="twod-titleblock-rule"`),
    line(info, y, info, y + blockH, `class="twod-titleblock-rule"`),
    line(left, y + blockH * 0.38, mid, y + blockH * 0.38, `class="twod-titleblock-rule"`),
    line(mid, y + blockH * 0.5, info, y + blockH * 0.5, `class="twod-titleblock-rule"`),
    line(info, y + blockH / 3, left + width, y + blockH / 3, `class="twod-titleblock-rule"`),
    line(info, y + (blockH * 2) / 3, left + width, y + (blockH * 2) / 3, `class="twod-titleblock-rule"`),

    text(
      left + 5,
      y + 10,
      shortLabel(data.projectName, 36),
      `class="twod-titleblock-text twod-titleblock-strong" font-size="8.5" text-anchor="start"`,
    ),
    text(
      left + 5,
      y + 21,
      shortLabel(data.sheetTitle, 40),
      `class="twod-titleblock-text" font-size="6.5" text-anchor="start"`,
    ),
    text(
      left + 5,
      y + 31,
      shortLabel(
        `${data.projectNumber} · ${data.customerName} · ${data.metaLine}`,
        48,
      ),
      `class="twod-titleblock-text twod-titleblock-muted" font-size="5.5" text-anchor="start"`,
    ),

    text(
      mid + 5,
      y + 10,
      data.viewLabel,
      `class="twod-titleblock-text twod-titleblock-strong" font-size="7" text-anchor="start"`,
    ),
    text(
      mid + 5,
      y + 22,
      `SCALE ${data.scaleText}`,
      `class="twod-titleblock-text" font-size="6.5" text-anchor="start"`,
    ),
    text(
      mid + 5,
      y + 32,
      shortLabel(data.statusLabel, 16),
      `class="twod-titleblock-text twod-titleblock-muted" font-size="5.5" text-anchor="start"`,
    ),

    text(
      right + 4,
      y + 10,
      data.sheetCode,
      `class="twod-titleblock-text twod-titleblock-strong" font-size="7.5" text-anchor="start"`,
    ),
    text(
      right + 4,
      y + 22,
      `SHEET`,
      `class="twod-titleblock-text twod-titleblock-muted" font-size="5.5" text-anchor="start"`,
    ),
    text(
      right + 4,
      y + 32,
      shortLabel(data.dateText, 12),
      `class="twod-titleblock-text" font-size="6" text-anchor="start"`,
    ),

    text(
      info + 3,
      y + 8,
      `REV ${data.revision}`,
      `class="twod-titleblock-text twod-titleblock-strong" font-size="6.5" text-anchor="start"`,
    ),
    text(
      info + 3,
      y + 19,
      `DRN ${shortLabel(data.drawnBy, 8)}`,
      `class="twod-titleblock-text" font-size="5.5" text-anchor="start"`,
    ),
    text(
      info + 3,
      y + 30,
      `CHK ${shortLabel(data.checkedBy, 8)}`,
      `class="twod-titleblock-text" font-size="5.5" text-anchor="start"`,
    ),
  ];
}
