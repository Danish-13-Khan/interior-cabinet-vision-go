import { cabinetProjectFromInteriorProject, loadInteriorProjectFile } from "../interiorProject";
import { LIVING_ROOM_RECOVERY_STORAGE_KEY } from "../livingRoom/desktopExperience";
import { stashEmbeddedAssets, storeAssetBlob, type AssetBlobStore } from "../livingRoom/storedAssets";
import { PROJECT_BROWSER_STORAGE_KEY } from "../projectBrowserStorage";
import { dataUrlToBlob } from "../../utils/dataUrl";
import { isDraftBody, projectIdOf, schemaVersionOf, type DraftBody } from "./draftDocument";
import { splitDwgPreviews } from "./dwgDraftSplit";
import { readStoredBrowserList, writeProjectIndex } from "./projectIndex";
import type { DraftStore, ProjectDraft, ProjectIndexEntry } from "./types";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type LegacyEntry = { id?: string; name?: string; thumbnail?: string; updatedAt?: string; project?: unknown; room?: unknown };

function asLegacy(value: unknown): LegacyEntry | null {
  return value && typeof value === "object" ? value as LegacyEntry : null;
}

function upsertIndex(index: ProjectIndexEntry[], entry: ProjectIndexEntry): void {
  const found = index.find((item) => item.id === entry.id);
  if (!found) { index.push(entry); return; }
  if (Date.parse(entry.updatedAt) >= Date.parse(found.updatedAt)) {
    found.updatedAt = entry.updatedAt;
    found.name = entry.name || found.name;
    if (entry.thumbnailKey) found.thumbnailKey = entry.thumbnailKey;
  }
}

async function thumbnailKeyFor(thumbnail: unknown, blobs: AssetBlobStore): Promise<string | null> {
  if (typeof thumbnail !== "string" || !thumbnail.startsWith("data:")) return null;
  try { return await storeAssetBlob(blobs, dataUrlToBlob(thumbnail)); } catch { return null; }
}

async function putBody(
  drafts: DraftStore,
  index: ProjectIndexEntry[],
  id: string,
  name: string,
  updatedAt: string,
  body: DraftBody,
  thumbnailKey: string | null,
): Promise<void> {
  const split = splitDwgPreviews(body);
  const draft: ProjectDraft = {
    id,
    document: split.document,
    dwgPreviews: split.dwgPreviews,
    updatedAt,
    schemaVersion: schemaVersionOf(body.project),
    lastFileSaveAt: null,
  };
  const existing = await drafts.get(id);
  if (!existing || Date.parse(updatedAt) >= Date.parse(existing.updatedAt)) {
    if (existing?.lastFileSaveAt) draft.lastFileSaveAt = existing.lastFileSaveAt;
    await drafts.put(draft);
  }
  upsertIndex(index, { id, name, updatedAt, thumbnailKey });
}

/**
 * Fold the old recovery snapshot into the drafts. Unreadable data is dropped (nothing to save);
 * a failed draft write keeps the key so the next launch can retry. Never throws.
 */
async function foldRecovery(storage: StorageLike, drafts: DraftStore, index: ProjectIndexEntry[]): Promise<boolean> {
  const raw = storage.getItem(LIVING_ROOM_RECOVERY_STORAGE_KEY);
  if (!raw) return false;
  let body: { id: string; name: string; savedAt: string; compatible: DraftBody } | null = null;
  try {
    const parsed = JSON.parse(raw) as { savedAt?: string; project?: unknown };
    const loaded = parsed.project ? loadInteriorProjectFile(parsed.project) : null;
    const compatible = loaded?.document ? cabinetProjectFromInteriorProject(loaded.document) : null;
    if (loaded?.document && compatible && isDraftBody(compatible)) {
      const savedAt = typeof parsed.savedAt === "string" ? parsed.savedAt : new Date(0).toISOString();
      body = { id: loaded.document.id, name: loaded.document.name, savedAt, compatible };
    }
  } catch {
    body = null;
  }
  if (!body) {
    storage.removeItem(LIVING_ROOM_RECOVERY_STORAGE_KEY);
    return false;
  }
  try {
    await putBody(drafts, index, body.id, body.name, body.savedAt, body.compatible, null);
  } catch {
    return false;
  }
  storage.removeItem(LIVING_ROOM_RECOVERY_STORAGE_KEY);
  return true;
}

/** Move full localStorage projects (and the old recovery snapshot) into the one draft store. */
export async function migrateBrowserDrafts(options: {
  storage: StorageLike;
  blobs: AssetBlobStore;
  drafts: DraftStore;
  onPartialFailure?: () => void;
}): Promise<ProjectIndexEntry[]> {
  const stored = readStoredBrowserList(options.storage.getItem(PROJECT_BROWSER_STORAGE_KEY));
  const index: ProjectIndexEntry[] = stored.index.map((entry) => ({ ...entry }));
  let legacyFailed = false;
  for (const item of stored.legacy ?? []) {
    const entry = asLegacy(item);
    if (!entry?.project || typeof entry.project !== "object") continue;
    try {
      const project = await stashEmbeddedAssets(entry.project, options.blobs) as DraftBody["project"];
      const id = projectIdOf(project, typeof entry.id === "string" ? entry.id : "");
      if (!id) continue;
      const room = (entry.room ?? {}) as DraftBody["room"];
      const thumbnailKey = await thumbnailKeyFor(entry.thumbnail, options.blobs);
      await putBody(options.drafts, index, id, entry.name || "Project", entry.updatedAt || new Date(0).toISOString(), { project, room }, thumbnailKey);
    } catch {
      // Keep going: one bad project must not hide the others. The legacy list stays for a retry.
      legacyFailed = true;
    }
  }
  // Leave the old recovery key alone too: the index that would list it is not written this time.
  const folded = legacyFailed ? false : await foldRecovery(options.storage, options.drafts, index);
  // Overwriting the legacy list after a failed item would drop that item for good.
  if (legacyFailed) options.onPartialFailure?.();
  else if (stored.legacy || folded) writeProjectIndex(index, options.storage);
  return index;
}
