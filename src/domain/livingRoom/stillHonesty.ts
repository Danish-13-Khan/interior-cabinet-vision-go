import type { PresetHonestyDescription } from "./presetHonesty";

/** K3: Hybrid still tier is distinct from Draft WebGL and Client Preview hero export. */
export function describeStillHonesty(): PresetHonestyDescription {
  return {
    qualityId: "client-preview",
    qualityName: "Hybrid Still",
    mode: "hero",
    role: "still",
    headline: "Hybrid Still",
    subline: "Faithful enhance · reviewed before package · not the live viewport",
    shortBadge: "STILL · FAITHFUL ENHANCE",
  };
}
