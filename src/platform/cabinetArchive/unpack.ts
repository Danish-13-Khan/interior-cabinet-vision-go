import { strFromU8, unzipSync } from "fflate";
import { rebuildDwgDataUrls } from "../../domain/projectDrafts/dwgDraftSplit";
import { mapImportedAssetUrls } from "../../domain/livingRoom/storedAssets/fileAssets";
import { isStoredAssetRef, storeAssetBlob, type AssetBlobStore } from "../../domain/livingRoom/storedAssets/refs";
import { mimeForArchivePath } from "./names";

export type UnpackedCabinet = { document: unknown; missing: string[] };

function archiveBytes(files: Record<string, Uint8Array>, path: string): Uint8Array | null {
  return files[path] ?? files[path.replace(/^\//, "")] ?? null;
}

/** Put zip binaries in the blob store and restore underlay previews. No portable JSON size cap. */
export async function unpackCabinetArchive(bytes: Uint8Array, store: AssetBlobStore): Promise<UnpackedCabinet> {
  const files = unzipSync(bytes);
  const projectBytes = archiveBytes(files, "project.json");
  if (!projectBytes) throw new Error("Cabinet file is missing project.json.");
  const previews: Record<string, unknown> = {};
  for (const [path, data] of Object.entries(files)) {
    const match = /^underlays\/(.+)\.json$/.exec(path);
    if (!match) continue;
    previews[match[1]] = JSON.parse(strFromU8(data)) as unknown;
  }
  const missing: string[] = [];
  const withRefs = await mapImportedAssetUrls(JSON.parse(strFromU8(projectBytes)) as unknown, async (url) => {
    if (!url.startsWith("models/") && !url.startsWith("textures/")) {
      if (isStoredAssetRef(url)) missing.push(url);
      return url;
    }
    const data = archiveBytes(files, url);
    if (!data) {
      missing.push(url);
      return url;
    }
    const copy = new Uint8Array(data.byteLength);
    copy.set(data);
    return storeAssetBlob(store, new Blob([copy], { type: mimeForArchivePath(url) }));
  });
  return { document: rebuildDwgDataUrls(withRefs, previews), missing };
}
