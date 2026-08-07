import { useEffect, useRef } from "react";
import {
  persistSessionState,
  readSessionState,
  type DesktopLayoutPrefs,
  type DesktopSessionState,
  type WorkspaceTabId,
} from "../domain/desktopUx";

type UseSessionPersistArgs = {
  projectFilePath: string | null;
  workspaceTab: WorkspaceTabId;
  draftingTool: "select" | "note" | "leader";
  selectedCabinetIds: string[];
  activeCabinetId: string | null;
  layout: DesktopLayoutPrefs;
  enabled?: boolean;
};

export function useSessionPersist({
  projectFilePath,
  workspaceTab,
  draftingTool,
  selectedCabinetIds,
  activeCabinetId,
  layout,
  enabled = true,
}: UseSessionPersistArgs) {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      const state: DesktopSessionState = {
        projectFilePath,
        workspaceTab,
        draftingTool,
        selectedCabinetIds,
        activeCabinetId,
        restoreLastFile: true,
        layout,
        updatedAt: new Date().toISOString(),
      };
      persistSessionState(state);
    }, 400);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [
    activeCabinetId,
    draftingTool,
    enabled,
    layout,
    projectFilePath,
    selectedCabinetIds,
    workspaceTab,
  ]);
}

export function loadInitialSessionState() {
  return readSessionState();
}
