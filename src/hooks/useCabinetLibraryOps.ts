import {
  cabinetTypeLabels,
  clampCabinetProject,
  type CabinetConfig,
  type CabinetInstance,
  type CabinetLayer,
  type CabinetProject,
  type CabinetType,
} from "../domain/cabinetDimensions";
import {
  createConfigFromFamily,
  createConfigFromLibraryItem,
} from "../domain/cabinetLibraryCatalog";
import {
  createConfigFromTemplate,
  createProjectFromStarter,
  createTemplateFromCabinet,
  type CabinetTemplate,
} from "../domain/cabinetTemplates";
import { createCabinetId, createItemName } from "../domain/cabinetIds";
import { findPlacementForNewCabinet } from "../domain/cabinetPlacement";
import type { ProjectStandards } from "../domain/projectStandards";
import type { CabinetFamilyLibraryEntry } from "../domain/workshopLibrary";
import type { RoomConfig } from "../domain/roomModel";
import type { CommitProjectChange, CommitSnapshot } from "./projectCommit";
import {
  findAvailableWallPlacement,
  type WallLayoutSide,
} from "../domain/wallLayout";

type RoomBounds = {
  widthMm: number;
  depthMm: number;
  heightMm: number;
};

type UseCabinetLibraryOpsArgs = {
  project: CabinetProject;
  room: RoomConfig;
  roomBounds: RoomBounds;
  selectedCabinet: CabinetInstance | null;
  layers: CabinetLayer[];
  projectPreferences: NonNullable<CabinetProject["preferences"]>;
  projectStandards: ProjectStandards;
  workshopCabinetPresets: CabinetFamilyLibraryEntry[];
  userTemplates: CabinetTemplate[];
  commitProjectChange: CommitProjectChange;
  commitSnapshot: CommitSnapshot;
  saveTemplate: (template: CabinetTemplate) => void;
  deleteTemplate: (templateId: string) => void;
  setProjectFilePath: (path: string | null) => void;
  onStatus: (status: string) => void;
};

export function useCabinetLibraryOps({
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
}: UseCabinetLibraryOpsArgs) {
  function placeNewCabinet(
    config: CabinetConfig,
    nameHint: string,
    wallSide?: WallLayoutSide,
    preferredPrimaryMm?: number,
  ) {
    const defaultLayerId = layers[0]?.id ?? "layer-default";
    const tmpCab: CabinetInstance = {
      id: createCabinetId(),
      name: createItemName(config.type, project.cabinets.length + 1),
      placement: { x: 0, y: 0, z: 0, rotation: 0, attachment: "floor" },
      config,
      layerId: defaultLayerId,
      groupId: null,
    };
    const placement = wallSide
      ? findAvailableWallPlacement({
          project,
          room,
          roomBounds,
          config,
          side: wallSide,
          provisionalId: tmpCab.id,
          preferredPrimaryMm,
          snapMm: projectPreferences.snapSizeMm,
        })
      : findPlacementForNewCabinet(
          project,
          room,
          roomBounds,
          config,
          tmpCab,
        );

    if (!placement) {
      onStatus("No clear span is available on the selected wall.");
      return;
    }

    const newCabinet: CabinetInstance = {
      id: tmpCab.id,
      name: tmpCab.name,
      placement,
      config,
      layerId: defaultLayerId,
      groupId: null,
    };

    commitProjectChange(
      (currentProject) => ({
        project: {
          ...currentProject,
          cabinets: [...currentProject.cabinets, newCabinet],
        },
        selectedCabinetIds: [newCabinet.id],
        activeCabinetId: newCabinet.id,
        selectedPanelName: null,
      }),
      wallSide
        ? `Added ${nameHint} to the selected wall run.`
        : `Added ${nameHint} to the room scene.`,
    );
  }

  function handleAddCabinet(type: CabinetType = "base") {
    placeNewCabinet(
      createConfigFromFamily(type, projectStandards),
      cabinetTypeLabels[type].toLowerCase(),
    );
  }

  function handleAddCabinetToWall(
    type: CabinetType,
    wallSide: WallLayoutSide,
    preferredPrimaryMm?: number,
  ) {
    placeNewCabinet(
      createConfigFromFamily(type, projectStandards),
      cabinetTypeLabels[type].toLowerCase(),
      wallSide,
      preferredPrimaryMm,
    );
  }

  function handleAddLibraryItem(itemId: string) {
    const config = createConfigFromLibraryItem(
      itemId,
      projectStandards,
      workshopCabinetPresets,
    );
    if (!config) {
      onStatus("Library item could not be resolved.");
      return;
    }
    placeNewCabinet(config, config.type);
  }

  function handleAddLibraryItemToWall(
    itemId: string,
    wallSide: WallLayoutSide,
    preferredPrimaryMm?: number,
  ) {
    const config = createConfigFromLibraryItem(
      itemId,
      projectStandards,
      workshopCabinetPresets,
    );
    if (!config) {
      onStatus("Library item could not be resolved.");
      return;
    }
    placeNewCabinet(config, config.type, wallSide, preferredPrimaryMm);
  }

  function handleAddTemplate(templateId: string) {
    const template = userTemplates.find((item) => item.id === templateId);
    if (!template) {
      onStatus("Template not found.");
      return;
    }
    placeNewCabinet(
      createConfigFromTemplate(template, projectStandards),
      template.name.toLowerCase(),
    );
  }

  function handleAddTemplateToWall(
    templateId: string,
    wallSide: WallLayoutSide,
    preferredPrimaryMm?: number,
  ) {
    const template = userTemplates.find((item) => item.id === templateId);
    if (!template) {
      onStatus("Template not found.");
      return;
    }
    placeNewCabinet(
      createConfigFromTemplate(template, projectStandards),
      template.name.toLowerCase(),
      wallSide,
      preferredPrimaryMm,
    );
  }

  function handleSaveCabinetTemplate(name?: string) {
    if (!selectedCabinet) {
      onStatus("Select a cabinet to save as a template.");
      return;
    }
    const template = createTemplateFromCabinet(selectedCabinet, name);
    saveTemplate(template);
    onStatus(`Saved template “${template.name}”.`);
  }

  function handleDeleteTemplate(templateId: string) {
    deleteTemplate(templateId);
    onStatus("Deleted cabinet template.");
  }

  function handleApplyStarter(starterId: string) {
    const starter = createProjectFromStarter(starterId, projectStandards);
    if (!starter) {
      onStatus("Starter template not found.");
      return;
    }
    const safeProject = clampCabinetProject({
      ...starter.project,
      preferences: {
        ...projectPreferences,
        ...starter.project.preferences,
        standards: projectStandards,
      },
    });
    commitSnapshot(
      {
        project: safeProject,
        room: starter.room,
        selectedCabinetIds: safeProject.cabinets[0]?.id
          ? [safeProject.cabinets[0].id]
          : [],
        activeCabinetId: safeProject.cabinets[0]?.id ?? null,
        selectedPanelName: null,
      },
      `Loaded starter “${starterId}”.`,
    );
    setProjectFilePath(null);
  }

  return {
    handleAddCabinet,
    handleAddCabinetToWall,
    handleAddLibraryItem,
    handleAddLibraryItemToWall,
    handleAddTemplate,
    handleAddTemplateToWall,
    handleSaveCabinetTemplate,
    handleDeleteTemplate,
    handleApplyStarter,
  };
}
