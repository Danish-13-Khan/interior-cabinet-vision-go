import type { Scene } from "three";
import { withEditorOnlyObjectsHidden } from "./sceneExportFilter";

/** Binary glTF of what the model view currently shows (cutaways included), minus editor helpers. */
export async function exportSceneGlb(scene: Scene): Promise<Blob> {
  const [{ GLTFExporter }, textureUtils] = await Promise.all([
    import("three/examples/jsm/exporters/GLTFExporter.js"),
    // Scanned finishes are KTX2 (GPU-compressed); glTF needs them blitted back to pixels.
    import("three/examples/jsm/utils/WebGLTextureUtils.js"),
  ]);
  const exporter = new GLTFExporter();
  exporter.setTextureUtils(textureUtils);
  const result = await withEditorOnlyObjectsHidden(scene, () =>
    exporter.parseAsync(scene, { binary: true, onlyVisible: true }),
  );
  if (!(result instanceof ArrayBuffer)) throw new Error("GLB export returned JSON instead of binary.");
  return new Blob([result], { type: "model/gltf-binary" });
}

export function sceneGlbFileName(projectName: string): string {
  const slug = projectName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `${slug || "scene"}.glb`;
}
