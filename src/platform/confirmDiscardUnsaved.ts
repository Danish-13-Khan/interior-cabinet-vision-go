export const DISCARD_UNSAVED_MESSAGE = "This project has unsaved changes. Open the other file and discard them?";

/**
 * Finder and second-launch opens must ask before replacing unsaved work.
 * The answer is awaited: Tauri's dialog plugin makes window.confirm async, so a
 * synchronous call returns a Promise that is always truthy.
 */
export async function confirmDiscardUnsaved(
  isDirty: boolean,
  confirm: (message: string) => boolean | Promise<boolean>,
): Promise<boolean> {
  if (!isDirty) return true;
  return (await confirm(DISCARD_UNSAVED_MESSAGE)) === true;
}

/** Native question dialog in the desktop app. */
export async function askDiscardUnsaved(message: string): Promise<boolean> {
  const { ask } = await import("@tauri-apps/plugin-dialog");
  return ask(message, { title: "Unsaved changes", kind: "warning", okLabel: "Discard and open", cancelLabel: "Keep editing" });
}
