export type LengthUnit = "mm" | "cm" | "m" | "in" | "ft";
export type UpAxis = "y" | "z";

export type ImportSettings = {
  unit: LengthUnit;
  upAxis: UpAxis;
  optimizerVersion: number;
};

export type ImportFile = { name: string; bytes: ArrayBuffer };

export type ImportRequest = {
  files: ImportFile[];
  settings: ImportSettings;
  signal?: AbortSignal;
  /** FBX unit scale and OBJ exporter comments win until the user picks a unit. */
  honorFileUnits?: boolean;
};

export type ImportResult = {
  glb: ArrayBuffer | null;
  dimensions: { widthMm: number; heightMm: number; depthMm: number };
  thumbnail: ArrayBuffer | null;
  warnings: string[];
  sourceHash: string;
  assetId: string;
  /** Unit that was actually applied. Null when the file scale is not mm, cm, m, in, or ft. */
  appliedUnit: LengthUnit | null;
  /** Millimetres per file unit after that decision. */
  scaleToMm: number;
};

/** `unsupported` means the worker itself could not do the job, so the main thread should retry. */
export type WorkerResponse =
  | { id: number; ok: true; result: ImportResult }
  | { id: number; ok: false; error: string; unsupported?: boolean };
