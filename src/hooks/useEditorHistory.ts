import { useCallback, useRef, useState } from "react";
import {
  createEditorSnapshot,
  HISTORY_LIMIT,
  type EditorSnapshot,
} from "../domain/editorSnapshot";

type UseEditorHistoryArgs = {
  captureCurrent: () => EditorSnapshot;
  applySnapshot: (snapshot: EditorSnapshot) => void;
  onStatus?: (status: string) => void;
};

export function useEditorHistory({
  captureCurrent,
  applySnapshot,
  onStatus,
}: UseEditorHistoryArgs) {
  const historyPastRef = useRef<EditorSnapshot[]>([]);
  const historyFutureRef = useRef<EditorSnapshot[]>([]);
  const captureRef = useRef(captureCurrent);
  const applyRef = useRef(applySnapshot);
  const statusRef = useRef(onStatus);
  captureRef.current = captureCurrent;
  applyRef.current = applySnapshot;
  statusRef.current = onStatus;

  const [historyTick, setHistoryTick] = useState(0);

  const refreshHistoryState = useCallback(() => {
    setHistoryTick((value) => value + 1);
  }, []);

  const canUndo = historyPastRef.current.length > 0;
  const canRedo = historyFutureRef.current.length > 0;
  void historyTick;

  const commitSnapshot = useCallback(
    (snapshot: EditorSnapshot, status?: string) => {
      historyPastRef.current = [
        ...historyPastRef.current,
        captureRef.current(),
      ].slice(-HISTORY_LIMIT);
      historyFutureRef.current = [];
      applyRef.current(snapshot);
      if (status) statusRef.current?.(status);
      refreshHistoryState();
    },
    [refreshHistoryState],
  );

  const handleUndo = useCallback(() => {
    const past = historyPastRef.current;
    const previous = past[past.length - 1];
    if (!previous) return;

    historyPastRef.current = past.slice(0, -1);
    historyFutureRef.current = [
      captureRef.current(),
      ...historyFutureRef.current,
    ].slice(0, HISTORY_LIMIT);
    applyRef.current(previous);
    statusRef.current?.("Undid the last change.");
    refreshHistoryState();
  }, [refreshHistoryState]);

  const handleRedo = useCallback(() => {
    const next = historyFutureRef.current[0];
    if (!next) return;

    historyFutureRef.current = historyFutureRef.current.slice(1);
    historyPastRef.current = [
      ...historyPastRef.current,
      captureRef.current(),
    ].slice(-HISTORY_LIMIT);
    applyRef.current(next);
    statusRef.current?.("Redid the last change.");
    refreshHistoryState();
  }, [refreshHistoryState]);

  return {
    canUndo,
    canRedo,
    commitSnapshot,
    handleUndo,
    handleRedo,
    refreshHistoryState,
  };
}

export function captureEditorSnapshot(
  project: EditorSnapshot["project"],
  room: EditorSnapshot["room"],
  selectedCabinetIds: string[],
  activeCabinetId: string | null,
  selectedPanelName: EditorSnapshot["selectedPanelName"],
): EditorSnapshot {
  return createEditorSnapshot(
    project,
    room,
    selectedCabinetIds,
    activeCabinetId,
    selectedPanelName,
  );
}
