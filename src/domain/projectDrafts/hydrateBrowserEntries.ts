import { clampCabinetProject, type CabinetProject } from "../cabinetDimensions";
import { getActiveProjectRoom } from "../projectRooms";
import type { SavedProjectBrowserEntry } from "../projectBrowserStorage";
import { isStoredAssetRef, storedAssetKey, type AssetBlobStore } from "../livingRoom/storedAssets";
import { blobToDataUrl } from "../../utils/dataUrl";
import { rebuildDwgDataUrls } from "./dwgDraftSplit";
import { isDraftBody } from "./draftDocument";
import type { DraftStore, ProjectIndexEntry } from "./types";

async function thumbnailFromKey(key: string | null, blobs: AssetBlobStore): Promise<string> {
  if (!key) return "";
  if (key.startsWith("data:")) return key;
  if (!isStoredAssetRef(key)) return "";
  const blob = await blobs.get(storedAssetKey(key)).catch(() => null);
  return blob ? blobToDataUrl(blob) : "";
}

export async function hydrateBrowserEntries(
  index: ProjectIndexEntry[],
  drafts: DraftStore,
  blobs: AssetBlobStore,
): Promise<SavedProjectBrowserEntry[]> {
  const entries: SavedProjectBrowserEntry[] = [];
  for (const item of index) {
    const draft = await drafts.get(item.id);
    if (!draft) continue;
    const rebuilt = rebuildDwgDataUrls(draft.document, draft.dwgPreviews);
    if (!isDraftBody(rebuilt)) continue;
    try {
      const project = clampCabinetProject(rebuilt.project);
      entries.push({
        id: item.id,
        name: item.name,
        thumbnail: await thumbnailFromKey(item.thumbnailKey, blobs),
        updatedAt: draft.updatedAt,
        project,
        room: rebuilt.room?.dimensions ? rebuilt.room : getActiveProjectRoom(project).config,
      });
    } catch {
      /* skip a draft the cabinet clamp cannot read */
    }
  }
  return entries;
}

export function snapshotFromEntry(entry: SavedProjectBrowserEntry) {
  const project: CabinetProject = entry.project;
  return {
    project,
    room: entry.room,
    selectedCabinetIds: project.cabinets[0]?.id ? [project.cabinets[0].id] : [],
    activeCabinetId: project.cabinets[0]?.id ?? null,
    selectedPanelName: null,
  };
}
