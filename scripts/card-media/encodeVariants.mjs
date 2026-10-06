import { createCanvas, loadImage } from "@napi-rs/canvas";

export const OUT_W800 = 800;
export const OUT_H800 = 600;
export const OUT_W1600 = 1600;
export const OUT_H1600 = 1200;
export const WEBP_QUALITY = 92;

/** Encode 1600×1200 PNG to WebP variants (1:1, no stretch). */
export async function encodePosterVariants(pngBuffer) {
  const image = await loadImage(pngBuffer);
  if (image.width !== OUT_W1600 || image.height !== OUT_H1600) {
    throw new Error(`PNG ${image.width}×${image.height}, expected ${OUT_W1600}×${OUT_H1600}`);
  }
  const master = createCanvas(OUT_W1600, OUT_H1600);
  const masterCtx = master.getContext("2d");
  masterCtx.drawImage(image, 0, 0);
  const thumb = createCanvas(OUT_W800, OUT_H800);
  const thumbCtx = thumb.getContext("2d");
  thumbCtx.drawImage(image, 0, 0, OUT_W800, OUT_H800);
  return {
    w1600: await master.encode("webp", WEBP_QUALITY),
    w800: await thumb.encode("webp", WEBP_QUALITY),
    exposure: masterCtx.getImageData(0, 0, OUT_W1600, OUT_H1600).data,
  };
}
