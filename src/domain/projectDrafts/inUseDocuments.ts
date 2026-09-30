import type { ProjectDraft } from "./types";

type StoredDocument = { document: unknown };

/** Documents prune must treat as live: the open project, every draft, and every snapshot. */
export function documentsInUse(
  current: unknown,
  drafts: readonly ProjectDraft[] | readonly StoredDocument[],
  snapshots: readonly StoredDocument[] = [],
): unknown[] {
  return [current, ...drafts.map((draft) => draft.document), ...snapshots.map((snapshot) => snapshot.document)];
}
