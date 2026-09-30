import { useCallback } from "react";
import type { CabinetProject } from "../domain/cabinetDimensions";
import { interiorProjectFileName } from "../domain/interiorProject";
import { readProposalCommercial } from "../domain/livingRoom/proposal/commercialState";
import { pendingEpochNow } from "../domain/projectDrafts/browserSignals";
import { noteDraftFileSaved } from "../domain/projectDrafts/commitDraft";
import { rememberProjectFileBinding } from "../domain/projectDrafts/projectFileBinding";
import type { RoomConfig } from "../domain/roomModel";
import { getErrorMessage } from "../utils/errors";
import { isTauriRuntime, promptSavePath } from "../platform/desktopFiles";
import { writeSavedProject } from "../platform/savedProjectFile";
import { indexedDbDraftStore } from "../platform/indexedDbDraftStore";
import { currentInteriorDocument, persistenceFingerprint } from "./projectFileDocument";

type Args = {
  project: CabinetProject;
  room: RoomConfig;
  projectFilePath: string | null;
  setProjectFilePath: (path: string | null) => void;
  setSavedFingerprint: (fingerprint: string) => void;
  onStatus: (status: string) => void;
  rememberFile: (path: string) => void;
  saveCurrentProjectToBrowser: (nameOverride?: string) => void;
  captureThumbnail: () => string;
};

export function useProjectFileSave(args: Args) {
  const saveProject = useCallback(async (saveAs: boolean) => {
    try {
      const document = currentInteriorDocument(args.project, args.room);
      const epoch = pendingEpochNow();
      const targetPath = !saveAs && args.projectFilePath
        ? args.projectFilePath
        : await promptSavePath({
          title: "Save Interior Project",
          defaultPath: interiorProjectFileName(document.name, readProposalCommercial(document).job).replace(/\.json$/i, ".cabinet"),
          extensions: ["cabinet", "json"],
        });
      if (!targetPath) {
        args.onStatus("Save cancelled.");
        return;
      }
      const written = await writeSavedProject(targetPath, document, args.captureThumbnail());
      args.setProjectFilePath(written);
      args.setSavedFingerprint(persistenceFingerprint(document));
      await noteDraftFileSaved(document.id, indexedDbDraftStore, localStorage, new Date().toISOString(), epoch).catch(() => undefined);
      args.rememberFile(written);
      rememberProjectFileBinding(localStorage, document.id, written);
      args.saveCurrentProjectToBrowser(document.name);
      const json = written.toLowerCase().endsWith(".json");
      args.onStatus(json
        ? (isTauriRuntime() ? "Project saved to JSON file." : "Project downloaded as JSON.")
        : (isTauriRuntime() ? "Project saved as a Cabinet file." : "Project downloaded as a Cabinet file."));
    } catch (error) {
      args.onStatus(`Save failed: ${getErrorMessage(error)}`);
    }
  }, [args]);
  return {
    handleSaveProject: useCallback(() => saveProject(false), [saveProject]),
    handleSaveAsProject: useCallback(() => saveProject(true), [saveProject]),
  };
}
