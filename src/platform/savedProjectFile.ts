import type { InteriorProject } from "../domain/interiorProject";
import type { AssetBlobStore } from "../domain/livingRoom/storedAssets";
import { missingStoredAssetsMessage } from "../domain/livingRoom/storedAssets";
import type { DraftStore } from "../domain/projectDrafts/types";
import { openedProjectFile, portableProjectText } from "../hooks/portableProjectFile";
import { setStorageWarning } from "../hooks/useStorageWarnings";
import { indexedDbAssetBlobStore } from "./assetBlobStore";
import { packCabinetArchive } from "./cabinetArchive/pack";
import { seedOpenedDraft } from "./cabinetArchive/seedDraft";
import { unpackCabinetArchive } from "./cabinetArchive/unpack";
import { isCabinetPath } from "./cabinetArchive/names";
import { indexedDbDraftStore } from "./indexedDbDraftStore";
import { isTauriRuntime, pickBrowserFile, promptOpenPath, readTextFile, writeTextFile } from "./desktopFiles";
import { readProjectBytes, writeProjectBytes } from "./projectBytes";

export type OpenedProject =
  | { path: string; kind: "json"; text: string }
  | { path: string; kind: "cabinet"; bytes: ArrayBuffer };

const BROWSER_ACCEPT = ".cabinet,.json,application/vnd.cabinet-studio+zip,application/json";

/** `.cabinet` is read as bytes; older `.json` files stay text. */
export async function openProjectFile(args: { title: string }): Promise<OpenedProject | null> {
  if (!isTauriRuntime()) {
    const file = await pickBrowserFile(BROWSER_ACCEPT);
    if (!file) return null;
    if (isCabinetPath(file.name)) return { path: file.name, kind: "cabinet", bytes: await file.arrayBuffer() };
    return { path: file.name, kind: "json", text: await file.text() };
  }
  const path = await promptOpenPath({ title: args.title, extensions: ["cabinet", "json"] });
  if (!path) return null;
  if (isCabinetPath(path)) return { path, kind: "cabinet", bytes: await readProjectBytes(path) };
  return { path, kind: "json", text: await readTextFile(path) };
}

export async function writeSavedProject(path: string, document: InteriorProject, thumbnail: string): Promise<string> {
  if (path.toLowerCase().endsWith(".json")) {
    await writeTextFile(path, await portableProjectText(document));
    return path;
  }
  const target = isCabinetPath(path) ? path : `${path}.cabinet`;
  const packed = await packCabinetArchive(document, indexedDbAssetBlobStore, thumbnail);
  setStorageWarning("missing-model-files", missingStoredAssetsMessage(packed.missing));
  await writeProjectBytes(target, packed.bytes);
  return target;
}

export async function parseSavedProject(
  opened: OpenedProject,
  blobs: AssetBlobStore = indexedDbAssetBlobStore,
  drafts: DraftStore = indexedDbDraftStore,
): Promise<unknown> {
  if (opened.kind === "json") return openedProjectFile(opened.text);
  const unpacked = await unpackCabinetArchive(new Uint8Array(opened.bytes), blobs);
  setStorageWarning("missing-model-files", missingStoredAssetsMessage(unpacked.missing));
  await seedOpenedDraft(unpacked.document, drafts).catch(() => undefined);
  return unpacked.document;
}

export async function readSavedProject(path: string): Promise<unknown> {
  if (isCabinetPath(path)) {
    return parseSavedProject({ path, kind: "cabinet", bytes: await readProjectBytes(path) });
  }
  return parseSavedProject({ path, kind: "json", text: await readTextFile(path) });
}
