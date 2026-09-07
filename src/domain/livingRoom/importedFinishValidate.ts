/** Allowed finish texture MIME types (M4). */
export const FINISH_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export type FinishImageMime = (typeof FINISH_IMAGE_MIME_TYPES)[number];

export function isAllowedFinishImageMime(mime: string): mime is FinishImageMime {
  return (FINISH_IMAGE_MIME_TYPES as readonly string[]).includes(mime);
}

export function finishImageMimeLabel() {
  return "PNG, JPEG, or WebP";
}

/** Synchronous file checks before reading bytes (clear unsupported-type / size warnings). */
export function validateFinishImageFile(file: File, maxBytes: number): string | null {
  if (!file.type || !isAllowedFinishImageMime(file.type)) {
    return `Unsupported file type. Import ${finishImageMimeLabel()}.`;
  }
  if (file.size > maxBytes) {
    return "Finish image is larger than 2 MB.";
  }
  if (file.size <= 0) {
    return "Finish image file is empty.";
  }
  return null;
}

export function validateFinishDataUrl(dataUrl: string): string | null {
  if (!dataUrl.startsWith("data:image/")) {
    return `Unsupported file type. Import ${finishImageMimeLabel()}.`;
  }
  const mime = dataUrl.slice("data:".length, dataUrl.indexOf(";"));
  if (!isAllowedFinishImageMime(mime)) {
    return `Unsupported file type. Import ${finishImageMimeLabel()}.`;
  }
  return null;
}
