import * as T from 'three';
import { noiseMaps, woodMaps, type ProceduralSurfaceMaps } from '../../rendering/materials/proceduralMapGenerators';
import type { MaterialKey } from './layout';
import type { ShowroomPalette } from './palettes';

/** Neutral stage surfaces shared by every palette. */
export const STAGE_COLORS = { floor: '#e7e2d8', wall: '#f4f2ed', inner: '#e4ddd0', plinth: '#3a3936' };

export type ShowroomMaterials = {
  byKey: Record<MaterialKey, T.MeshStandardMaterial>;
  handle: T.MeshStandardMaterial;
  inner: T.MeshStandardMaterial;
  floor: T.MeshStandardMaterial;
  wall: T.MeshStandardMaterial;
  setPalette: (palette: ShowroomPalette) => void;
  dispose: () => void;
};

function safeMaps(build: () => ProceduralSurfaceMaps): ProceduralSurfaceMaps {
  try { return build(); } catch { return {}; }
}

function applyMaps(material: T.MeshStandardMaterial, maps: ProceduralSurfaceMaps) {
  material.map = maps.map ?? null;
  material.bumpMap = maps.bumpMap ?? null;
  material.bumpScale = maps.bumpScale ?? 0;
  material.needsUpdate = true;
}

/** Reuses the product's procedural wood / paint recipes so the hero matches the planner. */
export function createShowroomMaterials(palette: ShowroomPalette): ShowroomMaterials {
  const wood = safeMaps(() => woodMaps(700, 'preview'));
  const paint = safeMaps(() => noiseMaps('paint', 'showroom-front', 1000, 'preview'));
  const stone = safeMaps(() => noiseMaps('paint', 'showroom-stone', 450, 'preview'));
  const front = new T.MeshStandardMaterial({ roughness: 0.55 });
  const worktop = new T.MeshStandardMaterial({ roughness: 0.38 });
  applyMaps(worktop, stone);
  const byKey: Record<MaterialKey, T.MeshStandardMaterial> = {
    front,
    worktop,
    carcass: new T.MeshStandardMaterial({ roughness: 0.7 }),
    backsplash: new T.MeshStandardMaterial({ roughness: 0.3 }),
    plinth: new T.MeshStandardMaterial({ color: STAGE_COLORS.plinth, roughness: 0.8 }),
  };
  const handle = new T.MeshStandardMaterial({ roughness: 0.3 });
  const inner = new T.MeshStandardMaterial({ color: STAGE_COLORS.inner, roughness: 0.85 });
  const floor = new T.MeshStandardMaterial({ color: STAGE_COLORS.floor, roughness: 0.95 });
  const wall = new T.MeshStandardMaterial({ color: STAGE_COLORS.wall, roughness: 1 });
  function setPalette(p: ShowroomPalette) {
    applyMaps(front, p.frontFinish === 'wood' ? wood : paint);
    front.roughness = p.frontFinish === 'wood' ? 0.6 : 0.42;
    front.color.set(p.front);
    byKey.carcass.color.set(p.carcass);
    worktop.color.set(p.worktop);
    byKey.backsplash.color.set(p.backsplash);
    handle.color.set(p.handle);
    handle.metalness = p.handleMetal;
  }
  setPalette(palette);
  const all = [...Object.values(byKey), handle, inner, floor, wall];
  const textures = [wood, paint, stone].flatMap(maps => [maps.map, maps.bumpMap]);
  return {
    byKey, handle, inner, floor, wall, setPalette,
    dispose() {
      all.forEach(material => material.dispose());
      textures.forEach(texture => texture?.dispose());
    },
  };
}
