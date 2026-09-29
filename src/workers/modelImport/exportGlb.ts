import type { Object3D } from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

export function exportSceneGlb(scene: Object3D): Promise<ArrayBuffer | null> {
  if (typeof FileReader === "undefined") return Promise.resolve(null);
  const exporter = new GLTFExporter();
  return new Promise((resolve, reject) => {
    exporter.parse(scene, (result) => {
      resolve(result instanceof ArrayBuffer ? result : null);
    }, reject, { binary: true });
  });
}
