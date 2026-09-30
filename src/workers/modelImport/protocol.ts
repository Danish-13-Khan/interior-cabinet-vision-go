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
  /** When the spike fails, textures stay on the main thread. */
  texturesOnMain?: boolean;
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
  /** Unit that was actually applied, not the previous import's choice. */
  appliedUnit: LengthUnit;
  /** Millimetres per file unit after that decision. */
  scaleToMm: number;
};
