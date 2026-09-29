import { clearDraftPending, shouldClearPending } from "./pendingMarker";
import type { DraftStore, ProjectDraft } from "./types";

export async function commitDraftSave(
  draft: ProjectDraft,
  store: DraftStore,
  storage: Pick<Storage, "removeItem">,
  writeGeneration: number,
  latestGeneration: number,
): Promise<void> {
  await store.put(draft);
  if (shouldClearPending(writeGeneration, latestGeneration)) clearDraftPending(storage, draft.id);
}

export async function noteDraftFileSaved(
  projectId: string,
  store: DraftStore,
  storage: Pick<Storage, "removeItem"> | null,
  savedAt = new Date().toISOString(),
): Promise<void> {
  const existing = await store.get(projectId);
  if (!existing) return;
  await store.put({ ...existing, lastFileSaveAt: savedAt });
  if (storage) clearDraftPending(storage, projectId);
}
