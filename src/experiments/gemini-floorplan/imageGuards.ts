const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"]);
export const MAX_FLOORPLAN_BYTES = 8 * 1024 * 1024;

export type ImageGuardResult =
  | { ok: true; mimeType: string }
  | { ok: false; error: string };

export function guardFloorplanImage(file: File): ImageGuardResult {
  const mime = (file.type || "").toLowerCase();
  if (!ALLOWED.has(mime)) {
    return { ok: false, error: "Use PNG, JPEG, or WebP only." };
  }
  if (file.size <= 0) {
    return { ok: false, error: "File is empty." };
  }
  if (file.size > MAX_FLOORPLAN_BYTES) {
    return { ok: false, error: "Image must be 8 MB or smaller." };
  }
  return { ok: true, mimeType: mime };
}

export async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
