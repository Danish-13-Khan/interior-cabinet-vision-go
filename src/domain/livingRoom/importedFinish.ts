import {
  assertInteriorProjectFileByteLimit,
  MAX_INTERIOR_PROJECT_FILE_BYTES,
  serializeInteriorProjectFile,
  type InteriorProject,
  type MaterialEntity,
} from "../interiorProject";

/** Binary image cap so a few imports cannot overflow the 25 MB project file. */
export const MAX_FINISH_BYTES = 2 * 1024 * 1024;
const PROJECT_JSON_HEADROOM_BYTES = 1024 * 1024;

export function mapPayloadExceedsProjectLimit(existingMapChars: number, nextDataUrlLength: number) {
  return existingMapChars + nextDataUrlLength + PROJECT_JSON_HEADROOM_BYTES > MAX_INTERIOR_PROJECT_FILE_BYTES;
}

export function readImageAsDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    return Promise.reject(new Error("Import an image file (PNG, JPEG, or WebP)."));
  }
  if (file.size > MAX_FINISH_BYTES) {
    return Promise.reject(new Error("Finish image is larger than 2 MB."));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  });
}

function nextMaterialId(project: InteriorProject) {
  const used = new Set(project.materials.map((material) => material.id));
  let index = 1;
  while (used.has(`finish-import-${index}`)) index += 1;
  return `finish-import-${index}`;
}

export function addImportedFinish(
  project: InteriorProject,
  input: { name: string; dataUrl: string; uvScaleMm?: number; uvRotationDeg?: number },
): { project: InteriorProject; materialId: string } {
  const existingMapChars = project.materials.reduce((sum, material) => {
    const url = typeof material.extensions?.mapUrl === "string" ? material.extensions.mapUrl : "";
    return sum + url.length;
  }, 0);
  if (mapPayloadExceedsProjectLimit(existingMapChars, input.dataUrl.length)) {
    throw new Error("This finish would make the project larger than 25 MB, so it cannot be saved and reopened.");
  }
  const materialId = nextMaterialId(project);
  const material: MaterialEntity = {
    id: materialId,
    name: input.name.replace(/\.[^.]+$/, "").trim() || "Imported finish",
    kind: "custom",
    color: "#d8d0c4",
    roughness: 0.72,
    metalness: 0,
    opacity: 1,
    extensions: {
      mapUrl: input.dataUrl,
      uvScaleMm: input.uvScaleMm ?? 1000,
      uvRotationDeg: input.uvRotationDeg ?? 0,
      createdBy: "import-finish",
    },
  };
  const next = { ...project, materials: [...project.materials, material] };
  assertInteriorProjectFileByteLimit(new TextEncoder().encode(serializeInteriorProjectFile(next)).byteLength);
  return { project: next, materialId };
}

export function setFinishUv(
  project: InteriorProject,
  materialId: string,
  patch: { uvScaleMm?: number; uvRotationDeg?: number },
): InteriorProject {
  return {
    ...project,
    materials: project.materials.map((material) => {
      if (material.id !== materialId) return material;
      const uvScaleMm = patch.uvScaleMm === undefined
        ? material.extensions?.uvScaleMm
        : Math.max(120, Math.min(8000, Math.round(patch.uvScaleMm)));
      const uvRotationDeg = patch.uvRotationDeg === undefined
        ? material.extensions?.uvRotationDeg
        : ((Math.round(patch.uvRotationDeg) % 360) + 360) % 360;
      return {
        ...material,
        extensions: { ...material.extensions, uvScaleMm, uvRotationDeg },
      };
    }),
  };
}

export function finishMapUrl(material: MaterialEntity) {
  return typeof material.extensions?.mapUrl === "string" ? material.extensions.mapUrl : null;
}
