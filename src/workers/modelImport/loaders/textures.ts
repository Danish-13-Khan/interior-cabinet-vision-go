/** ImageBitmap textures for a worker. Phase 3 loaders call this instead of TextureLoader. */
export async function decodeTexture(bytes: ArrayBuffer, mime: string): Promise<ImageBitmap | null> {
  if (typeof createImageBitmap !== "function") return null;
  const blob = new Blob([bytes], { type: mime || "image/png" });
  try {
    return await createImageBitmap(blob, { imageOrientation: "flipY" });
  } catch {
    return createImageBitmap(blob);
  }
}
