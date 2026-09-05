export type MaterialPreset = {
  id: string;
  color: string;
  roughness: number;
};

export const DEFAULT_MATERIALS: Record<string, MaterialPreset> = {
  "wall-exterior": { id: "wall-exterior", color: "#b8c0c8", roughness: 0.85 },
  "wall-interior": { id: "wall-interior", color: "#dfe4e8", roughness: 0.75 },
  "floor-default": { id: "floor-default", color: "#3d4a42", roughness: 0.9 },
  "floor-kitchen": { id: "floor-kitchen", color: "#4a4035", roughness: 0.7 },
  "floor-bath": { id: "floor-bath", color: "#3a4a52", roughness: 0.55 },
  "ceiling-default": { id: "ceiling-default", color: "#eceff2", roughness: 0.95 },
  door: { id: "door", color: "#c9a227", roughness: 0.55 },
  window: { id: "window", color: "#6db3c7", roughness: 0.35 },
  skirting: { id: "skirting", color: "#8a9098", roughness: 0.6 },
  frame: { id: "frame", color: "#6a727a", roughness: 0.5 },
  fixture: { id: "fixture", color: "#9a7b5a", roughness: 0.65 },
};

/** Phase 13: resolve material preset without mutating geometry. */
export function resolveMaterial(materialId?: string): MaterialPreset {
  if (materialId && DEFAULT_MATERIALS[materialId]) return DEFAULT_MATERIALS[materialId];
  return DEFAULT_MATERIALS["wall-interior"];
}

export function roomMaterialHints(
  rooms: Array<{ id: string; name?: string }>,
): Array<{ id: string; target: "wall" | "floor" | "ceiling"; label: string; confidence: "low" | "medium" | "high" }> {
  const out: Array<{
    id: string;
    target: "wall" | "floor" | "ceiling";
    label: string;
    confidence: "low" | "medium" | "high";
  }> = [];
  for (const r of rooms) {
    const n = (r.name ?? "").toLowerCase();
    if (n.includes("kitchen")) {
      out.push({ id: `hint-${r.id}-floor`, target: "floor", label: "tile-kitchen", confidence: "medium" });
    } else if (n.includes("bath")) {
      out.push({ id: `hint-${r.id}-floor`, target: "floor", label: "tile-bath", confidence: "medium" });
    } else {
      out.push({ id: `hint-${r.id}-floor`, target: "floor", label: "floor-default", confidence: "low" });
    }
  }
  return out;
}

export function lightingForPreset(preset: "studio" | "warm" | "cool") {
  if (preset === "warm") return { ambient: 0.45, key: 0.95, color: "#ffd9b0" as const };
  if (preset === "cool") return { ambient: 0.5, key: 1.05, color: "#c8d8ff" as const };
  return { ambient: 0.55, key: 1.1, color: "#ffffff" as const };
}
