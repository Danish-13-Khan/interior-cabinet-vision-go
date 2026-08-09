import { text, rect, line } from "../technicalViews/svgPrimitives";
import type { SheetRevisionRow } from "./types";

/** Compact revision table for sheet documentation chrome. */
export function renderSheetRevisionTable(
  svgWidth: number,
  y: number,
  rows: SheetRevisionRow[],
  height = 28,
): string[] {
  const inset = 6;
  const width = svgWidth - inset * 2;
  const elements = [
    rect(inset, y, width, height, `class="twod-revision-table"`),
    line(inset, y + 10, inset + width, y + 10, `class="twod-notes-area-rule"`),
    text(
      inset + 4,
      y + 8,
      "REVISIONS",
      `class="twod-notes-area-label" font-size="6.5" text-anchor="start"`,
    ),
  ];

  const cols = [0.08, 0.18, 0.52, 0.22];
  const headers = ["REV", "DATE", "DESCRIPTION", "BY"];
  let x = inset + 4;
  headers.forEach((header, index) => {
    elements.push(
      text(
        x,
        y + 18,
        header,
        `class="twod-revision-table-head" font-size="5.5" text-anchor="start"`,
      ),
    );
    x += width * cols[index]!;
  });

  const row = rows[0];
  if (row) {
    const values = [row.revision, row.date, row.description, row.by];
    x = inset + 4;
    values.forEach((value, index) => {
      elements.push(
        text(
          x,
          y + 25,
          String(value).slice(0, index === 2 ? 42 : 14),
          `class="twod-revision-table-text" font-size="5.5" text-anchor="start"`,
        ),
      );
      x += width * cols[index]!;
    });
  }

  return elements;
}
