import {
  Box3,
  DirectionalLight,
  HemisphereLight,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
  type Material,
  type Mesh,
  type Object3D,
  type Texture,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

/**
 * Main-thread thumbnail for the import dialog. Load it with dynamic import() so the
 * renderer path stays out of the panel's first chunk. Never throws: failure is `null`.
 */
export const THUMBNAIL_PX = 256;
const FOV_DEG = 35;
/** Front-right, slightly above: glTF faces +Z. */
const VIEW_DIRECTION = new Vector3(1, 0.75, 1.4).normalize();

type EncodableCanvas = Pick<HTMLCanvasElement, "toDataURL">;

/** WebP when the browser really encodes it, otherwise PNG. */
export function encodeThumbnail(canvas: EncodableCanvas): string | null {
  const webp = canvas.toDataURL("image/webp", 0.85);
  if (webp.startsWith("data:image/webp")) return webp;
  const png = canvas.toDataURL("image/png");
  return png.startsWith("data:image/png") ? png : null;
}

function disposeTexture(texture: Texture): void {
  const data = texture.source?.data as { close?: () => void } | undefined;
  texture.dispose();
  data?.close?.();
}

/** Frees every geometry, material and texture under `root`. */
export function disposeObject(root: Object3D): void {
  const textures = new Set<Texture>();
  root.traverse((child) => {
    const mesh = child as Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    const materials: Material[] = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      if (!material) continue;
      for (const value of Object.values(material)) {
        if ((value as Texture | null)?.isTexture) textures.add(value as Texture);
      }
      material.dispose();
    }
  });
  textures.forEach(disposeTexture);
}

/** 3/4 view that keeps the whole bounding sphere in frame. */
export function fitThumbnailCamera(camera: PerspectiveCamera, bounds: Box3): void {
  const center = bounds.getCenter(new Vector3());
  const radius = Math.max(bounds.getSize(new Vector3()).length() / 2, 1e-3);
  const distance = (radius / Math.sin((FOV_DEG * Math.PI) / 360)) * 1.05;
  camera.fov = FOV_DEG;
  camera.aspect = 1;
  camera.near = distance / 100;
  camera.far = distance * 10;
  camera.position.copy(center).addScaledVector(VIEW_DIRECTION, distance);
  camera.lookAt(center);
  camera.updateProjectionMatrix();
}

/** Each step on its own: a throw here must not replace the thumbnail result or skip the context release. */
export function releaseRenderer(renderer: Pick<WebGLRenderer, "renderLists" | "dispose" | "forceContextLoss">): void {
  try { renderer.renderLists.dispose(); } catch { /* already gone */ }
  try { renderer.dispose(); } catch { /* already gone */ }
  try { renderer.forceContextLoss(); } catch { /* context already lost */ }
}

export async function renderModelThumbnail(glb: ArrayBuffer, size = THUMBNAIL_PX): Promise<string | null> {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  let renderer: WebGLRenderer | null = null;
  let model: Object3D | null = null;
  try {
    const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(glb, "");
    model = gltf.scene;
    const bounds = new Box3().setFromObject(model);
    if (bounds.isEmpty()) return null;
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);
    renderer.setSize(size, size, false);
    renderer.setClearColor(0x000000, 0);
    const scene = new Scene();
    scene.add(new HemisphereLight(0xffffff, 0xd9d6cf, 2.2));
    const key = new DirectionalLight(0xffffff, 1.6);
    key.position.set(1, 2, 1.5);
    scene.add(key, model);
    const camera = new PerspectiveCamera(FOV_DEG, 1);
    fitThumbnailCamera(camera, bounds);
    renderer.render(scene, camera);
    return encodeThumbnail(canvas);
  } catch {
    return null;
  } finally {
    if (model) try { disposeObject(model); } catch { /* best effort */ }
    if (renderer) releaseRenderer(renderer);
    canvas.width = 0;
    canvas.height = 0;
  }
}
