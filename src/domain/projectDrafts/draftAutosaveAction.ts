export type DraftAutosaveAction = "adopt" | "hold" | "skip" | "write";

/**
 * The first document is the baseline even while autosave is off. Opening a
 * project before the draft store is ready must not become that baseline, or
 * the opened project is never written. Matching contents are left alone, so a
 * new object with the same document does not restart the save timer.
 */
export function draftAutosaveAction(args: {
  baseline: string | null;
  enabled: boolean;
  suspended: boolean;
  fingerprint: string;
  canSave: boolean;
}): DraftAutosaveAction {
  if (args.baseline === null) return "adopt";
  if (!args.enabled || args.suspended) return "hold";
  if (!args.canSave || args.baseline === args.fingerprint) return "skip";
  return "write";
}
