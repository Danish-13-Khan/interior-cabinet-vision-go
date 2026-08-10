import {
  clampCabinetConfig,
  type CabinetConfig,
} from "../cabinetDimensions";
import {
  normalizeComposition,
  resolveCabinetComposition,
  syncFlatFieldsFromComposition,
} from "../cabinetComposition";
import {
  createDefaultOpeningStructure,
  deleteOpening,
  mergeOpening,
  setOpeningRatio,
  setOpeningContentType,
  splitOpening,
} from "../cabinetOpeningStructure";
import type { ElevationOpeningCommand } from "./types";

export function applyElevationOpeningCommand(
  config: CabinetConfig,
  command: ElevationOpeningCommand,
  activeOpeningIdOverride?: string | null,
): CabinetConfig {
  const composition = resolveCabinetComposition(config);
  const structure = composition.openingStructure;
  if (!structure) return config;

  const openingId =
    command.kind === "set-ratio" && command.openingId
      ? command.openingId
      : activeOpeningIdOverride ?? structure.activeOpeningId;
  let nextStructure = structure;

  if (command.kind === "split-vertical") {
    nextStructure = splitOpening(
      structure,
      openingId,
      "vertical",
      config.type,
      config.dimensions.width,
    );
  } else if (command.kind === "split-horizontal") {
    nextStructure = splitOpening(
      structure,
      openingId,
      "horizontal",
      config.type,
      config.dimensions.width,
    );
  } else if (command.kind === "merge") {
    nextStructure = mergeOpening(
      structure,
      openingId,
      config.type,
      config.dimensions.width,
    );
  } else if (command.kind === "delete") {
    nextStructure = deleteOpening(
      structure,
      openingId,
      config.type,
      config.dimensions.width,
    );
  } else if (command.kind === "reset") {
    nextStructure = createDefaultOpeningStructure(
      config.type,
      config.dimensions.width,
    );
  } else if (command.kind === "set-ratio") {
    nextStructure = setOpeningRatio(
      structure,
      openingId,
      command.ratio,
      config.type,
      config.dimensions.width,
    );
  } else {
    nextStructure = setOpeningContentType(
      structure,
      openingId,
      command.contentType,
      config.type,
      config.dimensions.width,
    );
  }

  if (nextStructure === structure) return config;

  const nextComposition = normalizeComposition(
    config.type,
    { ...composition, openingStructure: nextStructure },
    config.dimensions.width,
  );

  return clampCabinetConfig({
    ...config,
    composition: nextComposition,
    ...syncFlatFieldsFromComposition(nextComposition),
  });
}

export function elevationOpeningCommandStatus(
  command: ElevationOpeningCommand,
): string {
  if (command.kind === "split-vertical") {
    return "Split opening vertically in front elevation.";
  }
  if (command.kind === "split-horizontal") {
    return "Split opening horizontally in front elevation.";
  }
  if (command.kind === "merge") return "Merged the selected assembly opening.";
  if (command.kind === "delete") return "Deleted the selected assembly opening.";
  if (command.kind === "reset") return "Reset the cabinet assembly.";
  if (command.kind === "set-ratio") return "Resized the cabinet opening.";
  return `Set opening content to ${command.contentType} in front elevation.`;
}
