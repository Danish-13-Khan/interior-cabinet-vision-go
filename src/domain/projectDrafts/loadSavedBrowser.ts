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
  | { ok: false; error: string }
  | {
    ok: true;
    entries: SavedProjectBrowserEntry[];
    thumbnails: [string, string | null][];
    recovery: BrowserRecovery | null;
    /** Some old projects could not be moved yet; they stay in localStorage for the next launch. */
    partial: boolean;
  };

/** Sticky message for a load that could not show every saved project. The data itself is left in place. */
export function savedProjectsWarning(result: LoadedBrowser): string | null {
  if (!result.ok) return `Saved projects could not be loaded (${result.error}). Nothing was deleted; reload to try again.`;
  if (result.partial) return "Some older saved projects could not be moved to the new storage yet. They are kept and will be retried on the next launch.";
  return null;
}

/** Startup load. Any throw becomes ok:false so the caller does not write an empty index. */
export async function loadSavedBrowser(options: {
  storage: StorageLike;
  blobs: AssetBlobStore;
  drafts: DraftStore;
  openFilePath: string | null;
  platform: RecoveryPlatform;
}): Promise<LoadedBrowser> {
  try {
    let partial = false;
    const index = await migrateBrowserDrafts({ ...options, onPartialFailure: () => { partial = true; } });
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
      partial,
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Saved projects could not be read." };
  }
}

function sameContent(left: unknown, right: unknown): boolean {
  if (!left || !right || typeof left !== "object" || typeof right !== "object") return false;
  return JSON.stringify({ ...left, updatedAt: "" }) === JSON.stringify({ ...right, updatedAt: "" });
}

/**
 * After a file is opened, ask only about that project's draft, and only when the draft
 * is newer than the file itself and holds different content.
 */
export async function offerFileDraftRecovery(options: {
  storage: StorageLike;
  blobs: AssetBlobStore;
  drafts: DraftStore;
  fileDocument: { id: string; updatedAt?: string };
  filePath: string;
}): Promise<void> {
  const projectId = options.fileDocument.id;
  if (!projectId || !options.filePath || options.filePath === "version") return;
  const entries = await hydrateBrowserEntries(
    [{ id: projectId, name: projectId, updatedAt: "1970-01-01T00:00:00.000Z", thumbnailKey: null }],
    options.drafts,
    options.blobs,
  );
  const entry = entries.find((item) => item.id === projectId);
  if (!entry) return;
  const fileTime = Date.parse(options.fileDocument.updatedAt ?? "");
  if (!Number.isNaN(fileTime) && Date.parse(entry.updatedAt) <= fileTime) return;
  if (sameContent(entry.project.interiorDocument, options.fileDocument)) return;
  const draft = await options.drafts.get(projectId);
  const decision = decideDraftRecovery({
    platform: "desktop",
    filePath: options.filePath,
    draftUpdatedAt: entry.updatedAt,
    lastFileSaveAt: draft?.lastFileSaveAt ?? null,
    pending: isDraftPending(options.storage, projectId),
  });
  if (decision.action === "ask") recoveryOffer.set({ prompt: decision.prompt, entry, filePath: options.filePath });
}
