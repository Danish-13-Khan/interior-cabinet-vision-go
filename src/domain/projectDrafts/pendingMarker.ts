import { DRAFT_PENDING_PREFIX } from "./types";

export function draftPendingKey(projectId: string): string {
  return `${DRAFT_PENDING_PREFIX}${projectId}`;
}

export function markDraftPending(storage: Pick<Storage, "setItem">, projectId: string): void {
  storage.setItem(draftPendingKey(projectId), "1");
}

export function clearDraftPending(storage: Pick<Storage, "removeItem">, projectId: string): void {
  storage.removeItem(draftPendingKey(projectId));
}

export function isDraftPending(storage: Pick<Storage, "getItem">, projectId: string): boolean {
  return storage.getItem(draftPendingKey(projectId)) === "1";
}

/** A write only clears the marker when no newer edit started while it was in flight. */
export function shouldClearPending(writeGeneration: number, latestGeneration: number): boolean {
  return writeGeneration === latestGeneration;
}
