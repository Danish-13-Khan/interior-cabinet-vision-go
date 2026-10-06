/**
 * Point core template thumbnailId entries at captured v2 WebP files.
 * Run automatically at the end of media:cards when catalog posters exist.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { hashFile } from "../catalog/lib/fileHash.mjs";
import { CATALOG_TARGETS } from "./targets.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const catalogPaths = [
  join(root, "public/catalog/builtin-catalog.v1.json"),
  join(root, "src/domain/catalog/data/builtin-catalog.v1.json"),
];

export function patchCatalogTemplateThumbnails() {
  for (const catalogPath of catalogPaths) {
    const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
    for (const item of CATALOG_TARGETS) {
      const objectKey = `catalog/templates/${item.slug}-v2.webp`;
      const abs = join(root, "public", objectKey);
      if (!existsSync(abs)) continue;
      const fileId = `image:template:${item.slug}:v2`;
      const { byteSize, contentHash } = hashFile(abs);
      const files = catalog.files ?? [];
      const existing = files.find((file) => file.id === fileId);
      const record = {
        id: fileId,
        kind: "image",
        role: "template-thumbnail",
        objectKey,
        mimeType: "image/webp",
        byteSize,
        contentHash,
      };
      if (existing) Object.assign(existing, record);
      else files.push(record);
      catalog.files = files;
      const template = catalog.templates?.find((entry) => entry.id === item.id);
      if (template?.images) template.images.thumbnailId = fileId;
    }
    writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  }
}
