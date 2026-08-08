import type { CabinetInstance } from "../cabinetDimensions";

export type PanelName = string;
export type Vector3Tuple = [number, number, number];

export type CabinetPanelGeometry = {
  name: PanelName;
  label: string;
  size: Vector3Tuple;
  position: Vector3Tuple;
  material: "board" | "back" | "door";
};

export type CabinetDimensionGuide = {
  id: "width" | "height" | "depth";
  label: string;
  points: [Vector3Tuple, Vector3Tuple];
  labelPosition: Vector3Tuple;
};

export type CabinetCutlistItem = {
  key: string;
  label: string;
  quantity: number;
  lengthMm: number;
  widthMm: number;
  thicknessMm: number;
  material: "Board" | "Back Panel" | "Door";
};

export type CabinetDerivedMetrics = {
  openingWidthMm: number;
  openingHeightMm: number;
  usableShelfDepthMm: number;
  estimatedPanelCount: number;
};

export type CabinetSceneItem = CabinetInstance & {
  metrics: CabinetDerivedMetrics;
  panels: CabinetPanelGeometry[];
};
