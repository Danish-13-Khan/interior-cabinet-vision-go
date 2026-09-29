import { strToU8, zipSync } from "fflate";
import { splitDwgPreviews } from "../../domain/projectDrafts/dwgDraftSplit";
import { mapImportedAssetUrls } from "../../domain/livingRoom/storedAssets/fileAssets";
import { isStoredAssetRef, storedAssetKey, type AssetBlobStore } from "../../domain/livingRoom/storedAssets/refs";
import { dataUrlToBlob, isDataUrl } from "../../utils/dataUrl";
import { sha256Hex } from "./hash";
import { textureExtension, underlayArchivePath } from "./names";

export type CabinetPack = { bytes: Uint8Array; missing: string[] };

async function archivePath(blob: Blob, bytes: Uint8Array): Promise<string> {
  const hash = await sha256Hex(bytes);
  if (blob.type.startsWith("image/")) return `textures/${hash}.${textureExtension(blob.type)}`;
  return `models/${hash}.glb`;
}

/** Zip a project. Model bytes stay binary; the JSON limit does not apply. */
export async function packCabinetArchive(
  document: unknown,
  store: AssetBlobStore,
  thumbnail?: string | null,
): Promise<CabinetPack> {
  const split = splitDwgPreviews(document);
  const files: Record<string, Uint8Array> = {};
  const missing: string[] = [];
  const rewritten = await mapImportedAssetUrls(split.document, async (url) => {
    if (!isStoredAssetRef(url)) return url;
    const blob = await store.get(storedAssetKey(url)).catch(() => null);
    if (!blob) {
      missing.push(url);
      return url;
    }
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const path = await archivePath(blob, bytes);
    files[path] = bytes;
    return path;
  });
  for (const [id, preview] of Object.entries(split.dwgPreviews)) {
    files[underlayArchivePath(id)] = strToU8(JSON.stringify(preview));
  }
  if (thumbnail && isDataUrl(thumbnail)) {
    files["thumbnail.png"] = new Uint8Array(await dataUrlToBlob(thumbnail).arrayBuffer());
  }
  files["project.json"] = strToU8(JSON.stringify(rewritten));
  return { bytes: zipSync(files), missing };
}
