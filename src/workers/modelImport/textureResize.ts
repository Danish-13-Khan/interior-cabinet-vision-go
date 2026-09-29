import type { Document } from "@gltf-transform/core";

export const MAX_TEXTURE_PX = 2048;

function scaledSize(width: number, height: number, maxPx: number): [number, number] | null {
  const longest = Math.max(width, height);
  if (longest <= maxPx) return null;
  const scale = maxPx / longest;
  return [Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale))];
}

async function encodeBitmap(bitmap: ImageBitmap, width: number, height: number, webp: boolean): Promise<Blob | null> {
  if (typeof OffscreenCanvas === "undefined") return null;
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(bitmap, 0, 0, width, height);
  const type = webp ? "image/webp" : "image/jpeg";
  return canvas.convertToBlob({ type, quality: 0.85 });
}

/** Resize textures to 2048px. WebP when the canvas can encode it, otherwise JPEG. No-op without OffscreenCanvas. */
export async function resizeDocumentTextures(document: Document, webp: boolean, maxPx = MAX_TEXTURE_PX): Promise<number> {
  if (typeof createImageBitmap !== "function") return 0;
  let resized = 0;
  for (const texture of document.getRoot().listTextures()) {
    const image = texture.getImage();
    const size = texture.getSize();
    if (!image || !size) continue;
    const next = scaledSize(size[0], size[1], maxPx);
    if (!next) continue;
    const bitmap = await createImageBitmap(new Blob([image], { type: texture.getMimeType() }));
    const encoded = await encodeBitmap(bitmap, next[0], next[1], webp);
    bitmap.close?.();
    if (!encoded) continue;
    texture.setImage(new Uint8Array(await encoded.arrayBuffer()));
    texture.setMimeType(encoded.type || (webp ? "image/webp" : "image/jpeg"));
    resized += 1;
  }
  return resized;
}
