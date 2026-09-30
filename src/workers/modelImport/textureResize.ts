import type { Document } from "@gltf-transform/core";
import { declareWebpIfNeeded, fallbackTextureMime, storedTextureMime } from "./webpTexture";

export const MAX_TEXTURE_PX = 2048;

function scaledSize(width: number, height: number, maxPx: number): [number, number] | null {
  const longest = Math.max(width, height);
  if (longest <= maxPx) return null;
  const scale = maxPx / longest;
  return [Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale))];
}

async function encodeBitmap(
  bitmap: ImageBitmap,
  size: [number, number],
  webp: boolean,
  sourceMime: string,
): Promise<Blob | null> {
  const [width, height] = size;
  if (typeof OffscreenCanvas === "undefined") return null;
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(bitmap, 0, 0, width, height);
  const fallback = fallbackTextureMime(sourceMime);
  const blob = await canvas.convertToBlob({ type: webp ? "image/webp" : fallback, quality: 0.85 });
  if (webp && blob.type !== "image/webp") return canvas.convertToBlob({ type: fallback, quality: 0.85 });
  return blob;
}

/** Resize textures to 2048px. WebP only when the blob is actually WebP; otherwise PNG keeps alpha, JPEG stays JPEG. */
export async function resizeDocumentTextures(document: Document, webp: boolean, maxPx = MAX_TEXTURE_PX): Promise<number> {
  if (typeof createImageBitmap !== "function") return 0;
  let resized = 0;
  for (const texture of document.getRoot().listTextures()) {
    const image = texture.getImage();
    const size = texture.getSize();
    if (!image || !size) continue;
    const next = scaledSize(size[0], size[1], maxPx);
    if (!next) continue;
    const sourceMime = texture.getMimeType();
    const bitmap = await createImageBitmap(new Blob([image], { type: sourceMime }));
    const encoded = await encodeBitmap(bitmap, next, webp, sourceMime);
    bitmap.close?.();
    if (!encoded) continue;
    const mime = storedTextureMime(encoded.type, webp, sourceMime);
    texture.setImage(new Uint8Array(await encoded.arrayBuffer()));
    texture.setMimeType(mime);
    declareWebpIfNeeded(document, mime);
    resized += 1;
  }
  return resized;
}
