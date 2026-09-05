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
  "ceiling-default": { id: "ceiling-default", color: "#eceff2", roughness: 0.95 },
  door: { id: "door", color: "#c9a227", roughness: 0.55 },
  window: { id: "window", color: "#6db3c7", roughness: 0.35 },
};

/** Phase 13: resolve material preset without mutating geometry. */
export function resolveMaterial(materialId?: string): MaterialPreset {
  if (materialId && DEFAULT_MATERIALS[materialId]) return DEFAULT_MATERIALS[materialId];
  return DEFAULT_MATERIALS["wall-interior"];
}
