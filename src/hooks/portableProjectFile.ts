import type { InteriorProject } from "../domain/interiorProject";
import { embedStoredAssets, missingStoredAssetsMessage } from "../domain/livingRoom/storedAssets";
import { indexedDbAssetBlobStore } from "../platform/assetBlobStore";
import { parseProjectFileText, serializeProjectFileWithAssets } from "../platform/projectFileAssets";
import { setStorageWarning } from "./useStorageWarnings";

function reportMissing(missing: readonly string[]) {
  setStorageWarning("missing-model-files", missingStoredAssetsMessage(missing));
}

/** Project file text with model bytes embedded; flags models whose bytes are gone from browser storage. */
export async function portableProjectText(document: InteriorProject): Promise<string> {
  const { text, missing } = await serializeProjectFileWithAssets(document);
  reportMissing(missing);
  return text;
}

/** Parse an opened project file; a previous file's missing-model warning no longer applies. */
export async function openedProjectFile(raw: string): Promise<unknown> {
  const parsed = await parseProjectFileText(raw);
  reportMissing([]);
  return parsed;
}

/** Project with model bytes embedded, for exports that serialize the document themselves. */
export async function portableProject(document: InteriorProject): Promise<InteriorProject> {
  const { value, missing } = await embedStoredAssets(document, indexedDbAssetBlobStore);
  reportMissing(missing);
  return value;
}
