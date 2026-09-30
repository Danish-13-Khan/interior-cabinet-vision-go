import { useCallback, useEffect, useRef, useState } from "react";
import type { InteriorProject } from "../domain/interiorProject";
import { clearLivingRoomRecovery, type LivingRoomRecoverySnapshot } from "../domain/livingRoom";
import { createLivingRoomRecoverySnapshot } from "../domain/livingRoom";
import { autosaveStatus, projectFileAdoption, recoveryOffer, webDraftRestore } from "../domain/projectDrafts/browserSignals";
import { acceptOpenedFileAsDraft } from "../domain/projectDrafts/openedFileRecovery";
import { indexedDbDraftStore } from "../platform/indexedDbDraftStore";

type AutosaveState = "idle" | "saving" | "saved" | "error";

type Args = {
  project: InteriorProject | null;
  isDirty: boolean;
  onRestore: (project: InteriorProject) => void;
  onStatus: (message: string) => void;
};

/** Reads the shared draft offer. It does not write a second autosave. */
export function useLivingRoomRecovery({ onRestore, onStatus }: Args) {
  const [recovery, setRecovery] = useState<LivingRoomRecoverySnapshot | null>(null);
  const [autosaveState, setAutosaveState] = useState<AutosaveState>("idle");
  const [lastAutosavedAt, setLastAutosavedAt] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string | null>(null);
  const restored = useRef(false);

  useEffect(() => webDraftRestore.subscribe((request) => {
    const interior = request?.entry.project.interiorDocument;
    if (!request || !interior || restored.current) return;
    restored.current = true;
    projectFileAdoption.set(request.filePath);
    onRestore(interior);
    if (request.notice) onStatus(request.notice);
  }), [onRestore, onStatus]);

  useEffect(() => recoveryOffer.subscribe((offer) => {
    if (!offer?.entry.project.interiorDocument) {
      setRecovery(null);
      setPrompt(null);
      return;
    }
    setPrompt(offer.prompt);
    setRecovery(createLivingRoomRecoverySnapshot(offer.entry.project.interiorDocument, offer.entry.updatedAt));
  }), []);

  useEffect(() => autosaveStatus.subscribe((status) => {
    setAutosaveState(status.state);
    if (status.at) setLastAutosavedAt(status.at);
  }), []);

  const discardRecovery = useCallback(() => {
    const offer = recoveryOffer.get();
    clearLivingRoomRecovery();
    recoveryOffer.set(null);
    // Discard keeps what is on screen (the opened file), so that becomes the draft.
    if (offer) void acceptOpenedFileAsDraft(offer.entry.id, { drafts: indexedDbDraftStore, storage: localStorage });
    setRecovery(null);
    setPrompt(null);
  }, []);

  const restoreRecovery = useCallback(() => {
    if (!recovery) return;
    const filePath = recoveryOffer.get()?.filePath ?? null;
    clearLivingRoomRecovery();
    recoveryOffer.set(null);
    projectFileAdoption.set(filePath);
    setRecovery(null);
    setPrompt(null);
    setAutosaveState("saved");
    setLastAutosavedAt(recovery.savedAt);
    onRestore(recovery.project);
    onStatus(`Recovered autosave from ${new Date(recovery.savedAt).toLocaleString()}.`);
  }, [onRestore, onStatus, recovery]);

  return { recovery, recoveryPrompt: prompt, autosaveState, lastAutosavedAt, restoreRecovery, discardRecovery };
}
