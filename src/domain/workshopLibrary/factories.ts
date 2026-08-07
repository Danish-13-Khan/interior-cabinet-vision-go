import { clampCabinetConfig, cabinetTypeLabels, type CabinetConfig } from "../cabinetDimensions";
import type { DoorStyle } from "../cabinetOpeningStructure";
import type { CountertopConfig } from "../countertop";
import { DEFAULT_COUNTERTOP_CONFIG } from "../countertop";
import type { HardwareKind } from "../hardwareSystem";
import type {
  EdgeBandingId,
  FinishId,
  MaterialPresetId,
} from "../materialSystem";
import {
  clampProjectStandards,
  DEFAULT_PROJECT_STANDARDS,
  type ProjectStandards,
} from "../projectStandards";
import type { CabinetTemplate } from "../cabinetTemplates";
import { clampCabinetTemplate } from "../cabinetTemplates";
import {
  clampCabinetFamilyEntry,
  clampCountertopEntry,
  clampDoorStyleEntry,
  clampHardwareEntry,
  clampMaterialEntry,
  clampStandardsEntry,
} from "./clamp";
import type {
  CabinetFamilyLibraryEntry,
  CountertopLibraryEntry,
  DoorStyleLibraryEntry,
  HardwareLibraryEntry,
  MaterialLibraryEntry,
  StandardsLibraryEntry,
} from "./types";

export function countertopConfigFromEntry(entry: CountertopLibraryEntry): CountertopConfig {
  return {
    thicknessMm: entry.thicknessMm,
    overhangFrontMm: entry.overhangFrontMm,
    overhangSidesMm: entry.overhangSidesMm,
  };
}

export function standardsFromMaterialEntry(entry: MaterialLibraryEntry): ProjectStandards {
  return clampProjectStandards({
    ...DEFAULT_PROJECT_STANDARDS,
    materialPresetId: entry.materialPresetId,
    finishId: entry.finishId,
    edgeBandingId: entry.edgeBandingId,
  });
}

export function createCabinetPresetFromConfig(
  config: CabinetConfig,
  name: string,
  description = "",
): CabinetFamilyLibraryEntry {
  const now = new Date().toISOString();
  return clampCabinetFamilyEntry({
    id: `user-preset-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    label: name.trim() || `${cabinetTypeLabels[config.type]} preset`,
    family: config.type,
    description: description.trim() || `Saved ${cabinetTypeLabels[config.type]} library preset`,
    config: clampCabinetConfig(config),
    version: 1,
    updatedAt: now,
  })!;
}

export function bumpCabinetPresetVersion(
  entry: CabinetFamilyLibraryEntry,
  config: CabinetConfig,
): CabinetFamilyLibraryEntry {
  return {
    ...entry,
    config: clampCabinetConfig(config),
    version: entry.version + 1,
    updatedAt: new Date().toISOString(),
  };
}

export function bumpTemplateVersion(template: CabinetTemplate): CabinetTemplate {
  return clampCabinetTemplate({
    ...template,
    version: (template.version ?? 1) + 1,
    updatedAt: new Date().toISOString(),
  });
}

export function createDoorStyleEntry(
  label: string,
  doorStyle: DoorStyle,
  description = "",
): DoorStyleLibraryEntry {
  return clampDoorStyleEntry({
    id: `door-user-${Date.now()}`,
    label,
    doorStyle,
    description,
    version: 1,
  })!;
}

export function createMaterialEntry(
  label: string,
  materialPresetId: MaterialPresetId,
  finishId: FinishId,
  edgeBandingId: EdgeBandingId,
  description = "",
): MaterialLibraryEntry {
  return clampMaterialEntry({
    id: `material-user-${Date.now()}`,
    label,
    materialPresetId,
    finishId,
    edgeBandingId,
    description,
    version: 1,
  })!;
}

export function createHardwareEntry(
  label: string,
  kind: HardwareKind,
  costPerUnit: number,
  description = "",
): HardwareLibraryEntry {
  return clampHardwareEntry({
    id: `hw-user-${Date.now()}`,
    label,
    kind,
    costPerUnit,
    description,
    userDefined: true,
    version: 1,
  })!;
}

export function createCountertopEntry(
  label: string,
  config: CountertopConfig = DEFAULT_COUNTERTOP_CONFIG,
  materialLabel = "Laminate",
): CountertopLibraryEntry {
  return clampCountertopEntry({
    id: `ct-user-${Date.now()}`,
    label,
    ...config,
    materialLabel,
    description: `${materialLabel} worktop preset`,
    version: 1,
  })!;
}

export function createStandardsPackEntry(
  label: string,
  standards: ProjectStandards,
  description = "",
): StandardsLibraryEntry {
  return clampStandardsEntry({
    id: `std-user-${Date.now()}`,
    label,
    description,
    standards,
    version: 1,
    updatedAt: new Date().toISOString(),
  })!;
}
