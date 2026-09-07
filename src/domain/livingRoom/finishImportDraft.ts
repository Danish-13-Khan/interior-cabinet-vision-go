import type { MaterialKind } from "../interiorProject";
import { readImageAsDataUrl } from "./importedFinish";

export type FinishImportDraft = {
  fileName: string;
  dataUrl: string;
  uvScaleMm: number;
  uvRotationDeg: number;
  /** 0–1 texture offset along U. */
  uvOffsetU: number;
  /** 0–1 texture offset along V. */
  uvOffsetV: number;
  /** Optional catalogue / import metadata applied on commit. */
  color?: string;
  kind?: MaterialKind;
  roughness?: number;
  createdBy?: string;
  manufacturerId?: string;
  catalogueFinishId?: string;
};

export const DEFAULT_FINISH_IMPORT_UV = {
  uvScaleMm: 1000,
  uvRotationDeg: 0,
  uvOffsetU: 0,
  uvOffsetV: 0,
} as const;

/** Stage a local image for preview before committing into the project. */
export async function stageFinishImportFile(file: File): Promise<FinishImportDraft> {
  const dataUrl = await readImageAsDataUrl(file);
  return {
    fileName: file.name,
    dataUrl,
    ...DEFAULT_FINISH_IMPORT_UV,
  };
}

export function patchFinishImportDraft(
  draft: FinishImportDraft,
  patch: Partial<Omit<FinishImportDraft, "fileName" | "dataUrl">>,
): FinishImportDraft {
  return { ...draft, ...patch };
}
