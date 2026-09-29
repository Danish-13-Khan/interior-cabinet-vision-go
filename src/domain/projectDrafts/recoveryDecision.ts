export type RecoveryPlatform = "web" | "desktop";

export type RecoveryDecision =
  | { action: "none" }
  | { action: "open-draft"; notice: string | null }
  | { action: "ask"; prompt: string };

export function formatAutosaveTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function recoveredAutosaveNotice(updatedAt: string, formatTime: (iso: string) => string = formatAutosaveTime): string {
  return `Recovered from autosave at ${formatTime(updatedAt)}`;
}

/**
 * Web has only the draft, so it opens without asking.
 * Desktop asks only when a file-backed draft is newer than the last file save.
 */
export function decideDraftRecovery(input: {
  platform: RecoveryPlatform;
  filePath: string | null;
  draftUpdatedAt: string | null;
  lastFileSaveAt: string | null;
  pending: boolean;
  formatTime?: (iso: string) => string;
}): RecoveryDecision {
  if (!input.draftUpdatedAt) return { action: "none" };
  const formatTime = input.formatTime ?? formatAutosaveTime;
  const desktopFile = input.platform === "desktop" && Boolean(input.filePath);
  if (desktopFile) {
    const draftTime = Date.parse(input.draftUpdatedAt);
    const fileTime = input.lastFileSaveAt ? Date.parse(input.lastFileSaveAt) : Number.NEGATIVE_INFINITY;
    if (draftTime > fileTime) {
      return { action: "ask", prompt: `Restore unsaved changes from ${formatTime(input.draftUpdatedAt)}?` };
    }
    return { action: "none" };
  }
  return {
    action: "open-draft",
    notice: input.pending ? recoveredAutosaveNotice(input.draftUpdatedAt, formatTime) : null,
  };
}
