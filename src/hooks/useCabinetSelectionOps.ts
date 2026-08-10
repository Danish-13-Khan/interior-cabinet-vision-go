import type { MutableRefObject } from "react";
import {
  clampCabinetConfig,
  defaultCabinetProject,
  type CabinetInstance,
  type CabinetProject,
} from "../domain/cabinetDimensions";
import {
  createCabinetPlanningWorkflow,
  createAllRunAlignedPlacements,
} from "../domain/cabinetLibrary";
import { orderedRunCabinets } from "../domain/cabinetRuns";
import { createOffsetDuplicate } from "../domain/cabinetDuplication";
import { DEFAULT_ROOM, type RoomConfig } from "../domain/roomModel";
import { deepClone } from "../utils/clone";
import type { CommitProjectChange, CommitSnapshot } from "./projectCommit";
import type { PanelName } from "../domain/cabinetGeometry";
import type { WallLayoutSide } from "../domain/wallLayout";

type RoomBounds = {
  widthMm: number;
  depthMm: number;
  heightMm: number;
};

export type UseCabinetSelectionOpsArgs = {
  project: CabinetProject;
  room: RoomConfig;
  roomBounds: RoomBounds;
  selectedCabinets: CabinetInstance[];
  selectedCabinetIds: string[];
  clipboardRef: MutableRefObject<CabinetInstance[]>;
  commitProjectChange: CommitProjectChange;
  commitSnapshot: CommitSnapshot;
  replaceSelection: (
    ids: string[],
    nextActiveId?: string | null,
    nextPanelName?: PanelName | null,
  ) => void;
  isCabinetLocked: (cabinet: CabinetInstance) => boolean;
  updateCabinet: (
    cabinetId: string,
    updater: (cabinet: CabinetInstance) => CabinetInstance,
    status?: string,
  ) => void;
  setProjectFilePath: (path: string | null) => void;
  onStatus: (status: string) => void;
};

export function useCabinetSelectionOps({
  project,
  room,
  roomBounds,
  selectedCabinets,
  selectedCabinetIds,
  clipboardRef,
  commitProjectChange,
  commitSnapshot,
  replaceSelection,
  isCabinetLocked,
  updateCabinet,
  setProjectFilePath,
  onStatus,
}: UseCabinetSelectionOpsArgs) {
  function getSelectedEditableCabinets() {
    return selectedCabinets.filter((cabinet) => !isCabinetLocked(cabinet));
  }

  function selectionContainsLockedCabinet() {
    return selectedCabinets.some((cabinet) => isCabinetLocked(cabinet));
  }

  function handleCopySelection() {
    if (selectedCabinets.length === 0) return;
    clipboardRef.current = deepClone(selectedCabinets);
    onStatus(
      `Copied ${selectedCabinets.length} item${selectedCabinets.length === 1 ? "" : "s"}.`,
    );
  }

  function handlePasteSelection() {
    if (clipboardRef.current.length === 0) return;

    commitProjectChange(
      (currentProject) => {
        const duplicates = clipboardRef.current.map((cabinet, index) =>
          createOffsetDuplicate(cabinet, index, currentProject, room, roomBounds),
        );

        return {
          project: {
            ...currentProject,
            cabinets: [...currentProject.cabinets, ...duplicates],
          },
          selectedCabinetIds: duplicates.map((cabinet) => cabinet.id),
          activeCabinetId: duplicates[0]?.id ?? null,
          selectedPanelName: null,
        };
      },
      `Pasted ${clipboardRef.current.length} item${clipboardRef.current.length === 1 ? "" : "s"}.`,
    );
  }

  function handleSelectAll() {
    replaceSelection(
      project.cabinets.map((cabinet) => cabinet.id),
      project.cabinets[0]?.id ?? null,
      null,
    );
    onStatus("Selected all scene items.");
  }

  function handleAutoAlignRuns() {
    commitProjectChange(
      (currentProject) => {
        const workflow = createCabinetPlanningWorkflow(currentProject, roomBounds);
        const alignedPlacements = createAllRunAlignedPlacements(
          workflow.runs,
          currentProject,
          roomBounds,
        );

        if (Object.keys(alignedPlacements).length === 0) return null;

        return {
          project: {
            ...currentProject,
            cabinets: currentProject.cabinets.map((cabinet) => ({
              ...cabinet,
              placement: alignedPlacements[cabinet.id] ?? cabinet.placement,
            })),
          },
        };
      },
      "Aligned cabinets into wall runs.",
    );
  }

  function handleAutoAlignWallRuns(side: WallLayoutSide) {
    commitProjectChange(
      (currentProject) => {
        const workflow = createCabinetPlanningWorkflow(currentProject, roomBounds);
        const wallRuns = workflow.runs.filter((run) => run.side === side);
        const alignedPlacements = createAllRunAlignedPlacements(
          wallRuns,
          currentProject,
          roomBounds,
        );
        if (Object.keys(alignedPlacements).length === 0) return null;
        return {
          project: {
            ...currentProject,
            cabinets: currentProject.cabinets.map((cabinet) => ({
              ...cabinet,
              placement: alignedPlacements[cabinet.id] ?? cabinet.placement,
            })),
          },
        };
      },
      "Packed the selected wall runs.",
    );
  }

  function handleFinishWallRunEnds(side: WallLayoutSide) {
    commitProjectChange(
      (currentProject) => {
        const workflow = createCabinetPlanningWorkflow(currentProject, roomBounds);
        const endFlags = new Map<string, { left: boolean; right: boolean }>();
        for (const run of workflow.runs.filter(
          (item) => item.side === side && item.band !== "wall",
        )) {
          const members = orderedRunCabinets(run.cabinetIds, currentProject.cabinets, run.axis);
          const first = members[0];
          const last = members[members.length - 1];
          if (first) endFlags.set(first.id, { ...(endFlags.get(first.id) ?? { left: false, right: false }), left: true });
          if (last) endFlags.set(last.id, { ...(endFlags.get(last.id) ?? { left: false, right: false }), right: true });
        }
        if (endFlags.size === 0) return null;
        return {
          project: {
            ...currentProject,
            cabinets: currentProject.cabinets.map((cabinet) => {
              const flags = endFlags.get(cabinet.id);
              if (!flags) return cabinet;
              return {
                ...cabinet,
                config: clampCabinetConfig({
                  ...cabinet.config,
                  leftEndPanel: flags.left || cabinet.config.leftEndPanel,
                  rightEndPanel: flags.right || cabinet.config.rightEndPanel,
                }),
              };
            }),
          },
        };
      },
      "Added finished end panels to the selected wall runs.",
    );
  }

  function handleDuplicateCabinet() {
    if (selectedCabinets.length === 0) return;
    const editable = getSelectedEditableCabinets();
    if (editable.length === 0) {
      onStatus("Selected items are on locked layers.");
      return;
    }

    commitProjectChange(
      (currentProject) => {
        const duplicates = editable.map((cabinet, index) =>
          createOffsetDuplicate(cabinet, index, currentProject, room, roomBounds),
        );

        return {
          project: {
            ...currentProject,
            cabinets: [...currentProject.cabinets, ...duplicates],
          },
          selectedCabinetIds: duplicates.map((cabinet) => cabinet.id),
          activeCabinetId: duplicates[0]?.id ?? null,
          selectedPanelName: null,
        };
      },
      `Duplicated ${editable.length} item${editable.length === 1 ? "" : "s"}.`,
    );
  }

  function handleRemoveCabinet() {
    if (
      selectedCabinetIds.length === 0 ||
      project.cabinets.length <= selectedCabinetIds.length
    ) {
      return;
    }
    if (selectionContainsLockedCabinet()) {
      onStatus("Locked-layer items cannot be removed.");
      return;
    }

    const nextCabinets = project.cabinets.filter(
      (cabinet) => !selectedCabinetIds.includes(cabinet.id),
    );

    commitProjectChange(
      () => ({
        project: { ...project, cabinets: nextCabinets },
        selectedCabinetIds: nextCabinets[0]?.id ? [nextCabinets[0].id] : [],
        activeCabinetId: nextCabinets[0]?.id ?? null,
        selectedPanelName: null,
      }),
      `Removed ${selectedCabinetIds.length} item${selectedCabinetIds.length === 1 ? "" : "s"}.`,
    );
  }

  function handleReset() {
    commitSnapshot(
      {
        project: defaultCabinetProject,
        room: DEFAULT_ROOM,
        selectedCabinetIds: defaultCabinetProject.cabinets[0]?.id
          ? [defaultCabinetProject.cabinets[0].id]
          : [],
        activeCabinetId: defaultCabinetProject.cabinets[0]?.id ?? null,
        selectedPanelName: null,
      },
      "Reset the whole project.",
    );
    setProjectFilePath(null);
  }

  function handleRenameCabinet(cabinetId: string, newName: string) {
    updateCabinet(
      cabinetId,
      (cabinet) => ({
        ...cabinet,
        name: newName.trim() || cabinet.name,
      }),
      "Renamed the selected item.",
    );
  }

  return {
    handleCopySelection,
    handlePasteSelection,
    handleSelectAll,
    handleAutoAlignRuns,
    handleAutoAlignWallRuns,
    handleFinishWallRunEnds,
    handleDuplicateCabinet,
    handleRemoveCabinet,
    handleReset,
    handleRenameCabinet,
  };
}
