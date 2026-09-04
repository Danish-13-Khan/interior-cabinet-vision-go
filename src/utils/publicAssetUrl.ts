/** Prefix a `public/` asset path with Vite's base URL (GitHub Pages repo path). */
export function publicAssetUrl(
  assetKey: string,
  baseUrl: string = import.meta.env?.BASE_URL || "/",
): string {
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return `${base}${assetKey.replace(/^\/+/, "")}`;
}
