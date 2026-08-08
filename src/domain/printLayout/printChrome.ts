import type { CabinetProject } from "../cabinetDimensions";
import { clampJobMeta } from "../jobMeta";
import type { ProjectDrafting } from "../draftingAnnotations";
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
  const notes = collectPrintNoteLines(
    args.drafting ?? args.options.drafting ?? args.project.drafting,
    args.noteView,
    job.notes,
  );
  elements.push(...renderRevisionInfoBlock(args.svgWidth, args.svgHeight, data));
  elements.push(...renderPrintNotesArea(args.svgWidth, args.svgHeight, notes));
  return elements;
}

export function printBottomReservePx(includeNotesArea = true) {
  if (!includeNotesArea) return 0;
  return PRINT_NOTES_HEIGHT + PRINT_INFO_BLOCK_HEIGHT + 8;
}

export type { TitleBlockData };
