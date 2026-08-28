import type { RenderQuality } from "../interiorProject";
import type { RenderMode } from "./renderAssetContracts";
import { getRenderPresetBehavior } from "./renderPresets";

export type PresetHonestyRole = "working" | "balanced" | "client" | "still";

export type PresetHonestyDescription = {
  qualityId: RenderQuality;
  qualityName: string;
  mode: RenderMode;
  role: PresetHonestyRole;
  headline: string;
  subline: string;
  shortBadge: string;
};

function roleForQuality(quality: RenderQuality): PresetHonestyRole {
  if (quality === "draft") return "working";
  if (quality === "client-preview" || quality === "presentation") return "client";
  return "balanced";
}

/** UI copy so Draft vs Client Preview read as different products. */
export function describePresetHonesty(
  quality: RenderQuality,
  mode: RenderMode,
): PresetHonestyDescription {
  const behavior = getRenderPresetBehavior(quality);
  const role = roleForQuality(quality);
  const headline = role === "working"
    ? "Working Draft"
    : role === "client"
      ? "Client Delivery"
      : "Balanced Preview";
  const subline = mode === "preview"
    ? "Interactive preview · not the client export"
    : role === "client"
      ? "Hero export path · client package quality"
      : "Hero export path · intermediate quality";
  return {
    qualityId: behavior.id,
    qualityName: behavior.name,
    mode,
    role,
    headline,
    subline,
    shortBadge: `${behavior.name.toUpperCase()} · ${mode === "preview" ? "PREVIEW" : "HERO"}`,
  };
}
