import {
  clampCabinetConfig,
  clampCabinetPlacement,
  getWallPlacement,
  normalizeRotationAngle,
  projectHasCollision,
  supportsWallPlacement,
  type CabinetConfig,
  type CabinetDimensions,
  type CabinetInstance,
  type CabinetPlacement,
  type CabinetProject,
} from "../domain/cabinetDimensions";
import {
  resolveCabinetComposition,
  syncFlatFieldsFromComposition,
  normalizeComposition,
} from "../domain/cabinetComposition";
import { setActiveOpening } from "../domain/cabinetOpeningStructure";
import { cabinetBlocksOpening, type RoomConfig } from "../domain/roomModel";
import type { PanelName } from "../domain/cabinetGeometry";
import type { CommitProjectChange } from "./projectCommit";

type RoomBounds = {
  widthMm: number;
  depthMm: number;
  heightMm: number;
};

type UseCabinetTransformsArgs = {
  project: CabinetProject;
  room: RoomConfig;
  roomBounds: RoomBounds;
  activeCabinetId: string | null;
  selectedCabinet: CabinetInstance | null;
  commitProjectChange: CommitProjectChange;
  replaceSelection: (
    ids: string[],
    nextActiveId?: string | null,
    nextPanelName?: PanelName | null,
  ) => void;
  isCabinetLocked: (cabinet: CabinetInstance) => boolean;
  onStatus: (status: string) => void;
};

export function useCabinetTransforms({
  project,
  room,
  roomBounds,
  activeCabinetId,
  selectedCabinet,
  commitProjectChange,
  replaceSelection,
  isCabinetLocked,
  onStatus,
}: UseCabinetTransformsArgs) {
  function updateCabinet(
    cabinetId: string,
    updater: (cabinet: CabinetInstance) => CabinetInstance,
    status?: string,
  ) {
    commitProjectChange(
      (currentProject) => ({
        project: {
          ...currentProject,
          cabinets: currentProject.cabinets.map((cabinet) =>
            cabinet.id === cabinetId ? updater(cabinet) : cabinet,
          ),
        },
      }),
      status,
    );
  }

  function clampPlacementInRoom(
    placement: CabinetPlacement,
    dimensions: CabinetDimensions,
  ) {
    return clampCabinetPlacement(placement, dimensions, roomBounds);
  }

  function cabinetWouldBlockOpening(
    cabinetId: string,
    placement: CabinetPlacement,
    dimensions?: CabinetDimensions,
  ) {
    const currentCabinet = project.cabinets.find((cabinet) => cabinet.id === cabinetId);
    if (!currentCabinet) return false;
    return cabinetBlocksOpening(
      {
        ...currentCabinet,
        placement,
        config: {
          ...currentCabinet.config,
          dimensions: dimensions ?? currentCabinet.config.dimensions,
        },
      },
      room,
    );
  }

  function handleConfigChange(updatedConfig: Partial<CabinetConfig>) {
    if (!activeCabinetId || !selectedCabinet) return;
    if (isCabinetLocked(selectedCabinet)) {
      onStatus("This item is on a locked layer.");
      return;
    }

    const nextConfig = clampCabinetConfig({
      ...selectedCabinet.config,
      ...updatedConfig,
      dimensions: {
        ...selectedCabinet.config.dimensions,
        ...(updatedConfig.dimensions ?? {}),
      },
    });

    const nextAttachment =
      supportsWallPlacement(nextConfig.type) ||
      selectedCabinet.placement.attachment === "floor"
        ? selectedCabinet.placement.attachment
        : "floor";

    const nextPlacement = clampCabinetPlacement(
      {
        ...selectedCabinet.placement,
        attachment: nextAttachment,
      },
      nextConfig.dimensions,
      roomBounds,
    );

    if (
      projectHasCollision(
        project,
        activeCabinetId,
        nextPlacement,
        nextConfig.dimensions,
      ) ||
      cabinetWouldBlockOpening(activeCabinetId, nextPlacement, nextConfig.dimensions)
    ) {
      onStatus("Change blocked: item would collide or block an opening.");
      return;
    }

    updateCabinet(
      activeCabinetId,
      (cabinet) => ({
        ...cabinet,
        placement: nextPlacement,
        config: nextConfig,
      }),
      "Updated the selected item.",
    );
  }

  function handlePlacementChange(axis: "x" | "y" | "z", value: number) {
    if (!activeCabinetId || !selectedCabinet || !Number.isFinite(value)) return;
    if (isCabinetLocked(selectedCabinet)) {
      onStatus("This item is on a locked layer.");
      return;
    }

    const nextPlacement = clampPlacementInRoom(
      { ...selectedCabinet.placement, [axis]: value },
      selectedCabinet.config.dimensions,
    );

    if (
      projectHasCollision(project, activeCabinetId, nextPlacement) ||
      cabinetWouldBlockOpening(activeCabinetId, nextPlacement)
    ) {
      onStatus("Placement blocked: room items cannot overlap or block openings.");
      return;
    }

    updateCabinet(
      activeCabinetId,
      (cabinet) => ({ ...cabinet, placement: nextPlacement }),
      "Moved the selected item.",
    );
  }

  function handleRotationChange(rotation: number) {
    if (!activeCabinetId || !selectedCabinet) return;
    if (isCabinetLocked(selectedCabinet)) {
      onStatus("This item is on a locked layer.");
      return;
    }

    const nextPlacement = clampPlacementInRoom(
      {
        ...selectedCabinet.placement,
        rotation: normalizeRotationAngle(rotation),
      },
      selectedCabinet.config.dimensions,
    );

    if (
      projectHasCollision(project, activeCabinetId, nextPlacement) ||
      cabinetWouldBlockOpening(activeCabinetId, nextPlacement)
    ) {
      onStatus("Rotation blocked: item would collide or block an opening.");
      return;
    }

    updateCabinet(
      activeCabinetId,
      (cabinet) => ({ ...cabinet, placement: nextPlacement }),
      "Rotated the selected item.",
    );
  }

  function handleAttachmentChange(attachment: CabinetPlacement["attachment"]) {
    if (!activeCabinetId || !selectedCabinet) return;
    if (isCabinetLocked(selectedCabinet)) {
      onStatus("This item is on a locked layer.");
      return;
    }

    if (
      attachment !== "floor" &&
      !supportsWallPlacement(selectedCabinet.config.type)
    ) {
      return;
    }

    const nextPlacement = getWallPlacement(
      selectedCabinet.placement,
      selectedCabinet.config.type,
      selectedCabinet.config.dimensions,
      attachment,
      roomBounds,
    );

    if (
      projectHasCollision(project, activeCabinetId, nextPlacement) ||
      cabinetWouldBlockOpening(activeCabinetId, nextPlacement)
    ) {
      onStatus("Wall placement blocked: item would overlap or block an opening.");
      return;
    }

    updateCabinet(
      activeCabinetId,
      (cabinet) => ({ ...cabinet, placement: nextPlacement }),
      "Updated the wall attachment.",
    );
  }

  function handleCabinetResize(cabinetId: string, dimensions: CabinetDimensions) {
    const cabinet = project.cabinets.find((item) => item.id === cabinetId);
    if (!cabinet) return;
    if (isCabinetLocked(cabinet)) {
      onStatus("This item is on a locked layer.");
      return;
    }

    const nextConfig = clampCabinetConfig({ ...cabinet.config, dimensions });
    const nextPlacement = clampPlacementInRoom(
      cabinet.placement,
      nextConfig.dimensions,
    );

    if (
      projectHasCollision(
        project,
        cabinetId,
        nextPlacement,
        nextConfig.dimensions,
      ) ||
      cabinetWouldBlockOpening(cabinetId, nextPlacement, nextConfig.dimensions)
    ) {
      onStatus("Resize blocked: item would collide or block an opening.");
      return;
    }

    updateCabinet(
      cabinetId,
      (currentCabinet) => ({
        ...currentCabinet,
        placement: nextPlacement,
        config: nextConfig,
      }),
      "Resized the selected item.",
    );
  }

  function handleCabinetMove(cabinetId: string, placement: CabinetPlacement) {
    const cabinet = project.cabinets.find((item) => item.id === cabinetId);
    if (!cabinet) return false;
    if (isCabinetLocked(cabinet)) {
      onStatus("This item is on a locked layer.");
      return false;
    }

    const nextPlacement = clampPlacementInRoom(
      placement,
      cabinet.config.dimensions,
    );

    if (
      projectHasCollision(project, cabinetId, nextPlacement) ||
      cabinetWouldBlockOpening(cabinetId, nextPlacement)
    ) {
      onStatus("Move blocked: room items cannot overlap or block openings.");
      return false;
    }

    updateCabinet(
      cabinetId,
      (currentCabinet) => ({ ...currentCabinet, placement: nextPlacement }),
      "Moved the selected item.",
    );
    return true;
  }

  function handleCabinetRotate(cabinetId: string, rotation: number) {
    const cabinet = project.cabinets.find((item) => item.id === cabinetId);
    if (!cabinet) return false;
    if (isCabinetLocked(cabinet)) {
      onStatus("This item is on a locked layer.");
      return false;
    }

    const nextPlacement = clampPlacementInRoom(
      { ...cabinet.placement, rotation: normalizeRotationAngle(rotation) },
      cabinet.config.dimensions,
    );

    if (
      projectHasCollision(project, cabinetId, nextPlacement) ||
      cabinetWouldBlockOpening(cabinetId, nextPlacement)
    ) {
      onStatus("Rotation blocked: item would collide or block an opening.");
      return false;
    }

    updateCabinet(
      cabinetId,
      (currentCabinet) => ({ ...currentCabinet, placement: nextPlacement }),
      "Rotated the selected item.",
    );
    return true;
  }

  function handleSelectOpening(cabinetId: string, openingId: string) {
    const cabinet = project.cabinets.find((item) => item.id === cabinetId);
    if (!cabinet) return;
    if (isCabinetLocked(cabinet)) {
      onStatus("This item is on a locked layer.");
      return;
    }

    replaceSelection([cabinetId], cabinetId, null);
    const composition = resolveCabinetComposition(cabinet.config);
    if (!composition.openingStructure) {
      onStatus("Selected cabinet has no opening structure.");
      return;
    }
    const nextStructure = setActiveOpening(
      composition.openingStructure,
      openingId,
    );
    const nextComposition = normalizeComposition(
      cabinet.config.type,
      { ...composition, openingStructure: nextStructure },
      cabinet.config.dimensions.width,
    );
    updateCabinet(
      cabinetId,
      (current) => ({
        ...current,
        config: clampCabinetConfig({
          ...current.config,
          composition: nextComposition,
          ...syncFlatFieldsFromComposition(nextComposition),
        }),
      }),
      "Selected opening in front elevation.",
    );
  }

  return {
    updateCabinet,
    clampPlacementInRoom,
    handleConfigChange,
    handlePlacementChange,
    handleRotationChange,
    handleAttachmentChange,
    handleCabinetResize,
    handleCabinetMove,
    handleCabinetRotate,
    handleSelectOpening,
  };
}
