import { useCallback, useRef, useState } from "react";
import {
  createEditorSnapshot,
  type EditorSnapshot,
} from "../domain/editorSnapshot";
import {
  commitEditorHistoryStacks,
  redoEditorHistoryStacks,
  undoEditorHistoryStacks,
  type EditorHistoryStacks,
} from "./editorHistoryCore";

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
  const historyStacksRef = useRef<EditorHistoryStacks>({ past: [], future: [] });
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

  const canUndo = historyStacksRef.current.past.length > 0;
  const canRedo = historyStacksRef.current.future.length > 0;
  void historyTick;

  const commitSnapshot = useCallback(
    (snapshot: EditorSnapshot, status?: string) => {
      historyStacksRef.current = commitEditorHistoryStacks(
        historyStacksRef.current,
        captureRef.current(),
      );
      applyRef.current(snapshot);
      if (status) statusRef.current?.(status);
      refreshHistoryState();
    },
    [refreshHistoryState],
  );

  const handleUndo = useCallback(() => {
    const result = undoEditorHistoryStacks(
      historyStacksRef.current,
      captureRef.current(),
    );
    if (!result.restore) return;
    historyStacksRef.current = result.stacks;
    applyRef.current(result.restore);
    statusRef.current?.("Undid the last change.");
    refreshHistoryState();
  }, [refreshHistoryState]);

  const handleRedo = useCallback(() => {
    const result = redoEditorHistoryStacks(
      historyStacksRef.current,
      captureRef.current(),
    );
    if (!result.restore) return;
    historyStacksRef.current = result.stacks;
    applyRef.current(result.restore);
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

export {
  commitEditorHistoryStacks,
  redoEditorHistoryStacks,
  undoEditorHistoryStacks,
} from "./editorHistoryCore";
