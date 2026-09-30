import { Group } from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

/** Local three.js Draco/meshopt decoders. Do not point these at a CDN. */
export function createImportGltfLoader(): GLTFLoader {
  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  // Same public/draco path as AssetBackedGlbContent. Default import.meta.url points at Vite's HTML.
  draco.setDecoderPath(`${import.meta.env.BASE_URL}draco/`);
  loader.setDRACOLoader(draco);
  loader.setMeshoptDecoder(MeshoptDecoder);
  return loader;
}

export function parseGlb(bytes: ArrayBuffer): Promise<Group> {
  const loader = createImportGltfLoader();
  return new Promise<Group>((resolve, reject) => {
    loader.parse(bytes, "", (gltf) => resolve(gltf.scene), reject);
  }).finally(() => {
    loader.dracoLoader?.dispose();
  });
}
