import { serializeInteriorProjectFile, type InteriorProject } from "../domain/interiorProject";
import {
  embedStoredAssets,
  stashEmbeddedAssets,
  type AssetBlobStore,
} from "../domain/livingRoom/storedAssets";
import { indexedDbAssetBlobStore } from "./assetBlobStore";

/** Project files must be portable, so imported model bytes are embedded rather than left as `idb:` refs. */
export async function serializeProjectFileWithAssets(
  document: InteriorProject,
  store: AssetBlobStore = indexedDbAssetBlobStore,
): Promise<string> {
  const { value } = await embedStoredAssets(document, store);
  return serializeInteriorProjectFile(value);
}

/** Parse a project file and move embedded model bytes into the blob store, keeping the in-memory project small. */
export async function parseProjectFileText(
  raw: string,
  store: AssetBlobStore = indexedDbAssetBlobStore,
): Promise<unknown> {
  return stashEmbeddedAssets(JSON.parse(raw) as unknown, store);
}
