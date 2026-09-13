import type { InteriorProject, MaterialKind } from "../interiorProject";

export type SurfaceFinish = { id: string; label: string; kind: MaterialKind; roughness: number; metalness: number; clearcoat: number; coatRoughness: number };
export const SURFACE_FINISHES: readonly SurfaceFinish[] = [
  { id: "matte-laminate", label: "Matte laminate", kind: "laminate", roughness: 0.75, metalness: 0, clearcoat: 0, coatRoughness: 0.7 },
  { id: "gloss-laminate", label: "Gloss laminate", kind: "laminate", roughness: 0.18, metalness: 0, clearcoat: 0.85, coatRoughness: 0.12 },
  { id: "acrylic-gloss", label: "High-gloss acrylic", kind: "acrylic", roughness: 0.08, metalness: 0, clearcoat: 1, coatRoughness: 0.05 },
  { id: "acrylic-matt", label: "Matt acrylic", kind: "acrylic", roughness: 0.45, metalness: 0, clearcoat: 0.35, coatRoughness: 0.4 },
  { id: "natural-wood", label: "Natural wood", kind: "wood", roughness: 0.7, metalness: 0, clearcoat: 0.04, coatRoughness: 0.65 },
  { id: "polished-veneer", label: "Polished veneer", kind: "wood", roughness: 0.32, metalness: 0, clearcoat: 0.5, coatRoughness: 0.25 },
  { id: "wall-paint", label: "Matt wall / ceiling paint", kind: "paint", roughness: 0.9, metalness: 0, clearcoat: 0, coatRoughness: 0.9 },
  { id: "wallpaper", label: "Wallpaper", kind: "wallpaper", roughness: 0.82, metalness: 0, clearcoat: 0, coatRoughness: 0.85 },
  { id: "polished-stone", label: "Polished stone", kind: "stone", roughness: 0.2, metalness: 0, clearcoat: 0.15, coatRoughness: 0.2 },
  { id: "honed-stone", label: "Honed stone", kind: "stone", roughness: 0.65, metalness: 0, clearcoat: 0, coatRoughness: 0.7 },
  { id: "glazed-tile", label: "Glazed tile", kind: "tile", roughness: 0.16, metalness: 0, clearcoat: 0.6, coatRoughness: 0.14 },
  { id: "matt-tile", label: "Matt tile", kind: "tile", roughness: 0.7, metalness: 0, clearcoat: 0, coatRoughness: 0.75 },
  { id: "fabric", label: "Woven upholstery", kind: "fabric", roughness: 0.95, metalness: 0, clearcoat: 0, coatRoughness: 1 },
  { id: "brushed-metal", label: "Brushed metal", kind: "metal", roughness: 0.4, metalness: 1, clearcoat: 0, coatRoughness: 0.4 },
];
export function getSurfaceFinish(id?: string) { return SURFACE_FINISHES.find((finish) => finish.id === id); }
export function applySurfaceFinish(project: InteriorProject, materialId: string, finishId: string): InteriorProject {
  const finish = getSurfaceFinish(finishId);
  if (!finish) return project;
  return { ...project, materials: project.materials.map((material) => material.id !== materialId ? material : {
    ...material, kind: finish.kind, roughness: finish.roughness, metalness: finish.metalness,
    extensions: { ...material.extensions, surfaceFinish: finish.id },
  }) };
}
