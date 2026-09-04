import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { hashFile } from "./fileHash.mjs";

const OVERRIDE_FILES = [
  "overrides.data.json",
  "cabinetPropOverrides.data.json",
  "curatedLiving.data.json",
  "curatedBedroom.data.json",
  "curatedKitchenBathroom.data.json",
  "curatedOfficeUtility.data.json",
];

const SLOT_FILES = [
  "curatedSlotsA.data.json",
  "curatedSlotsB.data.json",
  "curatedSlotsC.data.json",
  "proofMaterialSlots.data.json",
];

const MATERIAL_FILES = [
  "seedMaterials.data.json",
  "seedMaterialsPhase3.data.json",
  "seedMaterialsPhase4.data.json",
];

const TEMPLATE_FILES = [
  "livingRoom.data.json",
  "emptyRoom.data.json",
  "straightKitchen.data.json",
  "lKitchen.data.json",
  "bedroom.data.json",
  "bathroom.data.json",
];

/** Thumbnail files registered into the catalog manifest (id → public objectKey). */
const TEMPLATE_THUMBNAILS = [
  { id: "image:template:living-room:v1", objectKey: "catalog/templates/living-room-v1.png" },
  { id: "image:template:empty-room:v1", objectKey: "catalog/templates/empty-room-v1.png" },
  { id: "image:template:straight-kitchen:v1", objectKey: "catalog/templates/straight-kitchen-v1.png" },
  { id: "image:template:l-kitchen:v1", objectKey: "catalog/templates/l-kitchen-v1.png" },
  { id: "image:template:bedroom:v1", objectKey: "catalog/templates/bedroom-v1.png" },
  { id: "image:template:bathroom:v1", objectKey: "catalog/templates/bathroom-v1.png" },
];

export function loadCatalogSources({ kenneyDataDir, materialsDir, templatesDir, root }) {
  const overrides = new Map(
    OVERRIDE_FILES.flatMap((name) =>
      JSON.parse(readFileSync(join(kenneyDataDir, name), "utf8")),
    ).map((entry) => [entry.stem, entry]),
  );
  const proofSlots = SLOT_FILES.reduce((acc, name) => ({
    ...acc,
    ...JSON.parse(readFileSync(join(kenneyDataDir, name), "utf8")),
  }), {});
  const materials = MATERIAL_FILES.flatMap((name) =>
    JSON.parse(readFileSync(join(materialsDir, name), "utf8")),
  );
  const templates = TEMPLATE_FILES.map((name) =>
    JSON.parse(readFileSync(join(templatesDir, name), "utf8")),
  );
  return { overrides, proofSlots, materials, templates, root };
}

export function pushTemplateThumbnail(files, root) {
  for (const thumb of TEMPLATE_THUMBNAILS) {
    const abs = join(root, "public", thumb.objectKey);
    if (!existsSync(abs)) throw new Error(`Missing template thumbnail at ${thumb.objectKey}`);
    const { byteSize, contentHash } = hashFile(abs);
    files.push({
      id: thumb.id,
      kind: "image",
      role: "template-thumbnail",
      objectKey: thumb.objectKey,
      mimeType: "image/png",
      byteSize,
      contentHash,
    });
  }
}
