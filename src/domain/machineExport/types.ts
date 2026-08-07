/** Machine-export-ready part / operation model (intent layer — not verified CNC). */

export const MACHINE_EXPORT_SCHEMA_VERSION = 1;
export const MACHINE_EXPORT_DISCLAIMER =
  "Intent / preview only — not verified CNC toolpaths or machine-ready programs.";

export type MachineOperationKind =
  | "cut-outline"
  | "drill"
  | "groove"
  | "rebate"
  | "pocket"
  | "joinery-note"
  | "hardware-intent";

export type MachineOperationStatus = "intent" | "preview" | "unverified";

/** Optional geometry — left sparse until real CNC is implemented. */
export type MachineOperationGeometry = {
  xMm?: number;
  yMm?: number;
  zMm?: number;
  lengthMm?: number;
  widthMm?: number;
  depthMm?: number;
  diameterMm?: number;
  angleDeg?: number;
};

export type MachineOperation = {
  id: string;
  kind: MachineOperationKind;
  label: string;
  status: MachineOperationStatus;
  /** Human-readable manufacturing intent. */
  description: string;
  geometry?: MachineOperationGeometry;
  /** Tool hint only — not a real tool library. */
  toolHint?: string;
  source: {
    shopRef: string;
    partId: string;
    cabinetId: string;
    notes?: string;
  };
};

export type PartOrientation = {
  /** Which blank face is up during machining intent. */
  faceUp: "outside" | "inside" | "either";
  /** Grain alignment relative to blank length. */
  grainAlong: "length" | "width" | "none";
  /** Suggested origin corner for future adapters. */
  originCorner: "bottom-left" | "bottom-right" | "top-left" | "top-right";
  rotationDeg: 0 | 90 | 180 | 270;
};

export type MachinePartMetadata = {
  shopRef: string;
  partId: string;
  cabinetId: string;
  cabinetName: string;
  label: string;
  category: string;
  quantity: number;
  blank: {
    lengthMm: number;
    widthMm: number;
    thicknessMm: number;
    material: string;
    finish: string;
    edgeBanding: string;
  };
  orientation: PartOrientation;
  operations: MachineOperation[];
};

export type MachiningPreviewSummary = {
  partCount: number;
  operationCount: number;
  drillIntentCount: number;
  grooveIntentCount: number;
  cutIntentCount: number;
  unverifiedCount: number;
};

export type MachineJobDocument = {
  schemaVersion: number;
  format: "cabinet-designer-machine-json";
  disclaimer: string;
  generatedAt: string;
  job: {
    projectNumber: string;
    revision: string;
    customerName: string;
    title: string;
  };
  summary: MachiningPreviewSummary;
  parts: MachinePartMetadata[];
};

export type MachineExportAdapterId = "json-preview" | "csv-ops-preview";

export type MachineExportAdapter = {
  id: MachineExportAdapterId;
  label: string;
  description: string;
  mimeType: string;
  fileExtension: string;
  /** Future formats register here; only preview adapters are implemented. */
  implemented: boolean;
  serialize: (doc: MachineJobDocument) => string;
};
