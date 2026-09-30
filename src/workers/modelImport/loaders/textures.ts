/** ImageBitmap textures for a worker. Phase 3 loaders call this instead of TextureLoader. */
export async function decodeTexture(bytes: ArrayBuffer, mime: string, flip = true): Promise<ImageBitmap | null> {
  if (typeof createImageBitmap !== "function") return null;
  const blob = new Blob([bytes], { type: mime || "image/png" });
  try {
    if (!flip) return await createImageBitmap(blob);
    return await createImageBitmap(blob, { imageOrientation: "flipY" });
  } catch {
    try { return await createImageBitmap(blob); } catch { return null; }
  }
}
