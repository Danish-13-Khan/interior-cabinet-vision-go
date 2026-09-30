export const DISCARD_UNSAVED_MESSAGE = "This project has unsaved changes. Open the other file and discard them?";

/** Finder and second-launch opens must ask before replacing unsaved work. */
export function confirmDiscardUnsaved(isDirty: boolean, confirm: (message: string) => boolean): boolean {
  if (!isDirty) return true;
  return confirm(DISCARD_UNSAVED_MESSAGE);
}
