import type { MutableRefObject } from "react";
import {
  type CabinetGroup,
  type CabinetInstance,
  type CabinetLayer,
  type CabinetPlacement,
  type CabinetProject,
} from "../domain/cabinetDimensions";
import type { RoomConfig } from "../domain/roomModel";
import type { CommitProjectChange, CommitSnapshot } from "./projectCommit";
import type { PanelName } from "../domain/cabinetGeometry";
import { useCabinetOrganizeOps } from "./useCabinetOrganizeOps";
import { useCabinetSelectionOps } from "./useCabinetSelectionOps";

type RoomBounds = {
  widthMm: number;
  depthMm: number;
  heightMm: number;
};

type UseCabinetEditingArgs = {
  project: CabinetProject;
  room: RoomConfig;
  roomBounds: RoomBounds;
  selectedCabinets: CabinetInstance[];
  selectedCabinetIds: string[];
  layers: CabinetLayer[];
  groups: CabinetGroup[];
  projectPreferences: NonNullable<CabinetProject["preferences"]>;
  clipboardRef: MutableRefObject<CabinetInstance[]>;
  commitProjectChange: CommitProjectChange;
  commitSnapshot: CommitSnapshot;
  replaceSelection: (
    ids: string[],
    nextActiveId?: string | null,
    nextPanelName?: PanelName | null,
  ) => void;
  isCabinetLocked: (cabinet: CabinetInstance) => boolean;
  clampPlacementInRoom: (
    placement: CabinetPlacement,
    dimensions: CabinetInstance["config"]["dimensions"],
  ) => CabinetPlacement;
  updateCabinet: (
    cabinetId: string,
    updater: (cabinet: CabinetInstance) => CabinetInstance,
    status?: string,
  ) => void;
  setProjectFilePath: (path: string | null) => void;
  onStatus: (status: string) => void;
};

export function useCabinetEditing(args: UseCabinetEditingArgs) {
  const selectionOps = useCabinetSelectionOps({
    project: args.project,
    room: args.room,
    roomBounds: args.roomBounds,
    selectedCabinets: args.selectedCabinets,
    selectedCabinetIds: args.selectedCabinetIds,
    clipboardRef: args.clipboardRef,
    commitProjectChange: args.commitProjectChange,
    commitSnapshot: args.commitSnapshot,
    replaceSelection: args.replaceSelection,
    isCabinetLocked: args.isCabinetLocked,
    updateCabinet: args.updateCabinet,
    setProjectFilePath: args.setProjectFilePath,
    onStatus: args.onStatus,
  });

  const organizeOps = useCabinetOrganizeOps({
    selectedCabinets: args.selectedCabinets,
    selectedCabinetIds: args.selectedCabinetIds,
    layers: args.layers,
    groups: args.groups,
    projectPreferences: args.projectPreferences,
    commitProjectChange: args.commitProjectChange,
    isCabinetLocked: args.isCabinetLocked,
    clampPlacementInRoom: args.clampPlacementInRoom,
  });

  return {
    ...selectionOps,
    ...organizeOps,
  };
}
