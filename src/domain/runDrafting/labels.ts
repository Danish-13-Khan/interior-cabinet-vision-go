import { formatRunMark } from "../shopTerms";
import type { CabinetRun, CabinetRunSide } from "../cabinetLibrary";

export function formatRunShortCode(index: number) {
  return formatRunMark(index);
}

export function formatRunSideLabel(side: CabinetRunSide) {
  switch (side) {
    case "back-wall":
      return "Back wall";
    case "left-wall":
      return "Left wall";
    case "right-wall":
      return "Right wall";
    default:
      return "Free run";
  }
}

export function formatRunDraftLabel(run: CabinetRun, index: number) {
  return `${formatRunShortCode(index)} · ${formatRunSideLabel(run.side)}`;
}
