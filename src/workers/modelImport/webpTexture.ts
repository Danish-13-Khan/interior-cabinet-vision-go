import type { Document } from "@gltf-transform/core";
import { EXTTextureWebP } from "@gltf-transform/extensions";

/** Declare EXT_texture_webp only when a texture is actually stored as WebP. */
export function declareWebpIfNeeded(document: Document, mime: string): void {
  if (mime !== "image/webp") return;
  const used = document.getRoot().listExtensionsUsed().some((extension) => extension.extensionName === "EXT_texture_webp");
  if (used) return;
  document.createExtension(EXTTextureWebP).setRequired(true);
}

/** Without WebP, only JPEG sources stay JPEG. PNG (and WebP) sources may carry alpha, so they become PNG. */
export function fallbackTextureMime(sourceMime: string): "image/png" | "image/jpeg" {
  const source = sourceMime.toLowerCase();
  return source === "image/jpeg" || source === "image/jpg" ? "image/jpeg" : "image/png";
}

export function storedTextureMime(encodedType: string, webpWanted: boolean, sourceMime = "image/jpeg"): string {
  if (webpWanted && encodedType === "image/webp") return "image/webp";
  if (encodedType === "image/png" || encodedType === "image/jpeg") return encodedType;
  return fallbackTextureMime(sourceMime);
}
