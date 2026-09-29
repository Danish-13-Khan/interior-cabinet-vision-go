import { Group } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export function parseGlb(bytes: ArrayBuffer): Promise<Group> {
  const loader = new GLTFLoader();
  return new Promise((resolve, reject) => {
    loader.parse(bytes, "", (gltf) => resolve(gltf.scene), reject);
  });
}
