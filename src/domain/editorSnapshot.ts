import { deepClone } from "../utils/clone";
import type { CabinetProject, CabinetLayer } from "./cabinetDimensions";
import type { PanelName } from "./cabinetGeometry";
import type { RoomConfig } from "./roomModel";

export const HISTORY_LIMIT = 80;

export type EditorSnapshot = {
  project: CabinetProject;
  room: RoomConfig;
  selectedCabinetIds: string[];
  activeCabinetId: string | null;
  selectedPanelName: PanelName | null;
};

export function createDefaultLayer(): CabinetLayer {
  return {
    id: "layer-default",
    name: "Default Layer",
    visible: true,
    locked: false,
  };
}

export function createEditorSnapshot(
  project: CabinetProject,
  room: RoomConfig,
  selectedCabinetIds: string[],
  activeCabinetId: string | null,
  selectedPanelName: PanelName | null,
): EditorSnapshot {
  return deepClone({
    project,
    room,
    selectedCabinetIds,
    activeCabinetId,
    selectedPanelName,
  });
}

export function sanitizeSelection(
  project: CabinetProject,
  selectedIds: string[],
  activeId: string | null,
) {
  const validIds = new Set(project.cabinets.map((cabinet) => cabinet.id));
  const nextSelectedIds = selectedIds.filter((id) => validIds.has(id));
  const nextActiveId =
    activeId && validIds.has(activeId)
      ? activeId
      : nextSelectedIds[0] ?? project.cabinets[0]?.id ?? null;

  return {
    selectedCabinetIds: nextActiveId
      ? Array.from(new Set([nextActiveId, ...nextSelectedIds]))
      : [],
    activeCabinetId: nextActiveId,
  };
}
