import type { AssetBlobStore } from "../livingRoom/storedAssets";
import type { SavedProjectBrowserEntry } from "../projectBrowserStorage";
import { recoveryOffer } from "./browserSignals";
import { decideDraftRecovery, type RecoveryDecision, type RecoveryPlatform } from "./recoveryDecision";
import { hydrateBrowserEntries } from "./hydrateBrowserEntries";
import { isDraftPending } from "./pendingMarker";
import { migrateBrowserDrafts } from "./migrateBrowserDrafts";
import { chooseRecoveryProject, readProjectFileBindings } from "./projectFileBinding";
import type { DraftStore } from "./types";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type BrowserRecovery = {
  decision: Exclude<RecoveryDecision, { action: "none" }>;
  entry: SavedProjectBrowserEntry;
  filePath: string | null;
};

export type LoadedBrowser =
  | { ok: false }
  | {
    ok: true;
    entries: SavedProjectBrowserEntry[];
    thumbnails: [string, string | null][];
    recovery: BrowserRecovery | null;
  };

/** Startup load. Any throw becomes ok:false so the caller does not write an empty index. */
export async function loadSavedBrowser(options: {
  storage: StorageLike;
  blobs: AssetBlobStore;
  drafts: DraftStore;
  openFilePath: string | null;
  platform: RecoveryPlatform;
}): Promise<LoadedBrowser> {
  try {
    const index = await migrateBrowserDrafts(options);
    const entries = await hydrateBrowserEntries(index, options.drafts, options.blobs);
    const desktopFile = options.platform === "desktop" && Boolean(options.openFilePath) && options.openFilePath !== "version";
    const choice = desktopFile ? null : chooseRecoveryProject({
      entries,
      openFilePath: null,
      bindings: readProjectFileBindings(options.storage),
    });
    let recovery: BrowserRecovery | null = null;
    const entry = choice ? entries.find((item) => item.id === choice.projectId) : undefined;
    if (choice && entry) {
      const draft = await options.drafts.get(entry.id);
      const decision = decideDraftRecovery({
        platform: options.platform,
        filePath: choice.filePath,
        draftUpdatedAt: entry.updatedAt,
        lastFileSaveAt: draft?.lastFileSaveAt ?? null,
        pending: isDraftPending(options.storage, entry.id),
      });
      if (decision.action !== "none") recovery = { decision, entry, filePath: choice.filePath };
    }
    return {
      ok: true,
      entries,
      thumbnails: index.map((item) => [item.id, item.thumbnailKey]),
      recovery,
    };
  } catch {
    return { ok: false };
  }
}

/** After a desktop file is open, ask only about that project's draft. */
export async function offerDesktopFileRecovery(options: {
  storage: StorageLike;
  blobs: AssetBlobStore;
  drafts: DraftStore;
  projectId: string;
  filePath: string;
}): Promise<void> {
  if (!options.projectId || !options.filePath || options.filePath === "version") return;
  const entries = await hydrateBrowserEntries(
    [{ id: options.projectId, name: options.projectId, updatedAt: "1970-01-01T00:00:00.000Z", thumbnailKey: null }],
    options.drafts,
    options.blobs,
  );
  const entry = entries.find((item) => item.id === options.projectId);
  if (!entry) return;
  const draft = await options.drafts.get(options.projectId);
  const decision = decideDraftRecovery({
    platform: "desktop",
    filePath: options.filePath,
    draftUpdatedAt: entry.updatedAt,
    lastFileSaveAt: draft?.lastFileSaveAt ?? null,
    pending: isDraftPending(options.storage, options.projectId),
  });
  if (decision.action === "ask") recoveryOffer.set({ prompt: decision.prompt, entry, filePath: options.filePath });
}
