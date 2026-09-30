import type { Material, Mesh, Object3D, Texture } from "three";

type ImageLike = { width?: number; height?: number; data?: unknown } | null | undefined;

function isTexture(value: unknown): value is Texture {
  return Boolean(value && (value as Texture).isTexture === true);
}

function hasImage(texture: Texture): boolean {
  const image = texture.image as ImageLike;
  if (!image) return false;
  if (image.data) return true;
  return (image.width ?? 0) > 0 && (image.height ?? 0) > 0;
}

/**
 * A missing, unsupported, or undecodable texture is left as an empty Texture by the loaders.
 * GLTFExporter throws on those ("No valid image data found"), which would fail the whole import,
 * so clear the slot and keep the material. The loaders already warned about the texture.
 * Returns how many slots were cleared.
 */
export function stripUnloadedTextures(root: Object3D): number {
  let cleared = 0;
  root.traverse((child) => {
    const mesh = child as Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    const materials: Material[] = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      const slots = material as unknown as Record<string, unknown>;
      for (const key of Object.keys(slots)) {
        const value = slots[key];
        if (!isTexture(value) || hasImage(value)) continue;
        slots[key] = null;
        material.needsUpdate = true;
        cleared += 1;
      }
    }
  });
  return cleared;
}
