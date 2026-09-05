import {
  clampCabinetProject,
  type CabinetProject,
} from "../domain/cabinetDimensions";
import {
  addEmptyProjectRoom,
  addRoomFromTemplate,
  duplicateProjectRoom,
  getActiveProjectRoom,
  getRoomTemplate,
  listProjectRooms,
  normalizeMultiRoomProject,
  removeProjectRoom,
  renameProjectRoom,
  switchProjectRoom,
  type RoomTemplateId,
} from "../domain/projectRooms";
import {
  createRoomPresetProject,
  roomPresets,
  type RoomPresetId,
} from "../domain/roomPresets";
import type { RoomConfig } from "../domain/roomModel";
import type { CommitProjectChange, CommitSnapshot } from "./projectCommit";

type UseRoomProjectOpsArgs = {
  project: CabinetProject;
  room: RoomConfig;
  commitProjectChange: CommitProjectChange;
  commitSnapshot: CommitSnapshot;
  onStatus: (status: string) => void;
};

export function useRoomProjectOps({
  project,
  room,
  commitProjectChange,
  commitSnapshot,
  onStatus,
}: UseRoomProjectOpsArgs) {
  function commitRoomProject(nextProject: CabinetProject, status: string) {
    const safeProject = normalizeMultiRoomProject(
      clampCabinetProject(nextProject),
      room,
    );
    const activeRoom = getActiveProjectRoom(safeProject);
    commitSnapshot(
      {
        project: safeProject,
        room: activeRoom.config,
        selectedCabinetIds: safeProject.cabinets[0]?.id
          ? [safeProject.cabinets[0].id]
          : [],
        activeCabinetId: safeProject.cabinets[0]?.id ?? null,
        selectedPanelName: null,
      },
      status,
    );
  }

  function handleRoomConfigChange(nextRoom: RoomConfig) {
    commitProjectChange(
      (currentProject) => ({
        project: currentProject,
        room: nextRoom,
      }),
      "Updated room configuration.",
    );
  }

  function handleSelectProjectRoom(roomId: string) {
    if (roomId === project.activeRoomId) return;
    commitRoomProject(
      switchProjectRoom(project, roomId, project.cabinets, room),
      "Switched active room.",
    );
  }

  /** Switch room (if needed) and apply an explicit cabinet selection. */
  function handleSelectCabinetsInRoom(
    roomId: string,
    cabinetIds: string[],
    activeId: string | null = cabinetIds[0] ?? null,
  ) {
    if (roomId === project.activeRoomId) {
      return false;
    }

    const switched = switchProjectRoom(project, roomId, project.cabinets, room);
    const safeProject = normalizeMultiRoomProject(
      clampCabinetProject(switched),
      room,
    );
    const activeRoom = getActiveProjectRoom(safeProject);
    const validIds = cabinetIds.filter((id) =>
      safeProject.cabinets.some((cabinet) => cabinet.id === id),
    );
    commitSnapshot(
      {
        project: safeProject,
        room: activeRoom.config,
        selectedCabinetIds: validIds,
        activeCabinetId:
          (activeId && validIds.includes(activeId) ? activeId : validIds[0]) ??
          null,
        selectedPanelName: null,
      },
      "Switched room from cabinet tree.",
    );
    return true;
  }

  function handleRenameProjectRoomTo(roomId: string, name: string) {
    const nextName = name.trim();
    if (!nextName) return;
    commitRoomProject(
      renameProjectRoom(project, roomId, nextName, project.cabinets, room),
      `Renamed room to “${nextName}”.`,
    );
  }

  function handleAddProjectRoom() {
    commitRoomProject(
      addEmptyProjectRoom(project, project.cabinets, room),
      "Added a new room.",
    );
  }

  function handleDuplicateProjectRoom(roomId: string) {
    commitRoomProject(
      duplicateProjectRoom(project, roomId, project.cabinets, room),
      "Duplicated room.",
    );
  }

  function handleRenameProjectRoom(roomId: string) {
    const current = listProjectRooms(project).find((entry) => entry.id === roomId);
    const name = window.prompt("Room name", current?.name ?? "Room");
    if (!name?.trim()) return;
    commitRoomProject(
      renameProjectRoom(project, roomId, name.trim(), project.cabinets, room),
      `Renamed room to “${name.trim()}”.`,
    );
  }

  function handleRemoveProjectRoom(roomId: string) {
    if (listProjectRooms(project).length <= 1) {
      onStatus("Keep at least one room in the project.");
      return;
    }
    commitRoomProject(
      removeProjectRoom(project, roomId, project.cabinets, room),
      "Removed room.",
    );
  }

  function handleAddRoomFromTemplate(templateId: RoomTemplateId) {
    const template = getRoomTemplate(templateId);
    if (!template) return;
    commitRoomProject(
      addRoomFromTemplate(project, project.cabinets, room, template.build()),
      `Added room from “${template.label}” template.`,
    );
  }

  function handleLoadRoomPreset(presetId: RoomPresetId) {
    const preset = roomPresets.find((p) => p.id === presetId);
    if (!preset) return;

    const presetProject = createRoomPresetProject(preset);
    commitProjectChange(
      (currentProject) => ({
        project: {
          ...currentProject,
          cabinets: presetProject.cabinets,
        },
        room: preset.roomConfig,
        selectedCabinetIds: presetProject.cabinets[0]?.id
          ? [presetProject.cabinets[0].id]
          : [],
        activeCabinetId: presetProject.cabinets[0]?.id ?? null,
        selectedPanelName: null,
      }),
      `Loaded ${preset.label} into the active room.`,
    );
  }

  return {
    commitRoomProject,
    handleRoomConfigChange,
    handleSelectProjectRoom,
    handleSelectCabinetsInRoom,
    handleAddProjectRoom,
    handleDuplicateProjectRoom,
    handleRenameProjectRoom,
    handleRenameProjectRoomTo,
    handleRemoveProjectRoom,
    handleAddRoomFromTemplate,
    handleLoadRoomPreset,
  };
}
