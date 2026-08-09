import type { CabinetProject, RoomBounds } from "../domain/cabinetDimensions";
import {
  detectCabinetRuns,
  type CabinetRun,
} from "../domain/cabinetLibrary";
import {
  reorderCabinetInRun,
  resolveIsolateSet,
} from "../domain/sceneTree";
import type { CommitProjectChange } from "./projectCommit";
import type { Dispatch, SetStateAction } from "react";

type UseSceneTreeOpsArgs = {
  project: CabinetProject;
  roomBounds: RoomBounds;
  activeRoomId: string | null;
  runs: CabinetRun[];
  selectedCabinetIds: string[];
  isolatedCabinetIds: string[] | null;
  setIsolatedCabinetIds: Dispatch<SetStateAction<string[] | null>>;
  commitProjectChange: CommitProjectChange;
  replaceSelection: (
    ids: string[],
    activeId?: string | null,
    panelName?: null,
  ) => void;
  selectCabinetsInRoom: (
    roomId: string,
    cabinetIds: string[],
    activeId?: string | null,
  ) => boolean;
  fitView: () => void;
  onStatus: (status: string) => void;
};

export function useSceneTreeOps({
  project,
  roomBounds,
  activeRoomId,
  runs,
  selectedCabinetIds,
  isolatedCabinetIds,
  setIsolatedCabinetIds,
  commitProjectChange,
  replaceSelection,
  selectCabinetsInRoom,
  fitView,
  onStatus,
}: UseSceneTreeOpsArgs) {
  function handleTreeSelectCabinets(
    roomId: string,
    cabinetIds: string[],
    activeId: string | null,
    additive: boolean,
  ) {
    if (cabinetIds.length === 0) return;

    if (roomId !== activeRoomId) {
      selectCabinetsInRoom(roomId, cabinetIds, activeId);
      return;
    }

    if (additive) {
      const merged = [...new Set([...selectedCabinetIds, ...cabinetIds])];
      replaceSelection(merged, activeId ?? merged[0] ?? null, null);
      return;
    }

    replaceSelection(cabinetIds, activeId ?? cabinetIds[0] ?? null, null);
  }

  function handleTreeIsolate(cabinetIds: string[]) {
    if (cabinetIds.length === 0) {
      setIsolatedCabinetIds(null);
      onStatus("Cleared tree isolate.");
      return;
    }
    const next = resolveIsolateSet(isolatedCabinetIds, cabinetIds);
    setIsolatedCabinetIds(next);
    onStatus(
      next
        ? `Isolated ${next.length} item${next.length === 1 ? "" : "s"}.`
        : "Cleared tree isolate.",
    );
  }

  function handleTreeFocus(cabinetIds: string[], activeId: string | null) {
    if (cabinetIds.length === 0) return;
    replaceSelection(cabinetIds, activeId ?? cabinetIds[0] ?? null, null);
    fitView();
    onStatus("Focused selection from tree.");
  }

  function handleTreeReorder(
    runId: string,
    cabinetId: string,
    direction: -1 | 1,
  ) {
    const run =
      runs.find((entry) => entry.id === runId) ??
      detectCabinetRuns(project.cabinets, roomBounds).find(
        (entry) => entry.id === runId,
      );
    if (!run) {
      onStatus("Run not found for reorder.");
      return;
    }

    commitProjectChange((currentProject) => {
      const next = reorderCabinetInRun(
        run,
        currentProject,
        roomBounds,
        cabinetId,
        direction,
      );
      if (!next) return null;
      return { project: next };
    }, "Reordered cabinet in run.");
  }

  return {
    handleTreeSelectCabinets,
    handleTreeIsolate,
    handleTreeFocus,
    handleTreeReorder,
  };
}
