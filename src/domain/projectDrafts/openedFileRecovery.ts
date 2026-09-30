import type { AssetBlobStore } from "../livingRoom/storedAssets";
import { flushDraftNow, holdDraftWrites, recoveryOffer } from "./browserSignals";
import { noteDraftFileSaved } from "./commitDraft";
import { offerFileDraftRecovery } from "./loadSavedBrowser";
import type { DraftStore } from "./types";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

type Stores = { storage: StorageLike; blobs: AssetBlobStore; drafts: DraftStore };

/** The opened file is now the saved state: write it as the draft, then record the file save after that write. */
export async function acceptOpenedFileAsDraft(projectId: string, stores: Pick<Stores, "drafts" | "storage">): Promise<void> {
  // Let React render the opened file first, so the flush writes it and not the previous project.
  await new Promise((resolve) => setTimeout(resolve, 0));
  await flushDraftNow().catch(() => undefined);
  await noteDraftFileSaved(projectId, stores.drafts, stores.storage).catch(() => undefined);
}

/**
 * Show an opened file without letting autosave overwrite a newer draft of the same project.
 * Writes stay held until the check finishes; a prompt keeps holding them until it is answered.
 */
export async function settleOpenedFile(
  options: Stores & { fileDocument: { id: string; updatedAt?: string }; filePath: string; apply: () => void },
): Promise<void> {
  const release = holdDraftWrites();
  try {
    options.apply();
    await offerFileDraftRecovery(options).catch(() => undefined);
  } finally {
    release();
  }
  if (recoveryOffer.get()) return;
  await acceptOpenedFileAsDraft(options.fileDocument.id, options);
}
