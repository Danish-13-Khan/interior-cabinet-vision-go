import { serializeInteriorProjectFile, type InteriorProject } from "../domain/interiorProject";
import { assertPortableProjectFileByteLimit } from "../domain/interiorProject/fileFormatLimits";
import {
  embedStoredAssets,
  stashEmbeddedAssets,
  type AssetBlobStore,
} from "../domain/livingRoom/storedAssets";
import { indexedDbAssetBlobStore } from "./assetBlobStore";

export type PortableProjectFile = { text: string; missing: string[] };

/** Project files must be portable, so imported model bytes are embedded rather than left as `idb:` refs. */
export async function serializeProjectFileWithAssets(
  document: InteriorProject,
  store: AssetBlobStore = indexedDbAssetBlobStore,
): Promise<PortableProjectFile> {
  const { value, missing } = await embedStoredAssets(document, store);
  const text = serializeInteriorProjectFile(value);
  assertPortableProjectFileByteLimit(new Blob([text]).size);
  return { text, missing };
}

/** Parse a project file and move embedded model bytes into the blob store, keeping the in-memory project small. */
export async function parseProjectFileText(
  raw: string,
  store: AssetBlobStore = indexedDbAssetBlobStore,
): Promise<unknown> {
  assertPortableProjectFileByteLimit(new Blob([raw]).size);
  return stashEmbeddedAssets(JSON.parse(raw) as unknown, store);
}
