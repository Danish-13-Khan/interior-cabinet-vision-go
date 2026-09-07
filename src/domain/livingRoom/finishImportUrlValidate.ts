/** Validate a direct finish image URL before fetch (M6.2). */
export function normalizeFinishImageUrl(raw: string): string {
  return raw.trim();
}

export function validateFinishImageUrl(raw: string): string | null {
  const trimmed = normalizeFinishImageUrl(raw);
  if (!trimmed) return "Paste a direct image URL (PNG, JPEG, or WebP).";
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return "That is not a valid URL.";
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return "Use an http:// or https:// image URL.";
  }
  return null;
}

export function fileNameFromFinishImageUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const base = path.split("/").filter(Boolean).pop() ?? "";
    if (/\.(png|jpe?g|webp)$/i.test(base)) return decodeURIComponent(base);
  } catch {
    /* fall through */
  }
  return "imported-finish.png";
}

export function mimeFromContentType(header: string | null): string | null {
  if (!header) return null;
  const mime = header.split(";")[0]?.trim().toLowerCase() ?? "";
  return mime || null;
}
