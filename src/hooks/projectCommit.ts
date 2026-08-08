import type { CabinetProject } from "../domain/cabinetDimensions";
import type { PanelName } from "../domain/cabinetGeometry";
import type { RoomConfig } from "../domain/roomModel";
import type { EditorSnapshot } from "../domain/editorSnapshot";

export type ProjectChangeResult = {
  project: CabinetProject;
  room?: RoomConfig;
  selectedCabinetIds?: string[];
  activeCabinetId?: string | null;
  selectedPanelName?: PanelName | null;
};

export type CommitProjectChange = (
  updater: (
    currentProject: CabinetProject,
    currentRoom: RoomConfig,
  ) => ProjectChangeResult | null,
  status?: string,
) => void;

export type CommitSnapshot = (
  snapshot: EditorSnapshot,
  status?: string,
) => void;

export type ApplySnapshot = (snapshot: EditorSnapshot) => void;
