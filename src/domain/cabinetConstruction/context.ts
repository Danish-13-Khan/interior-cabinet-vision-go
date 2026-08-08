import type { CabinetConfig, CabinetDimensions } from "../cabinetDimensions";
import type { CabinetBuildRules, CabinetMaterialSpec } from "../materialSystem";
import type { CabinetConstructionSpec } from "../cabinetConstructionSpec";
import type { CabinetPart } from "./types";

export type ConstructionContext = {
  safeConfig: CabinetConfig;
  buildRules: CabinetBuildRules;
  constructionSpec: CabinetConstructionSpec;
  materialSpec: CabinetMaterialSpec;
  dimensions: CabinetDimensions;
  innerWidth: number;
  innerHeight: number;
  innerDepth: number;
  backRule: { rebateMm: number; description: string };
  rebateMm: number;
  backWidth: number;
  backHeight: number;
  caseNote: string;
  shelfAdjustable: boolean;
  shelfDepth: number;
  faceFrameEnabled: boolean;
  stile: number;
  rail: number;
  faceOpeningWidth: number;
  faceOpeningHeight: number;
  parts: CabinetPart[];
};
