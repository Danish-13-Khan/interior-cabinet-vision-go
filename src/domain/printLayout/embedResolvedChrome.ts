import type { CabinetProject } from "../cabinetDimensions";
import type { ProjectDrafting } from "../draftingAnnotations";
import { resolveSheetChrome } from "../sheetDocuments";
import type { TechnicalViewOptions } from "../technicalViews/types";
import { printChromeSvg, shouldEmbedSheetChrome } from "./printChrome";

/** Resolve catalog/project sheet chrome and optionally embed it in SVG. */
export function embedResolvedPrintChrome(args: {
  sheetId: string;
  svgWidth: number;
  svgHeight: number;
  project: CabinetProject;
  options: TechnicalViewOptions;
  noteView: "top" | "front" | "side" | "all";
  drafting?: ProjectDrafting;
}): string[] {
  if (!shouldEmbedSheetChrome(args.options)) return [];
  const chrome = resolveSheetChrome(args.sheetId, args.project);
  return printChromeSvg({
    svgWidth: args.svgWidth,
    svgHeight: args.svgHeight,
    project: args.project,
    options: {
      ...args.options,
      title: args.options.title ?? chrome.title,
      sheetCode: args.options.sheetCode ?? chrome.code,
      projectName: args.options.projectName ?? chrome.projectName,
    },
    sheetTitle: chrome.title,
    viewLabel: chrome.viewLabel,
    scaleText: chrome.scaleText,
    sheetCode: chrome.code,
    noteView: args.noteView,
    includeNotesArea: chrome.includeNotesArea,
    drafting: args.drafting,
    sheetNotes: chrome.notes,
    revisionRows: chrome.revisionRows,
  });
}
