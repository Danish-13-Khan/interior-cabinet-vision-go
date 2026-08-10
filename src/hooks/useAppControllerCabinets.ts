import type { MutableRefObject } from "react";
import {
  type CabinetGroup,
  type CabinetInstance,
  type CabinetLayer,
  type CabinetProject,
} from "../domain/cabinetDimensions";
import type { CabinetTemplate } from "../domain/cabinetTemplates";
import type { ProjectStandards } from "../domain/projectStandards";
import type { CabinetFamilyLibraryEntry } from "../domain/workshopLibrary";
import type { RoomConfig } from "../domain/roomModel";
import type { CommitProjectChange, CommitSnapshot } from "./projectCommit";
import type { PanelName } from "../domain/cabinetGeometry";
import { useCabinetTransforms } from "./useCabinetTransforms";
import { useCabinetEditing } from "./useCabinetEditing";
import { useCabinetLibraryOps } from "./useCabinetLibraryOps";
import { useElevationOpeningEdit } from "./useElevationOpeningEdit";
import { useCabinetRunOps } from "./useCabinetRunOps";

type RoomBounds = {
  widthMm: number;
  depthMm: number;
  heightMm: number;
};

type UseAppControllerCabinetsArgs = {
  project: CabinetProject;
  room: RoomConfig;
  roomBounds: RoomBounds;
  activeCabinetId: string | null;
  activeOpeningId: string | null;
  selectedCabinet: CabinetInstance | null;
  selectedCabinets: CabinetInstance[];
  selectedCabinetIds: string[];
  layers: CabinetLayer[];
  groups: CabinetGroup[];
  projectPreferences: NonNullable<CabinetProject["preferences"]>;
  projectStandards: ProjectStandards;
  workshopCabinetPresets: CabinetFamilyLibraryEntry[];
  userTemplates: CabinetTemplate[];
  clipboardRef: MutableRefObject<CabinetInstance[]>;
  commitProjectChange: CommitProjectChange;
  commitSnapshot: CommitSnapshot;
  replaceSelection: (
    ids: string[],
    nextActiveId?: string | null,
    nextPanelName?: PanelName | null,
  ) => void;
  setActiveOpeningId: (openingId: string | null, cabinetId?: string | null) => void;
  isCabinetLocked: (cabinet: CabinetInstance) => boolean;
  setProjectFilePath: (path: string | null) => void;
  saveTemplate: (template: CabinetTemplate) => void;
  deleteTemplate: (templateId: string) => void;
  onStatus: (status: string) => void;
};

export function useAppControllerCabinets({
  project,
  room,
  roomBounds,
  activeCabinetId,
  activeOpeningId,
  selectedCabinet,
  selectedCabinets,
  selectedCabinetIds,
  layers,
  groups,
  projectPreferences,
  projectStandards,
  workshopCabinetPresets,
  userTemplates,
  clipboardRef,
  commitProjectChange,
  commitSnapshot,
  replaceSelection,
  setActiveOpeningId,
  isCabinetLocked,
  setProjectFilePath,
  saveTemplate,
  deleteTemplate,
  onStatus,
}: UseAppControllerCabinetsArgs) {
  const transforms = useCabinetTransforms({
    project,
    room,
    roomBounds,
    activeCabinetId,
    selectedCabinet,
    commitProjectChange,
    isCabinetLocked,
    onStatus,
  });

  const elevationOpenings = useElevationOpeningEdit({
    project,
    updateCabinet: transforms.updateCabinet,
    replaceSelection,
    activeCabinetId,
    activeOpeningId,
    setActiveOpeningId,
    isCabinetLocked,
    onStatus,
  });

  const editing = useCabinetEditing({
    project,
    room,
    roomBounds,
    selectedCabinets,
    selectedCabinetIds,
    layers,
    groups,
    projectPreferences,
    clipboardRef,
    commitProjectChange,
    commitSnapshot,
    replaceSelection,
    isCabinetLocked,
    clampPlacementInRoom: transforms.clampPlacementInRoom,
    updateCabinet: transforms.updateCabinet,
    setProjectFilePath,
    onStatus,
  });

  const library = useCabinetLibraryOps({
    project,
    room,
    roomBounds,
    selectedCabinet,
    layers,
    projectPreferences,
    projectStandards,
    workshopCabinetPresets,
    userTemplates,
    commitProjectChange,
    commitSnapshot,
    saveTemplate,
    deleteTemplate,
    setProjectFilePath,
    onStatus,
  });

  const runAuthoring = useCabinetRunOps({
    project,
    roomBounds,
    selectedCabinet,
    projectStandards,
    commitProjectChange,
    isCabinetLocked,
    onStatus,
  });

  return {
    ...transforms,
    ...elevationOpenings,
    ...editing,
    ...library,
    ...runAuthoring,
  };
}
