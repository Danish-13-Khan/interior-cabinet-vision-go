/**
 * Merge Kenney GLB discovery + human overrides → public/catalog/builtin-catalog.v1.json
 * Run: node scripts/catalog/generate-kenney-manifest.mjs
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { classifyKenneyStem } from "./lib/classification.mjs";
import { loadCatalogSources, pushTemplateThumbnail } from "./lib/catalogSources.mjs";
import { hashFile } from "./lib/fileHash.mjs";
import {
  displayNameFromStem,
  kenneyIsoImageId,
  kenneyItemId,
  kenneyModelId,
  kenneySideImageId,
} from "./lib/kenneyIds.mjs";
import { inspectGlb } from "./inspect-glb.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const glbDir = join(root, "public/models/kenney-furniture/models_glb");
const isoDir = join(root, "public/models/kenney-furniture/renders_isometric");
const sideDir = join(root, "public/models/kenney-furniture/renders_side");
const outPath = join(root, "public/catalog/builtin-catalog.v1.json");
const CATALOG_VERSION = "2026.09.8";
const GENERATED_AT = "2026-09-04T13:45:00.000Z";
const PACK_PREFIX = "models/kenney-furniture";

function metersToMm(bounds) {
  return {
    width: Math.max(1, Math.round(bounds.width * 1000)),
    height: Math.max(1, Math.round(bounds.height * 1000)),
    depth: Math.max(1, Math.round(bounds.depth * 1000)),
  };
}

function pushImageFile(files, absolutePath, objectKey, id, role) {
  if (!existsSync(absolutePath)) return null;
  const { byteSize, contentHash } = hashFile(absolutePath);
  files.push({
    id, kind: "image", role, objectKey, mimeType: "image/png", byteSize, contentHash,
  });
  return id;
}

async function buildItem(stem, overrides, proofSlots) {
  const glbObjectKey = `${PACK_PREFIX}/models_glb/${stem}.glb`;
  const glbAbs = join(root, "public", glbObjectKey);
  const inspection = await inspectGlb(glbAbs);
  const { byteSize, contentHash } = hashFile(glbAbs);
  const modelId = kenneyModelId(stem);
  const classified = classifyKenneyStem(stem);
  const override = overrides.get(stem) ?? {};
  const angle = override.thumbnailAngle ?? "NE";
  const files = [{
    id: modelId, kind: "model", objectKey: glbObjectKey, mimeType: "model/gltf-binary",
    byteSize, contentHash, nativeBoundsM: inspection.nativeBoundsM,
    primitiveCount: inspection.primitiveCount, triangleCount: inspection.triangleCount,
    originalMaterialNames: inspection.originalMaterialNames, warnings: inspection.warnings,
  }];
  const thumbId = pushImageFile(
    files, join(isoDir, `${stem}_${angle}.png`),
    `${PACK_PREFIX}/renders_isometric/${stem}_${angle}.png`,
    kenneyIsoImageId(stem, angle), "thumbnail",
  );
  const sideId = pushImageFile(
    files, join(sideDir, `${stem}.png`),
    `${PACK_PREFIX}/renders_side/${stem}.png`,
    kenneySideImageId(stem), "preview",
  );
  const lifecycle = override.lifecycle ?? "active";
  const item = {
    id: kenneyItemId(stem), version: 1,
    name: override.name ?? displayNameFromStem(stem),
    category: override.category ?? classified.category,
    subcategory: override.subcategory ?? classified.subcategory,
    tags: override.tags ?? classified.tags,
    placement: override.placement ?? classified.placement,
    dimensionsMm: override.dimensionsMm ?? metersToMm(inspection.nativeBoundsM),
    modelAssetId: modelId,
    images: {
      ...(thumbId ? { thumbnailId: thumbId } : {}),
      ...(sideId ? { galleryIds: [sideId] } : {}),
    },
    materialSlots: override.materialSlots ?? proofSlots[stem] ?? {},
    lifecycle,
    visibility: override.visibility ?? { objectBrowser: false, templateEligible: false },
    source: { pack: "kenney-furniture", licenseId: "cc0-1.0" },
  };
  return { item, files };
}

export async function generateKenneyManifest() {
  const sources = loadCatalogSources({
    kenneyDataDir: join(root, "src/domain/catalog/kenney"),
    materialsDir: join(root, "src/domain/catalog/materials"),
    templatesDir: join(root, "src/domain/catalog/templates"),
    root,
  });
  const stems = readdirSync(glbDir)
    .filter((name) => name.endsWith(".glb"))
    .map((name) => name.replace(/\.glb$/, ""))
    .sort();
  const files = [];
  const items = [];
  for (const stem of stems) {
    const built = await buildItem(stem, sources.overrides, sources.proofSlots);
    files.push(...built.files);
    items.push(built.item);
  }
  pushTemplateThumbnail(files, root);
  return {
    schemaVersion: 1,
    catalogVersion: CATALOG_VERSION,
    generatedAt: GENERATED_AT,
    licenses: [{
      id: "cc0-1.0",
      name: "Creative Commons CC0 1.0",
      sourceUrl: "https://kenney.nl/assets/furniture-kit",
      attributionRequired: false,
      licenseFileObjectKey: `${PACK_PREFIX}/License_Kenney.txt`,
    }],
    files,
    materials: sources.materials,
    items,
    templates: sources.templates,
  };
}

const isMain =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const manifest = await generateKenneyManifest();
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(
    `[catalog] wrote ${manifest.items.length} items, ${manifest.files.length} files, ${manifest.templates.length} templates → ${outPath}`,
  );
}
