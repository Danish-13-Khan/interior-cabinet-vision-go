import { type CabinetInstance, type CabinetProject } from "../domain/cabinetDimensions";
import { resolveCabinetComposition } from "../domain/cabinetComposition";
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
  activeCabinetId: string | null;
  activeOpeningId: string | null;
  setActiveOpeningId: (openingId: string | null, cabinetId?: string | null) => void;
  isCabinetLocked: (cabinet: CabinetInstance) => boolean;
  onStatus: (status: string) => void;
};

export function useElevationOpeningEdit({
  project,
  updateCabinet,
  replaceSelection,
  activeCabinetId,
  activeOpeningId,
  setActiveOpeningId,
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
    const structure = resolveCabinetComposition(cabinet.config).openingStructure;
    if (!structure) {
      onStatus("Selected cabinet has no opening structure.");
      return;
    }
    if (!structure.root || !openingId) return;
    setActiveOpeningId(openingId, cabinetId);
    onStatus("Selected opening in front elevation.");
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

    const nextConfig = applyElevationOpeningCommand(
      cabinet.config,
      command,
      activeCabinetId === cabinetId ? activeOpeningId : null,
    );
    if (nextConfig === cabinet.config) {
      onStatus("Opening edit blocked by family rules.");
      return;
    }

    const nextStructure = resolveCabinetComposition(nextConfig).openingStructure;
    setActiveOpeningId(nextStructure?.activeOpeningId ?? null, cabinetId);

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
