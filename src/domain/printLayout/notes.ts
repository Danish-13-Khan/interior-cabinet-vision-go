import {
  clampProjectDrafting,
  type DraftingViewTarget,
  type ProjectDrafting,
} from "../draftingAnnotations";

export function collectPrintNoteLines(
  drafting: ProjectDrafting | undefined,
  noteView: DraftingViewTarget | "all",
  jobNotes = "",
  maxLines = 5,
): string[] {
  const safe = clampProjectDrafting(drafting);
  const fromNotes = safe.notes
    .filter((note) => note.view === "all" || note.view === noteView)
    .map((note) => note.text.trim())
    .filter(Boolean);
  const fromLeaders = safe.leaders
    .filter((leader) => leader.view === "all" || leader.view === noteView)
    .map((leader) => leader.text.trim())
    .filter(Boolean);
  const fromJob = jobNotes
    .split(/\n|;/)
    .map((line) => line.trim())
    .filter(Boolean);
  return [...fromNotes, ...fromLeaders, ...fromJob].slice(0, maxLines);
}

export const DEFAULT_PRINT_NOTE_PLACEHOLDER =
  "Mark clearances, appliance models, filler decisions, and approval initials.";
