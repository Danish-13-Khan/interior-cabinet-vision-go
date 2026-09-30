import { pendingEpochNow } from "./browserSignals";
import { clearDraftPending, shouldClearPending } from "./pendingMarker";
import type { DraftStore, ProjectDraft } from "./types";

let tail: Promise<void> = Promise.resolve();

/** File saves and autosaves must not interleave, or a stale lastFileSaveAt wins. */
function exclusive<T>(task: () => Promise<T>): Promise<T> {
  const run = tail.then(task, task);
  tail = run.then(() => undefined, () => undefined);
  return run;
}

function generationOf(latest: number | (() => number)): number {
  return typeof latest === "function" ? latest() : latest;
}

export async function commitDraftSave(
  draft: ProjectDraft,
  store: DraftStore,
  storage: Pick<Storage, "removeItem">,
  writeGeneration: number,
  latestGeneration: number | (() => number),
): Promise<void> {
  await exclusive(async () => {
    const latest = await store.get(draft.id);
    await store.put({ ...draft, lastFileSaveAt: latest?.lastFileSaveAt ?? draft.lastFileSaveAt });
    if (shouldClearPending(writeGeneration, generationOf(latestGeneration))) clearDraftPending(storage, draft.id);
  });
}

export async function noteDraftFileSaved(
  projectId: string,
  store: DraftStore,
  storage: Pick<Storage, "removeItem"> | null,
  savedAt = new Date().toISOString(),
  epochAtStart?: number,
): Promise<void> {
  await exclusive(async () => {
    const existing = await store.get(projectId);
    if (!existing) return;
    await store.put({ ...existing, lastFileSaveAt: savedAt });
    if (!storage) return;
    if (epochAtStart !== undefined && epochAtStart !== pendingEpochNow()) return;
    clearDraftPending(storage, projectId);
  });
}
