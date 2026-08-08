import { PRINT_NOTES_HEIGHT } from "../technicalViews/constants";
import { line, rect, shortLabel, text } from "../technicalViews/svgPrimitives";
import {
  DEFAULT_PRINT_NOTE_PLACEHOLDER,
} from "./notes";
import type { TitleBlockData } from "./types";

/** Bottom notes band for printable sheets. */
export function renderPrintNotesArea(
  svgWidth: number,
  svgHeight: number,
  noteLines: string[],
): string[] {
  const h = PRINT_NOTES_HEIGHT;
  const inset = 6;
  const y = svgHeight - h - 4;
  const width = svgWidth - inset * 2;
  const elements = [
    rect(inset, y, width, h, `class="twod-notes-area"`),
    line(inset, y + 12, inset + width, y + 12, `class="twod-notes-area-rule"`),
    text(
      inset + 5,
      y + 9,
      "NOTES",
      `class="twod-notes-area-label" font-size="6.5" text-anchor="start"`,
    ),
  ];

  const lines =
    noteLines.length > 0
      ? noteLines
      : [DEFAULT_PRINT_NOTE_PLACEHOLDER];

  lines.slice(0, 4).forEach((lineText, index) => {
    elements.push(
      text(
        inset + 5,
        y + 22 + index * 8,
        shortLabel(`• ${lineText}`, 92),
        `class="twod-notes-area-text" font-size="6" text-anchor="start"`,
      ),
    );
  });

  return elements;
}

/** Compact revision/date/info strip above the notes area. */
export function renderRevisionInfoBlock(
  svgWidth: number,
  svgHeight: number,
  data: TitleBlockData,
): string[] {
  const notesH = PRINT_NOTES_HEIGHT;
  const h = 14;
  const inset = 6;
  const y = svgHeight - notesH - h - 6;
  const width = svgWidth - inset * 2;
  const col = width / 4;
  return [
    rect(inset, y, width, h, `class="twod-info-block"`),
    line(inset + col, y, inset + col, y + h, `class="twod-info-block-rule"`),
    line(inset + col * 2, y, inset + col * 2, y + h, `class="twod-info-block-rule"`),
    line(inset + col * 3, y, inset + col * 3, y + h, `class="twod-info-block-rule"`),
    text(
      inset + 4,
      y + 9.5,
      `REV ${data.revision}`,
      `class="twod-info-block-text" font-size="6" text-anchor="start"`,
    ),
    text(
      inset + col + 4,
      y + 9.5,
      `DATE ${data.dateText}`,
      `class="twod-info-block-text" font-size="6" text-anchor="start"`,
    ),
    text(
      inset + col * 2 + 4,
      y + 9.5,
      `NO. ${shortLabel(data.projectNumber, 14)}`,
      `class="twod-info-block-text" font-size="6" text-anchor="start"`,
    ),
    text(
      inset + col * 3 + 4,
      y + 9.5,
      shortLabel(`${data.statusLabel} · ${data.sheetCode}`, 22),
      `class="twod-info-block-text" font-size="6" text-anchor="start"`,
    ),
  ];
}
