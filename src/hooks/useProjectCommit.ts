import { useEffect, type Dispatch, type SetStateAction } from "react";
import {
  clampCabinetPlacement,
  clampCabinetProject,
  type CabinetInstance,
  type CabinetProject,
} from "../domain/cabinetDimensions";
import type { PanelName } from "../domain/cabinetGeometry";
import {
  getActiveProjectRoom,
  normalizeMultiRoomProject,
  writeActiveRoomState,
} from "../domain/projectRooms";
import { type RoomConfig } from "../domain/roomModel";
import { sanitizeSelection } from "../domain/editorSnapshot";
import type { CommitProjectChange, CommitSnapshot } from "./projectCommit";

type RoomBounds = {
  widthMm: number;
  depthMm: number;
  heightMm: number;
};

type UseProjectCommitArgs = {
  project: CabinetProject;
  room: RoomConfig;
  roomBounds: RoomBounds;
  selectedCabinetIds: string[];
  activeCabinetId: string | null;
  selectedPanelName: PanelName | null;
  layers: { id: string; locked?: boolean; visible?: boolean }[];
  setProject: Dispatch<SetStateAction<CabinetProject>>;
  setSelectedCabinetIds: (ids: string[]) => void;
  setActiveCabinetId: (id: string | null) => void;
  setSelectedPanelName: (name: PanelName | null) => void;
  commitSnapshot: CommitSnapshot;
};

export function useProjectCommit({
  project,
  room,
  roomBounds,
  selectedCabinetIds,
  activeCabinetId,
  selectedPanelName,
  layers,
  setProject,
  setSelectedCabinetIds,
  setActiveCabinetId,
  setSelectedPanelName,
  commitSnapshot,
}: UseProjectCommitArgs) {
  function replaceSelection(
    ids: string[],
    nextActiveId?: string | null,
    nextPanelName: PanelName | null = null,
  ) {
    const safeSelection = sanitizeSelection(
      project,
      ids,
      nextActiveId ?? ids[0] ?? null,
    );
    setSelectedCabinetIds(safeSelection.selectedCabinetIds);
    setActiveCabinetId(safeSelection.activeCabinetId);
    setSelectedPanelName(nextPanelName);
  }

  function toggleCabinetSelection(cabinetId: string) {
    const isSelected = selectedCabinetIds.includes(cabinetId);
    if (isSelected && selectedCabinetIds.length === 1) {
      replaceSelection([cabinetId], cabinetId, null);
      return;
    }

    const nextIds = isSelected
      ? selectedCabinetIds.filter((id) => id !== cabinetId)
      : [...selectedCabinetIds, cabinetId];

    replaceSelection(nextIds, isSelected ? nextIds[0] ?? null : cabinetId, null);
  }

  function getLayerForCabinet(cabinet: CabinetInstance) {
    return layers.find((layer) => layer.id === cabinet.layerId) ?? layers[0];
  }

  function isCabinetLocked(cabinet: CabinetInstance) {
    return getLayerForCabinet(cabinet)?.locked ?? false;
  }

  function getVisibleProject(): CabinetProject {
    return {
      ...project,
      cabinets: project.cabinets.filter(
        (cabinet) => getLayerForCabinet(cabinet)?.visible !== false,
      ),
    };
  }

  function handleWorkspaceSelectCabinet(
    cabinetId: string | null,
    additive: boolean,
  ) {
    if (!cabinetId) {
      replaceSelection([], null, null);
      return;
    }

    if (additive) {
      toggleCabinetSelection(cabinetId);
      return;
    }

    replaceSelection([cabinetId], cabinetId, null);
  }

  const commitProjectChange: CommitProjectChange = (updater, status) => {
    const nextState = updater(project, room);

    if (!nextState) {
      return;
    }

    const nextRoom = nextState.room ?? room;
    const synced = writeActiveRoomState(
      nextState.project,
      nextState.project.cabinets,
      nextRoom,
    );
    const safeProject = normalizeMultiRoomProject(
      clampCabinetProject(synced),
      nextRoom,
    );
    const activeRoom = getActiveProjectRoom(safeProject);
    const safeSelection = sanitizeSelection(
      safeProject,
      nextState.selectedCabinetIds ?? selectedCabinetIds,
      nextState.activeCabinetId ?? activeCabinetId,
    );

    commitSnapshot(
      {
        project: safeProject,
        room: activeRoom.config,
        selectedCabinetIds: safeSelection.selectedCabinetIds,
        activeCabinetId: safeSelection.activeCabinetId,
        selectedPanelName:
          nextState.selectedPanelName === undefined
            ? selectedPanelName
            : nextState.selectedPanelName,
      },
      status,
    );
  };

  useEffect(() => {
    setProject((currentProject) => {
      let changed = false;

      const cabinets = currentProject.cabinets.map((cabinet) => {
        const placement = clampCabinetPlacement(
          cabinet.placement,
          cabinet.config.dimensions,
          roomBounds,
        );

        if (
          placement.x !== cabinet.placement.x ||
          placement.y !== cabinet.placement.y ||
          placement.z !== cabinet.placement.z ||
          placement.rotation !== cabinet.placement.rotation ||
          placement.attachment !== cabinet.placement.attachment
        ) {
          changed = true;
          return { ...cabinet, placement };
        }

        return cabinet;
      });

      return changed ? { ...currentProject, cabinets } : currentProject;
    });
  }, [roomBounds, setProject]);

  return {
    replaceSelection,
    toggleCabinetSelection,
    isCabinetLocked,
    getVisibleProject,
    handleWorkspaceSelectCabinet,
    commitProjectChange,
  };
}
