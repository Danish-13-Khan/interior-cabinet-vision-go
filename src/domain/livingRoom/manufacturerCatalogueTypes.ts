import type { MaterialKind } from "../interiorProject";

/** One curated manufacturer finish — map bytes are already project-owned data URLs. */
export type ManufacturerFinishSeed = {
  id: string;
  name: string;
  kind: MaterialKind;
  color: string;
  /** `data:image/...;base64,...` only — never a live remote URL. */
  mapDataUrl: string;
  roughness?: number;
};

export type ManufacturerCatalogue = {
  id: string;
  name: string;
  note: string;
  finishes: readonly ManufacturerFinishSeed[];
};
