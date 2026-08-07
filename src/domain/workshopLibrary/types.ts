import type { CabinetConfig, CabinetType } from "../cabinetDimensions";
import type { DoorStyle } from "../cabinetOpeningStructure";
import type { HardwareItem } from "../hardwareSystem";
import type {
  EdgeBandingId,
  FinishId,
  MaterialPresetId,
} from "../materialSystem";
import type { ProjectStandards } from "../projectStandards";

export const WORKSHOP_LIBRARY_STORAGE_KEY = "cabinet-designer-workshop-library";
export const WORKSHOP_LIBRARY_SCHEMA_VERSION = 1;

export type DoorStyleLibraryEntry = {
  id: string;
  label: string;
  doorStyle: DoorStyle;
  description: string;
  version: number;
};

export type MaterialLibraryEntry = {
  id: string;
  label: string;
  materialPresetId: MaterialPresetId;
  finishId: FinishId;
  edgeBandingId: EdgeBandingId;
  description: string;
  version: number;
};

export type HardwareLibraryEntry = HardwareItem & {
  userDefined: true;
  version: number;
};

export type CountertopLibraryEntry = {
  id: string;
  label: string;
  thicknessMm: number;
  overhangFrontMm: number;
  overhangSidesMm: number;
  materialLabel: string;
  description: string;
  version: number;
};

export type StandardsLibraryEntry = {
  id: string;
  label: string;
  description: string;
  standards: ProjectStandards;
  version: number;
  updatedAt: string;
};

export type CabinetFamilyLibraryEntry = {
  id: string;
  label: string;
  family: CabinetType;
  description: string;
  config: CabinetConfig;
  version: number;
  updatedAt: string;
};

export type WorkshopLibraryPack = {
  schemaVersion: number;
  updatedAt: string;
  doorStyles: DoorStyleLibraryEntry[];
  materials: MaterialLibraryEntry[];
  hardware: HardwareLibraryEntry[];
  countertops: CountertopLibraryEntry[];
  standardsPacks: StandardsLibraryEntry[];
  cabinetPresets: CabinetFamilyLibraryEntry[];
};
