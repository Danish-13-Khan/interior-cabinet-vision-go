/** Longest edge sent to Gemini — large scans are the main latency cost. */
export const VISION_MAX_EDGE_PX = 1600;
const VISION_JPEG_QUALITY = 0.82;

function isRasterMime(type: string) {
  return type === "image/png" || type === "image/webp" || type === "image/jpeg";
}

/**
 * Downscale + JPEG re-encode for Vision.
 * Also strips EXIF/camera metadata (canvas encode has no EXIF).
 */
export async function prepareVisionImage(file: File): Promise<File> {
  if (!isRasterMime(file.type)) return file;

  const bitmap = await createImageBitmap(file);
  try {
    const longest = Math.max(bitmap.width, bitmap.height);
    const scale = longest > VISION_MAX_EDGE_PX ? VISION_MAX_EDGE_PX / longest : 1;
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not open canvas to prepare Vision image.");
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Failed to encode Vision image."))),
        "image/jpeg",
        VISION_JPEG_QUALITY,
      );
    });
    const base = file.name.replace(/\.[^.]+$/, "") || "floorplan";
    return new File([blob], `${base}-vision.jpg`, { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
}

/** @deprecated Prefer prepareVisionImage — kept for privacy wording / callers. */
export async function stripImageExif(file: File): Promise<File> {
  return prepareVisionImage(file);
}
