import {
  snapMillimetresToGrid,
  type CabinetGroup,
  type CabinetInstance,
  type CabinetLayer,
  type CabinetPlacement,
  type CabinetProject,
} from "../domain/cabinetDimensions";
import {
  computeAlignmentTargets,
  type AlignmentMode,
} from "../domain/cabinetAlignment";
import { createDefaultLayer } from "../domain/editorSnapshot";
import type { CommitProjectChange } from "./projectCommit";

type UseCabinetOrganizeOpsArgs = {
  selectedCabinets: CabinetInstance[];
  selectedCabinetIds: string[];
  layers: CabinetLayer[];
  groups: CabinetGroup[];
  projectPreferences: NonNullable<CabinetProject["preferences"]>;
  commitProjectChange: CommitProjectChange;
  isCabinetLocked: (cabinet: CabinetInstance) => boolean;
  clampPlacementInRoom: (
    placement: CabinetPlacement,
    dimensions: CabinetInstance["config"]["dimensions"],
  ) => CabinetPlacement;
};

export function useCabinetOrganizeOps({
  selectedCabinets,
  selectedCabinetIds,
  layers,
  groups,
  projectPreferences,
  commitProjectChange,
  isCabinetLocked,
  clampPlacementInRoom,
}: UseCabinetOrganizeOpsArgs) {
  function getSelectedEditableCabinets() {
    return selectedCabinets.filter((cabinet) => !isCabinetLocked(cabinet));
  }

  function handleDuplicateLayer() {
    const nextLayer: CabinetLayer = {
      id: `layer-${Date.now()}`,
      name: `Layer ${layers.length + 1}`,
      visible: true,
      locked: false,
    };

    commitProjectChange(
      (currentProject) => ({
        project: {
          ...currentProject,
          layers: [
            ...(currentProject.layers ?? [createDefaultLayer()]),
            nextLayer,
          ],
        },
      }),
      "Added a new layer.",
    );
  }

  function handleLayerChange(layerId: string, patch: Partial<CabinetLayer>) {
    commitProjectChange(
      (currentProject) => ({
        project: {
          ...currentProject,
          layers: (currentProject.layers ?? [createDefaultLayer()]).map((layer) =>
            layer.id === layerId ? { ...layer, ...patch } : layer,
          ),
        },
      }),
      "Updated layer settings.",
    );
  }

  function handleAssignLayer(layerId: string) {
    if (selectedCabinets.length === 0) return;
    commitProjectChange(
      (currentProject) => ({
        project: {
          ...currentProject,
          cabinets: currentProject.cabinets.map((cabinet) =>
            selectedCabinetIds.includes(cabinet.id)
              ? { ...cabinet, layerId }
              : cabinet,
          ),
        },
      }),
      "Assigned the selection to a layer.",
    );
  }

  function handleCreateGroup() {
    if (selectedCabinetIds.length < 2) return;
    const group: CabinetGroup = {
      id: `group-${Date.now()}`,
      name: `Group ${groups.length + 1}`,
    };

    commitProjectChange(
      (currentProject) => ({
        project: {
          ...currentProject,
          groups: [...(currentProject.groups ?? []), group],
          cabinets: currentProject.cabinets.map((cabinet) =>
            selectedCabinetIds.includes(cabinet.id)
              ? { ...cabinet, groupId: group.id }
              : cabinet,
          ),
        },
      }),
      "Grouped the selected items.",
    );
  }

  function handleClearGroup() {
    if (selectedCabinetIds.length === 0) return;
    commitProjectChange(
      (currentProject) => ({
        project: {
          ...currentProject,
          cabinets: currentProject.cabinets.map((cabinet) =>
            selectedCabinetIds.includes(cabinet.id)
              ? { ...cabinet, groupId: null }
              : cabinet,
          ),
        },
      }),
      "Removed the selected items from their group.",
    );
  }

  function handleAlignSelection(mode: AlignmentMode) {
    const editable = getSelectedEditableCabinets();
    if (editable.length < 2) return;

    const targets = computeAlignmentTargets(editable, mode);
    const targetById = new Map(targets.map((item) => [item.id, item]));

    commitProjectChange(
      (currentProject) => ({
        project: {
          ...currentProject,
          cabinets: currentProject.cabinets.map((cabinet) => {
            if (
              !selectedCabinetIds.includes(cabinet.id) ||
              isCabinetLocked(cabinet)
            ) {
              return cabinet;
            }

            const target = targetById.get(cabinet.id);
            if (!target) return cabinet;

            return {
              ...cabinet,
              placement: clampPlacementInRoom(
                {
                  ...cabinet.placement,
                  x: snapMillimetresToGrid(
                    target.x,
                    projectPreferences.snapSizeMm,
                  ),
                  z: snapMillimetresToGrid(
                    target.z,
                    projectPreferences.snapSizeMm,
                  ),
                },
                cabinet.config.dimensions,
              ),
            };
          }),
        },
      }),
      "Aligned the selected items.",
    );
  }

  return {
    handleDuplicateLayer,
    handleLayerChange,
    handleAssignLayer,
    handleCreateGroup,
    handleClearGroup,
    handleAlignSelection,
  };
}
