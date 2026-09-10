/** Viewport-local notice when curated textures fall back to solid colour (Step 5). */

export const MATERIAL_TEXTURE_FALLBACK_EVENT = "cabinet-studio-material-texture-fallback";

export function reportMaterialTextureFallback(detail?: { materialId?: string }) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(MATERIAL_TEXTURE_FALLBACK_EVENT, { detail }));
}
