/**
 * Rewrite the built-in catalog after new card stills land, so their hashes and
 * sizes stay current. The catalog generator is the single source of truth (the
 * v2 thumbnails are declared in scripts/catalog/lib/catalogSources.mjs), so this
 * regenerates the manifest the same way `catalog:generate` does, and
 * `catalog:verify` in CI keeps matching.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateKenneyManifest } from "../catalog/generate-kenney-manifest.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const catalogPaths = [
  join(root, "public/catalog/builtin-catalog.v1.json"),
  join(root, "src/domain/catalog/data/builtin-catalog.v1.json"),
];

export async function patchCatalogTemplateThumbnails() {
  const body = `${JSON.stringify(await generateKenneyManifest(), null, 2)}\n`;
  for (const catalogPath of catalogPaths) writeFileSync(catalogPath, body);
}
