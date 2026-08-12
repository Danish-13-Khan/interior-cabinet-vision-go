import { useCallback, useEffect, useRef, useState } from "react";
import type { InteriorProject } from "../domain/interiorProject";
import {
  clearLivingRoomRecovery,
  createLivingRoomRecoverySnapshot,
  persistLivingRoomRecovery,
  readLivingRoomRecovery,
  type LivingRoomRecoverySnapshot,
} from "../domain/livingRoom";

type AutosaveState = "idle" | "saving" | "saved" | "error";

type UseLivingRoomRecoveryArgs = {
  project: InteriorProject | null;
  isDirty: boolean;
  onRestore: (project: InteriorProject) => void;
  onStatus: (message: string) => void;
};

export function useLivingRoomRecovery({
  project,
  isDirty,
  onRestore,
  onStatus,
}: UseLivingRoomRecoveryArgs) {
  const initial = useRef(readLivingRoomRecovery()).current;
  const [recovery, setRecovery] = useState<LivingRoomRecoverySnapshot | null>(
    initial.snapshot,
  );
  const [autosaveState, setAutosaveState] = useState<AutosaveState>(
    initial.error ? "error" : "idle",
  );
  const [lastAutosavedAt, setLastAutosavedAt] = useState<string | null>(
    initial.snapshot?.savedAt ?? null,
  );

  useEffect(() => {
    if (initial.error) onStatus(`Recovery ignored: ${initial.error}`);
  }, [initial.error, onStatus]);

  useEffect(() => {
    if (!project || !isDirty || recovery) {
      if (project && !isDirty && !recovery) {
        clearLivingRoomRecovery();
        setAutosaveState("idle");
      }
      return;
    }

    setAutosaveState("saving");
    const timer = window.setTimeout(() => {
      try {
        const snapshot = createLivingRoomRecoverySnapshot(project);
        persistLivingRoomRecovery(snapshot);
        setLastAutosavedAt(snapshot.savedAt);
        setAutosaveState("saved");
      } catch {
        setAutosaveState("error");
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, [isDirty, project, recovery]);

  const discardRecovery = useCallback(() => {
    clearLivingRoomRecovery();
    setRecovery(null);
    setAutosaveState("idle");
    setLastAutosavedAt(null);
  }, []);

  const restoreRecovery = useCallback(() => {
    if (!recovery) return;
    const recovered = recovery.project;
    clearLivingRoomRecovery();
    setRecovery(null);
    setAutosaveState("saved");
    setLastAutosavedAt(recovery.savedAt);
    onRestore(recovered);
    onStatus(`Recovered autosave from ${new Date(recovery.savedAt).toLocaleString()}.`);
  }, [onRestore, onStatus, recovery]);

  return {
    recovery,
    autosaveState,
    lastAutosavedAt,
    restoreRecovery,
    discardRecovery,
  };
}
