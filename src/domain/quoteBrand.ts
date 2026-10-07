/** Studio identity printed on the proposal (roadmap D5); stored in quote settings, never frozen with a quote. */

export type QuoteBrandSettings = {
  brandName: string;
  brandContact: string;
  /** PNG or JPEG data URL under BRAND_LOGO_MAX_BYTES, else empty. */
  brandLogoDataUrl: string;
};

export const DEFAULT_QUOTE_BRAND: QuoteBrandSettings = {
  brandName: "Cabinet Studio",
  brandContact: "",
  brandLogoDataUrl: "",
};

export const BRAND_LOGO_MAX_BYTES = 200_000;
const BRAND_LOGO_PATTERN = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/]+=*)$/;

/** jsPDF embeds raster logos only, so SVG and oversized uploads are dropped, not stored. */
export function clampBrandLogo(value: unknown): string {
  const text = String(value ?? "").trim();
  const match = BRAND_LOGO_PATTERN.exec(text);
  if (!match) return "";
  const payload = match[2] ?? "";
  const padding = payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0;
  const bytes = Math.floor((payload.length * 3) / 4) - padding;
  return bytes > 0 && bytes <= BRAND_LOGO_MAX_BYTES ? text : "";
}

export function clampQuoteBrand(seed: Partial<QuoteBrandSettings>): QuoteBrandSettings {
  return {
    brandName: String(seed.brandName ?? DEFAULT_QUOTE_BRAND.brandName).trim().slice(0, 60)
      || DEFAULT_QUOTE_BRAND.brandName,
    brandContact: String(seed.brandContact ?? "").trim().slice(0, 120),
    brandLogoDataUrl: clampBrandLogo(seed.brandLogoDataUrl),
  };
}
