/** Shared Three.js GLB export helpers for curated soft-goods. */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Box3, Scene, Vector3 } from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

if (typeof globalThis.FileReader === "undefined") {
  globalThis.FileReader = class FileReaderPolyfill {
    result = null;
    onloadend = null;
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((buffer) => {
        this.result = buffer;
        this.onloadend?.({ target: this });
      });
    }
  };
}

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
export const softGoodsDir = join(repoRoot, "public", "models", "soft-goods");
export const texturesDir = join(repoRoot, "public", "textures");

export function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

/** Sit on floor (Y=0), center XZ, scale to exact metres. */
export function normalizeGroup(group, widthM, heightM, depthM) {
  group.updateMatrixWorld(true);
  const box = new Box3().setFromObject(group);
  const size = new Vector3();
  box.getSize(size);
  const scale = Math.min(
    widthM / Math.max(size.x, 1e-6),
    heightM / Math.max(size.y, 1e-6),
    depthM / Math.max(size.z, 1e-6),
  );
  group.scale.setScalar(scale);
  group.updateMatrixWorld(true);
  const fitted = new Box3().setFromObject(group);
  const center = new Vector3();
  fitted.getCenter(center);
  group.position.x -= center.x;
  group.position.z -= center.z;
  group.position.y -= fitted.min.y;
  group.updateMatrixWorld(true);
  return group;
}

export async function exportGlb(group, fileName) {
  ensureDir(softGoodsDir);
  const scene = new Scene();
  scene.add(group);
  const exporter = new GLTFExporter();
  const buffer = await exporter.parseAsync(scene, { binary: true });
  writeFileSync(join(softGoodsDir, fileName), Buffer.from(buffer));
}
