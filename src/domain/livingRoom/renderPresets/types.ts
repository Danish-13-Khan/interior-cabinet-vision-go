import type { RenderQuality } from "../../interiorProject";
import type { RenderMode } from "../renderAssetContracts";

/** Full selectable render preset behavior (compiled only; ids persist on project JSON). */
export type RenderPresetBehavior = {
  id: RenderQuality;
  name: string;
  description: string;
  /** Preferred R3F path for this preset. */
  renderMode: RenderMode;
  widthPx: number;
  heightPx: number;
  pixelRatio: number;
  shadowMapSize: number;
  contactShadowResolution: number;
  environmentResolution: number;
  shadowRadius: number;
  renderScale: number;
  maximumRenderPixels: number;
  textureDetail: "low" | "high";
  /** When false, exports force opaque backgrounds. */
  allowTransparentBackground: boolean;
  /** Interactive Model View may offer this preset. */
  modelViewSafe: boolean;
};

export type RenderPresetId = RenderQuality;

export const RENDER_PRESET_IDS = [
  "draft",
  "standard",
  "presentation",
  "client-preview",
] as const satisfies readonly RenderPresetId[];

export function isRenderPresetId(value: unknown): value is RenderPresetId {
  return RENDER_PRESET_IDS.includes(value as RenderPresetId);
}
