export type HardwareKind =
  | "hinge"
  | "slide"
  | "handle"
  | "leg"
  | "bracket"
  | "shelf-pin"
  | "accessory"
  | "consumable";

export type HardwareItem = {
  id: string;
  label: string;
  kind: HardwareKind;
  costPerUnit: number;
  description?: string;
  /** For slides: nominal length hint in mm */
  lengthMm?: number;
  softClose?: boolean;
  pair?: boolean;
};

export type ApplianceInsertKind =
  | "none"
  | "sink-bowl"
  | "cooktop"
  | "dishwasher-gap";

export type CabinetAccessoryLine = {
  id: string;
  quantity: number;
};

export type CabinetHardwareSpec = {
  hingeId: string;
  slideId: string;
  handleId: string;
  legId: string;
  bracketId: string;
  includeShelfPins: boolean;
  accessories: CabinetAccessoryLine[];
  insertKind: ApplianceInsertKind;
};

export type HardwareLine = {
  id: string;
  label: string;
  kind: HardwareKind;
  quantity: number;
  unitCost: number;
  totalCost: number;
};

export type HardwareScheduleRow = {
  hardwareId: string;
  label: string;
  kind: HardwareKind;
  quantity: number;
  unitCost: number;
  totalCost: number;
  cabinetCount: number;
  cabinetMarks: string[];
};

export type CabinetHardwareSummary = {
  cabinetId: string;
  cabinetName: string;
  mark: string;
  insertKind: ApplianceInsertKind;
  lines: HardwareLine[];
  totalCost: number;
};
