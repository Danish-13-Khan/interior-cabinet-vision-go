import type { ProjectDraft } from "./types";

/** Documents prune must treat as live: the open project plus every draft. */
export function documentsInUse(current: unknown, drafts: readonly ProjectDraft[]): unknown[] {
  return [current, ...drafts.map((draft) => draft.document)];
}
