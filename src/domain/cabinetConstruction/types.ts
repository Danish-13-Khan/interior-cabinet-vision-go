import type { CabinetBuildRules, GrainDirection } from "../materialSystem";
import type { CabinetConstructionSpec } from "../cabinetConstructionSpec";

export type PartCategory =
  | "Side"
  | "TopBottom"
  | "Back"
  | "Shelf"
  | "Divider"
  | "Door"
  | "DrawerBox"
  | "DrawerFront"
  | "EndPanel"
  | "ToeKick"
  | "Stretcher"
  | "FaceFrame";

export type CabinetPart = {
  id: string;
  label: string;
  category: PartCategory;
  quantity: number;
  lengthMm: number;
  widthMm: number;
  thicknessMm: number;
  grain: GrainDirection;
  materialLabel: string;
  finishLabel: string;
  edgeBandingLabel: string;
  notes?: string;
};

export type CabinetConstruction = {
  buildRules: CabinetBuildRules;
  constructionSpec: CabinetConstructionSpec;
  parts: CabinetPart[];
};
