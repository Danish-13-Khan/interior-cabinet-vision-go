import type { MaterialEntity, MaterialKind } from "../interiorProject";

export type MaterialShade = {
  id: string;
  label: string;
  color: string;
};

/** Fixed shade groups per material family (M3) — not procedural ramps. */
const SHADE_GROUPS: Partial<Record<MaterialKind, readonly MaterialShade[]>> = {
  paint: [
    { id: "paint-warm-white", label: "Warm white", color: "#ebe6dc" },
    { id: "paint-soft-white", label: "Soft white", color: "#f5f2eb" },
    { id: "paint-greige", label: "Greige", color: "#d4cdc3" },
    { id: "paint-sage", label: "Sage", color: "#a8b5a0" },
    { id: "paint-slate", label: "Slate", color: "#6d7580" },
    { id: "paint-ink", label: "Ink", color: "#2f343a" },
  ],
  wood: [
    { id: "wood-oak", label: "Natural oak", color: "#a98262" },
    { id: "wood-honey", label: "Honey", color: "#c49a6c" },
    { id: "wood-walnut", label: "Walnut", color: "#4b3328" },
    { id: "wood-espresso", label: "Espresso", color: "#3a2a22" },
    { id: "wood-ash", label: "Ash", color: "#cfc6b8" },
  ],
  fabric: [
    { id: "fabric-oatmeal", label: "Oatmeal", color: "#d2c3ae" },
    { id: "fabric-linen", label: "Linen", color: "#e4dccf" },
    { id: "fabric-olive", label: "Olive", color: "#6a6e52" },
    { id: "fabric-clay", label: "Clay", color: "#b08978" },
    { id: "fabric-charcoal", label: "Charcoal", color: "#4a4d4c" },
  ],
  metal: [
    { id: "metal-charcoal", label: "Charcoal", color: "#2d302f" },
    { id: "metal-steel", label: "Steel", color: "#8a9096" },
    { id: "metal-brass", label: "Brass", color: "#b08d57" },
    { id: "metal-black", label: "Black", color: "#1a1a1a" },
  ],
  stone: [
    { id: "stone-warm", label: "Warm stone", color: "#cfc4b4" },
    { id: "stone-sand", label: "Sand", color: "#d9d0c2" },
    { id: "stone-graphite", label: "Graphite", color: "#6e6a66" },
  ],
};

const FALLBACK_SHADES: readonly MaterialShade[] = [
  { id: "neutral-light", label: "Light", color: "#f2efe9" },
  { id: "neutral-mid", label: "Mid", color: "#a8a49c" },
  { id: "neutral-dark", label: "Dark", color: "#3d3a36" },
];

export function shadeGroupForKind(kind: MaterialKind): readonly MaterialShade[] {
  return SHADE_GROUPS[kind] ?? FALLBACK_SHADES;
}

export function shadeGroupForMaterial(material: MaterialEntity): readonly MaterialShade[] {
  return shadeGroupForKind(material.kind);
}
