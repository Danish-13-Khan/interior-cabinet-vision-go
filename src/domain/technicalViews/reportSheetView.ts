import type { CabinetProject } from "../cabinetDimensions";
import { createProjectReport } from "../projectReport";
import type { RoomConfig } from "../roomModel";
import { embedResolvedPrintChrome } from "../printLayout";
import { TITLE_BLOCK_HEIGHT } from "./constants";
import {
  computeSheetFrame,
  sheetBackground,
} from "./sheetFrame";
import { line, rect, shortLabel, text } from "./svgPrimitives";
import type { TechnicalViewOptions, TechnicalViewResult } from "./types";

const ROW_H = 16;
const COL = {
  mark: 48,
  name: 200,
  type: 140,
  w: 70,
  h: 70,
  d: 70,
  run: 120,
} as const;

/**
 * Schedule / report sheet — cabinet schedule as a technical drawing page.
 */
export function reportSheetView(
  project: CabinetProject,
  room: RoomConfig,
  options: TechnicalViewOptions = {},
): TechnicalViewResult {
  const report = createProjectReport(project, room);
  const rows = report.cabinetSchedule;
  const headerRows = 4;
  const contentH = Math.max(280, (rows.length + headerRows) * ROW_H + 48);
  const contentW = 760;
  const frame = computeSheetFrame({
    spanMm: contentW * 4,
    crossMm: contentH * 4,
    mode: options.mode ?? "print",
    bottomLanes: 12,
    sideLanes: 8,
    includeNotesArea: false,
  });
  // Override to fixed sheet size for schedules
  const svgWidth = Math.max(frame.svgWidth, 820);
  const svgHeight = Math.max(frame.svgHeight, contentH + 56);
  const print = options.mode === "print" || options.mode === undefined;
  const elements: string[] = [];

  elements.push(sheetBackground(svgWidth, svgHeight, true));
  elements.push(
    ...embedResolvedPrintChrome({
      sheetId: "report",
      svgWidth,
      svgHeight,
      project,
      options: { ...options, mode: options.mode ?? "print" },
      noteView: "all",
    }),
  );

  const left = 24;
  let y = TITLE_BLOCK_HEIGHT + 18;

  elements.push(
    text(
      left,
      y,
      `${report.summary.projectNumber} · Rev ${report.summary.revision} · ${report.summary.statusLabel}`,
      `class="twod-annotation" font-size="8" text-anchor="start"`,
    ),
  );
  y += 14;
  elements.push(
    text(
      left,
      y,
      `${report.summary.cabinetCount} cabinets · ${report.summary.runCount} runs · ${report.summary.roomSizeLabel}`,
      `class="twod-annotation" font-size="7.5" text-anchor="start"`,
    ),
  );
  y += 18;

  const cols = [
    { key: "mark", x: left, w: COL.mark, label: "MK" },
    { key: "name", x: left + COL.mark, w: COL.name, label: "CABINET" },
    { key: "type", x: left + COL.mark + COL.name, w: COL.type, label: "TYPE" },
    {
      key: "w",
      x: left + COL.mark + COL.name + COL.type,
      w: COL.w,
      label: "W",
    },
    {
      key: "h",
      x: left + COL.mark + COL.name + COL.type + COL.w,
      w: COL.h,
      label: "H",
    },
    {
      key: "d",
      x: left + COL.mark + COL.name + COL.type + COL.w + COL.h,
      w: COL.d,
      label: "D",
    },
    {
      key: "run",
      x: left + COL.mark + COL.name + COL.type + COL.w + COL.h + COL.d,
      w: COL.run,
      label: "RUN",
    },
  ] as const;
  const tableW = cols.reduce((sum, col) => sum + col.w, 0);

  elements.push(
    rect(left, y - 11, tableW, ROW_H, `class="twod-schedule-header"`),
  );
  for (const col of cols) {
    elements.push(
      text(
        col.x + 4,
        y,
        col.label,
        `class="twod-schedule-th" font-size="7" text-anchor="start"`,
      ),
    );
  }
  y += ROW_H;

  if (rows.length === 0) {
    elements.push(
      text(
        left,
        y + 8,
        "No cabinets in schedule.",
        `class="twod-annotation" font-size="8" text-anchor="start"`,
      ),
    );
  }

  for (const [index, row] of rows.entries()) {
    if (index % 2 === 0) {
      elements.push(
        rect(left, y - 11, tableW, ROW_H, `class="twod-schedule-row-alt"`),
      );
    }
    elements.push(
      line(left, y + 5, left + tableW, y + 5, `class="twod-schedule-rule"`),
    );
    const cells = [
      row.mark,
      shortLabel(row.cabinetName, 28),
      shortLabel(row.typeLabel, 18),
      String(Math.round(row.widthMm)),
      String(Math.round(row.heightMm)),
      String(Math.round(row.depthMm)),
      shortLabel(row.runLabel ?? "—", 16),
    ];
    cols.forEach((col, i) => {
      elements.push(
        text(
          col.x + 4,
          y,
          cells[i] ?? "",
          `class="twod-schedule-td" font-size="7" text-anchor="start"`,
        ),
      );
    });
    y += ROW_H;
  }

  y += 16;
  elements.push(
    text(
      left,
      y,
      "A-401 · CABINET SCHEDULE · NOT TO SCALE",
      `class="twod-wall-label" font-size="6.5" text-anchor="start"`,
    ),
  );

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" class="twod-draft" data-view="report" data-mode="${print ? "print" : "interactive"}">${elements.join("")}</svg>`;

  return {
    width: svgWidth,
    height: svgHeight,
    originX: 0,
    originY: 0,
    scale: 1,
    svg,
  };
}
