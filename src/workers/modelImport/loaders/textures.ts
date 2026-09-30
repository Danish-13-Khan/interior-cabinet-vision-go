export type DecodedTexture = { bitmap: ImageBitmap; flipped: boolean };

/**
 * ImageBitmap textures for a worker. `flipped` is true only when the flipY decode was accepted.
 * Some engines drop `imageOrientation` without throwing, so callers that need certainty pass `flip = false`.
 */
export async function decodeTexture(bytes: ArrayBuffer, mime: string, flip = false): Promise<DecodedTexture | null> {
  if (typeof createImageBitmap !== "function") return null;
  const blob = new Blob([bytes], { type: mime || "image/png" });
  if (flip) {
    try { return { bitmap: await createImageBitmap(blob, { imageOrientation: "flipY" }), flipped: true }; } catch { /* decode upright below */ }
  }
  try { return { bitmap: await createImageBitmap(blob), flipped: false }; } catch { return null; }
}
