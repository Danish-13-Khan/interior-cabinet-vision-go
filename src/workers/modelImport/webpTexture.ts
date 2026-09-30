import type { Document } from "@gltf-transform/core";
import { EXTTextureWebP } from "@gltf-transform/extensions";

/** Declare EXT_texture_webp only when a texture is actually stored as WebP. */
export function declareWebpIfNeeded(document: Document, mime: string): void {
  if (mime !== "image/webp") return;
  const used = document.getRoot().listExtensionsUsed().some((extension) => extension.extensionName === "EXT_texture_webp");
  if (used) return;
  document.createExtension(EXTTextureWebP).setRequired(true);
}

export function storedTextureMime(encodedType: string, webpWanted: boolean): string {
  if (webpWanted && encodedType === "image/webp") return "image/webp";
  if (encodedType === "image/png") return "image/png";
  return "image/jpeg";
}
