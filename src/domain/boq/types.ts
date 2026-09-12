import type { BoqBoardRole } from "./roles";

export type BoqLine = {
  key: string;
  cabinetId: string;
  cabinetName: string;
  mark: string;
  partLabel: string;
  category: string;
  role: BoqBoardRole;
  material: string;
  finish: string;
  thicknessMm: number;
  quantity: number;
  lengthMm: number;
  widthMm: number;
  areaM2: number;
  workshopCost: number;
  sellPrice: number;
};

export type BoqGroup = {
  key: string;
  title: string;
  lines: BoqLine[];
  totalQuantity: number;
  totalAreaM2: number;
  workshopCost: number;
  sellPrice: number;
};

export type BoqViews = {
  byCabinet: BoqGroup[];
  byMaterial: BoqGroup[];
  byThickness: BoqGroup[];
  byRole: BoqGroup[];
  lines: BoqLine[];
};
