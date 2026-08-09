import type { CabinetProject } from "../cabinetDimensions";
import { clampJobMeta } from "../jobMeta";
import type { ProjectDrafting } from "../draftingAnnotations";
import {
  renderSheetRevisionTable,
} from "../sheetDocuments/revisionTable";
import type { SheetRevisionRow } from "../sheetDocuments/types";
import type { TechnicalViewOptions } from "../technicalViews/types";
import { PRINT_INFO_BLOCK_HEIGHT, PRINT_NOTES_HEIGHT } from "../technicalViews/constants";
import { buildTitleBlockData } from "./buildTitleBlockData";
import { collectPrintNoteLines } from "./notes";
import {
  renderPrintNotesArea,
  renderRevisionInfoBlock,
} from "./notesAreaSvg";
import { renderStandardTitleBlock } from "./titleBlockSvg";
import type { TitleBlockData } from "./types";

export function printChromeSvg(args: {
  svgWidth: number;
  svgHeight: number;
  project: CabinetProject;
  options: TechnicalViewOptions;
  sheetTitle: string;
  viewLabel: string;
  scaleText: string;
  sheetCode: string;
  noteView: "top" | "front" | "side" | "all";
  includeNotesArea?: boolean;
  drafting?: ProjectDrafting;
  sheetNotes?: string[];
  revisionRows?: SheetRevisionRow[];
}): string[] {
  const data = buildTitleBlockData({
    project: args.project,
    options: args.options,
    sheetTitle: args.sheetTitle,
    viewLabel: args.viewLabel,
    scaleText: args.scaleText,
    sheetCode: args.sheetCode,
  });
  const elements = [...renderStandardTitleBlock(args.svgWidth, data)];
  if (args.includeNotesArea === false) return elements;

  const job = clampJobMeta(args.project.job);
  const draftingNotes = collectPrintNoteLines(
    args.drafting ?? args.options.drafting ?? args.project.drafting,
    args.noteView,
    job.notes,
  );
  const notes = [
    ...(args.sheetNotes ?? []).map((note) => note.trim()).filter(Boolean),
    ...draftingNotes,
  ].slice(0, 5);
  elements.push(...renderRevisionInfoBlock(args.svgWidth, args.svgHeight, data));
  if (args.revisionRows && args.revisionRows.length > 0) {
    const revY = args.svgHeight - PRINT_NOTES_HEIGHT - PRINT_INFO_BLOCK_HEIGHT - 36;
    elements.push(
      ...renderSheetRevisionTable(args.svgWidth, revY, args.revisionRows, 28),
    );
  }
  elements.push(...renderPrintNotesArea(args.svgWidth, args.svgHeight, notes));
  return elements;
}

export function printBottomReservePx(includeNotesArea = true) {
  if (!includeNotesArea) return 0;
  return PRINT_NOTES_HEIGHT + PRINT_INFO_BLOCK_HEIGHT + 8;
}

/** Print mode embeds SVG chrome unless PDF compose opts out. */
export function shouldEmbedSheetChrome(options: {
  mode?: "interactive" | "print";
  embedSheetChrome?: boolean;
}) {
  if (options.mode !== "print") return false;
  return options.embedSheetChrome !== false;
}

export type { TitleBlockData };
