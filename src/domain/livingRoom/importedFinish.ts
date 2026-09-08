import {
  assertInteriorProjectFileByteLimit,
  MAX_INTERIOR_PROJECT_FILE_BYTES,
  serializeInteriorProjectFile,
  type InteriorProject,
  type MaterialEntity,
} from "../interiorProject";
import { mutateProjectMaterialCow } from "../catalog/finishCommands";
import type { FinishUvRebind } from "../catalog/finishRebind";
import { validateFinishDataUrl, validateFinishImageFile } from "./importedFinishValidate";

/** Binary image cap so a few imports cannot overflow the 25 MB project file. */
export const MAX_FINISH_BYTES = 2 * 1024 * 1024;
const PROJECT_JSON_HEADROOM_BYTES = 1024 * 1024;

export type FinishUvPatch = {
  uvScaleMm?: number;
  uvRotationDeg?: number;
  uvOffsetU?: number;
  uvOffsetV?: number;
};

export function mapPayloadExceedsProjectLimit(existingMapChars: number, nextDataUrlLength: number) {
  return existingMapChars + nextDataUrlLength + PROJECT_JSON_HEADROOM_BYTES > MAX_INTERIOR_PROJECT_FILE_BYTES;
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") return Buffer.from(bytes).toString("base64");
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]!);
  }
  return btoa(binary);
}

export function encodeFinishImageDataUrl(bytes: Uint8Array, mime: string): string {
  return `data:${mime};base64,${bytesToBase64(bytes)}`;
}

/** Read a finish image as a data URL (works in browser and Vitest/Node). */
export async function readImageAsDataUrl(file: File): Promise<string> {
  const invalid = validateFinishImageFile(file, MAX_FINISH_BYTES);
  if (invalid) throw new Error(invalid);
  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await file.arrayBuffer());
  } catch {
    throw new Error(`Could not read ${file.name}.`);
  }
  const dataUrl = encodeFinishImageDataUrl(bytes, file.type);
  const dataInvalid = validateFinishDataUrl(dataUrl);
  if (dataInvalid) throw new Error(dataInvalid);
  return dataUrl;
}

function nextMaterialId(project: InteriorProject) {
  const used = new Set(project.materials.map((material) => material.id));
  let index = 1;
  while (used.has(`finish-import-${index}`)) index += 1;
  return `finish-import-${index}`;
}

function clampOffset(value: number) {
  return Math.max(0, Math.min(1, Math.round(value * 1000) / 1000));
}

/** Same clamps as inspector UV edits — used on import and setFinishUv. */
export function normalizeFinishUv(patch: {
  uvScaleMm?: number;
  uvRotationDeg?: number;
  uvOffsetU?: number;
  uvOffsetV?: number;
}): Required<FinishUvPatch> {
  return {
    uvScaleMm: Math.max(120, Math.min(8000, Math.round(patch.uvScaleMm ?? 1000))),
    uvRotationDeg: ((Math.round(patch.uvRotationDeg ?? 0) % 360) + 360) % 360,
    uvOffsetU: clampOffset(patch.uvOffsetU ?? 0),
    uvOffsetV: clampOffset(patch.uvOffsetV ?? 0),
  };
}

export function addImportedFinish(
  project: InteriorProject,
  input: {
    name: string;
    dataUrl: string;
    uvScaleMm?: number;
    uvRotationDeg?: number;
    uvOffsetU?: number;
    uvOffsetV?: number;
    color?: string;
    kind?: MaterialEntity["kind"];
    roughness?: number;
    createdBy?: string;
    manufacturerId?: string;
    catalogueFinishId?: string;
    brand?: string;
    productCode?: string;
    sheetWidthMm?: number;
    sheetHeightMm?: number;
    normalMapDataUrl?: string;
    roughnessMapDataUrl?: string;
  },
): { project: InteriorProject; materialId: string } {
  const dataInvalid = validateFinishDataUrl(input.dataUrl);
  if (dataInvalid) throw new Error(dataInvalid);
  if (input.normalMapDataUrl) {
    const invalid = validateFinishDataUrl(input.normalMapDataUrl);
    if (invalid) throw new Error(invalid);
  }
  if (input.roughnessMapDataUrl) {
    const invalid = validateFinishDataUrl(input.roughnessMapDataUrl);
    if (invalid) throw new Error(invalid);
  }
  const existingMapChars = project.materials.reduce((sum, material) => {
    const url = typeof material.extensions?.mapUrl === "string" ? material.extensions.mapUrl : "";
    const normal = typeof material.extensions?.normalMapUrl === "string" ? material.extensions.normalMapUrl : "";
    const rough = typeof material.extensions?.roughnessMapUrl === "string" ? material.extensions.roughnessMapUrl : "";
    return sum + url.length + normal.length + rough.length;
  }, 0);
  const nextMapChars = input.dataUrl.length
    + (input.normalMapDataUrl?.length ?? 0)
    + (input.roughnessMapDataUrl?.length ?? 0);
  if (mapPayloadExceedsProjectLimit(existingMapChars, nextMapChars)) {
    throw new Error("This finish would make the project larger than 25 MB, so it cannot be saved and reopened.");
  }
  const uv = normalizeFinishUv(input);
  const materialId = nextMaterialId(project);
  const material: MaterialEntity = {
    id: materialId,
    name: input.name.replace(/\.[^.]+$/, "").trim() || "Imported finish",
    kind: input.kind ?? "custom",
    color: input.color ?? "#d8d0c4",
    roughness: input.roughness ?? 0.72,
    metalness: 0,
    opacity: 1,
    extensions: {
      mapUrl: input.dataUrl,
      uvScaleMm: uv.uvScaleMm,
      uvRotationDeg: uv.uvRotationDeg,
      uvOffsetU: uv.uvOffsetU,
      uvOffsetV: uv.uvOffsetV,
      createdBy: input.createdBy ?? "import-finish",
      ...(input.manufacturerId ? { manufacturerId: input.manufacturerId } : {}),
      ...(input.catalogueFinishId ? { catalogueFinishId: input.catalogueFinishId } : {}),
      ...(input.brand ? { brand: input.brand } : {}),
      ...(input.productCode ? { productCode: input.productCode } : {}),
      ...(input.sheetWidthMm ? { sheetWidthMm: input.sheetWidthMm } : {}),
      ...(input.sheetHeightMm ? { sheetHeightMm: input.sheetHeightMm } : {}),
      ...(input.normalMapDataUrl ? { normalMapUrl: input.normalMapDataUrl } : {}),
      ...(input.roughnessMapDataUrl ? { roughnessMapUrl: input.roughnessMapDataUrl } : {}),
    },
  };
  const next = { ...project, materials: [...project.materials, material] };
  assertInteriorProjectFileByteLimit(new TextEncoder().encode(serializeInteriorProjectFile(next)).byteLength);
  return { project: next, materialId };
}

export function setFinishUv(
  project: InteriorProject,
  materialId: string,
  patch: FinishUvPatch,
  rebind?: FinishUvRebind,
): InteriorProject {
  const current = project.materials.find((material) => material.id === materialId);
  if (!current) return project;
  const normalized = normalizeFinishUv({
    uvScaleMm: patch.uvScaleMm === undefined
      ? Number(current.extensions?.uvScaleMm) || 1000
      : patch.uvScaleMm,
    uvRotationDeg: patch.uvRotationDeg === undefined
      ? Number(current.extensions?.uvRotationDeg) || 0
      : patch.uvRotationDeg,
    uvOffsetU: patch.uvOffsetU === undefined
      ? Number(current.extensions?.uvOffsetU) || 0
      : patch.uvOffsetU,
    uvOffsetV: patch.uvOffsetV === undefined
      ? Number(current.extensions?.uvOffsetV) || 0
      : patch.uvOffsetV,
  });
  return mutateProjectMaterialCow(project, {
    materialId,
    patch: { extensions: { ...normalized } },
    rebind,
  });
}

export function finishMapUrl(material: MaterialEntity) {
  return typeof material.extensions?.mapUrl === "string" ? material.extensions.mapUrl : null;
}
