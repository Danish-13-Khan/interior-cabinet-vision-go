export type HardwareKind =
  | "hinge"
  | "slide"
  | "handle"
  | "leg"
  | "bracket"
  | "shelf-pin"
  | "accessory"
  | "consumable"
  /** Sold by the metre (gola profiles); quantity is metres. */
  | "profile"
  /** Door glazing; quantity is square metres. */
  | "glass";

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
  /** D10: an industry default no factory has confirmed yet (flagged in schedule and export). */
  unconfirmedDefault?: boolean;
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
  /** Appliance envelope used to size a compatible custom carcass. */
  applianceWidthMm: number;
  applianceHeightMm: number;
  applianceDepthMm: number;
};

export type HardwareLine = {
  id: string;
  label: string;
  kind: HardwareKind;
  quantity: number;
  unitCost: number;
  totalCost: number;
  /** D10: flagged "unconfirmed default" in the hardware schedule and production export. */
  unconfirmedDefault?: true;
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
  unconfirmedDefault?: true;
};

export type CabinetHardwareSummary = {
  cabinetId: string;
  cabinetName: string;
  mark: string;
  insertKind: ApplianceInsertKind;
  /** Report notes such as the worktop cut-out (the cut list itself stays rectangular). */
  notes: string[];
  lines: HardwareLine[];
  totalCost: number;
};
