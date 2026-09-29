import type { Material, Object3D, Texture } from "three";

export const EXCLUDE_FROM_EXPORT = "excludeFromExport";

function isRenderTargetTexture(value: unknown): boolean {
  const texture = value as Texture | null | undefined;
  return texture?.isTexture === true && texture.isRenderTargetTexture === true;
}

/** GLTFExporter throws "Invalid image type" on GPU render-target textures (e.g. contact shadows). */
export function usesRenderTargetTexture(object: Object3D): boolean {
  const material = (object as { material?: Material | Material[] }).material;
  if (!material) return false;
  return (Array.isArray(material) ? material : [material]).some((entry) => {
    const uniforms = (entry as { uniforms?: Record<string, { value?: unknown }> }).uniforms ?? {};
    return Object.values(entry).some(isRenderTargetTexture)
      || Object.values(uniforms).some((uniform) => isRenderTargetTexture(uniform?.value));
  });
}

/** Editor-only objects (grid, gizmos, helpers, lights, live GPU effects) kept out of a delivered GLB. */
export function isEditorOnlyObject(object: Object3D): boolean {
  if (object.userData?.[EXCLUDE_FROM_EXPORT] === true) return true;
  if ((object as { isLight?: boolean }).isLight) return true;
  if (usesRenderTargetTexture(object)) return true;
  return /Helper$/.test(object.type);
}

/** Visible editor-only roots; descendants are skipped because hiding the root hides them. */
export function collectEditorOnlyObjects(root: Object3D): Object3D[] {
  const found: Object3D[] = [];
  const visit = (object: Object3D) => {
    if (!object.visible) return;
    if (object !== root && isEditorOnlyObject(object)) {
      found.push(object);
      return;
    }
    object.children.forEach(visit);
  };
  visit(root);
  return found;
}

/** Hide editor-only objects for the duration of `run`, then restore them. */
export async function withEditorOnlyObjectsHidden<T>(root: Object3D, run: () => Promise<T>): Promise<T> {
  const hidden = collectEditorOnlyObjects(root);
  hidden.forEach((object) => { object.visible = false; });
  try {
    return await run();
  } finally {
    hidden.forEach((object) => { object.visible = true; });
  }
}
