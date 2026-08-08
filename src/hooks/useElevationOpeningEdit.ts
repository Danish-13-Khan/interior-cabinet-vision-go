import {
  clampCabinetConfig,
  type CabinetInstance,
  type CabinetProject,
} from "../domain/cabinetDimensions";
import {
  normalizeComposition,
  resolveCabinetComposition,
  syncFlatFieldsFromComposition,
} from "../domain/cabinetComposition";
import { setActiveOpening } from "../domain/cabinetOpeningStructure";
import {
  applyElevationOpeningCommand,
  elevationOpeningCommandStatus,
  type ElevationOpeningCommand,
} from "../domain/elevationOpeningEdit";
import type { PanelName } from "../domain/cabinetGeometry";

type UseElevationOpeningEditArgs = {
  project: CabinetProject;
  updateCabinet: (
    cabinetId: string,
    updater: (cabinet: CabinetInstance) => CabinetInstance,
    status?: string,
  ) => void;
  replaceSelection: (
    ids: string[],
    nextActiveId?: string | null,
    nextPanelName?: PanelName | null,
  ) => void;
  isCabinetLocked: (cabinet: CabinetInstance) => boolean;
  onStatus: (status: string) => void;
};

export function useElevationOpeningEdit({
  project,
  updateCabinet,
  replaceSelection,
  isCabinetLocked,
  onStatus,
}: UseElevationOpeningEditArgs) {
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

  function handleElevationOpeningCommand(
    cabinetId: string,
    command: ElevationOpeningCommand,
  ) {
    const cabinet = project.cabinets.find((item) => item.id === cabinetId);
    if (!cabinet) return;
    if (isCabinetLocked(cabinet)) {
      onStatus("This item is on a locked layer.");
      return;
    }

    const nextConfig = applyElevationOpeningCommand(cabinet.config, command);
    if (nextConfig === cabinet.config) {
      onStatus("Opening edit blocked by family rules.");
      return;
    }

    updateCabinet(
      cabinetId,
      (current) => ({ ...current, config: nextConfig }),
      elevationOpeningCommandStatus(command),
    );
  }

  return {
    handleSelectOpening,
    handleElevationOpeningCommand,
  };
}
