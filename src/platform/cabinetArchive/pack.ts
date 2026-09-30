import { strToU8, zip, type AsyncZippable, type AsyncZippableFile } from "fflate";
import { splitDwgPreviews } from "../../domain/projectDrafts/dwgDraftSplit";
import { mapImportedAssetUrls } from "../../domain/livingRoom/storedAssets/fileAssets";
import { isStoredAssetRef, storedAssetKey, type AssetBlobStore } from "../../domain/livingRoom/storedAssets/refs";
import { dataUrlToBlob, isDataUrl } from "../../utils/dataUrl";
import { sha256Hex } from "./hash";
import { textureExtension, underlayArchivePath } from "./names";
import { assertPackBudget } from "./zipBudget";

export type CabinetPack = { bytes: Uint8Array; missing: string[] };

async function archivePath(blob: Blob, bytes: Uint8Array): Promise<string> {
  const hash = await sha256Hex(bytes);
  if (blob.type.startsWith("image/")) return `textures/${hash}.${textureExtension(blob.type)}`;
  return `models/${hash}.glb`;
}

function entryBytes(entry: AsyncZippableFile): number {
  const data = Array.isArray(entry) ? entry[0] : entry;
  return data instanceof Uint8Array ? data.byteLength : 0;
}

/** Zip a project. Model bytes stay binary; the JSON limit does not apply. */
export async function packCabinetArchive(
  document: unknown,
  store: AssetBlobStore,
  thumbnail?: string | null,
): Promise<CabinetPack> {
  const split = splitDwgPreviews(document);
  const files: AsyncZippable = {};
  const storeOnly = (bytes: Uint8Array): AsyncZippableFile => [bytes, { level: 0 }];
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
    files[path] = storeOnly(bytes);
    return path;
  });
  for (const [id, preview] of Object.entries(split.dwgPreviews)) {
    files[underlayArchivePath(id)] = strToU8(JSON.stringify(preview));
  }
  if (thumbnail && isDataUrl(thumbnail)) {
    files["thumbnail.png"] = storeOnly(new Uint8Array(await dataUrlToBlob(thumbnail).arrayBuffer()));
  }
  files["project.json"] = strToU8(JSON.stringify(rewritten));
  const entries = Object.values(files);
  assertPackBudget(entries.length, entries.reduce((sum, entry) => sum + entryBytes(entry), 0));
  const bytes = await new Promise<Uint8Array>((resolve, reject) => {
    zip(files, (error, data) => (error ? reject(error) : resolve(data)));
  });
  return { bytes, missing };
}
