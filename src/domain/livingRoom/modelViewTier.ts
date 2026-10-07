import type { RenderQuality } from "../interiorProject";

/**
 * Draft is the fast authoring tier; Standard, Client Preview and Presentation share
 * the rich Model View path (lighting, shadows, GLB casters, material detail).
 * The stills scripts pin client-preview, so it must read exactly like Standard.
 */
export function isRichModelViewQuality(quality: RenderQuality | null | undefined): boolean {
  return quality != null && quality !== "draft";
}
