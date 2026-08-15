import {
  Color,
  Mesh,
  MeshBasicMaterial,
  MeshDepthMaterial,
  MeshNormalMaterial,
  type Object3D,
  type Scene,
  type WebGLRenderer,
  type Camera,
} from "three";
import { readGlCanvas } from "./webglCaptureSetup";
import { colorFromStableId } from "./stableIdColor";

export type StillSupportCapture = {
  depthPng: string;
  normalPng: string;
  materialIdPng: string;
  materialPalette: { materialId: string; r: number; g: number; b: number }[];
};

function resolveMaterialId(object: Object3D) {
  let current: Object3D | null = object;
  while (current) {
    const materialId = current.userData?.materialId;
    if (typeof materialId === "string" && materialId.length > 0) return materialId;
    current = current.parent;
  }
  return object.uuid;
}

function renderOverride(
  gl: WebGLRenderer,
  scene: Scene,
  camera: Camera,
  widthPx: number,
  heightPx: number,
) {
  gl.render(scene, camera);
  return readGlCanvas(gl, widthPx, heightPx).canvas.toDataURL("image/png", 1);
}

/** Depth, world-ish normals, and material-id false color. Restores mesh materials. */
export function captureStillSupportMaps(
  gl: WebGLRenderer,
  scene: Scene,
  camera: Camera,
  widthPx: number,
  heightPx: number,
): StillSupportCapture {
  const depthMaterial = new MeshDepthMaterial();
  const normalMaterial = new MeshNormalMaterial();
  scene.overrideMaterial = depthMaterial;
  const depthPng = renderOverride(gl, scene, camera, widthPx, heightPx);
  scene.overrideMaterial = normalMaterial;
  const normalPng = renderOverride(gl, scene, camera, widthPx, heightPx);
  scene.overrideMaterial = null;

  const backups: { mesh: Mesh; material: Mesh["material"] }[] = [];
  const palette = new Map<string, { r: number; g: number; b: number }>();
  scene.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const materialId = resolveMaterialId(object);
    const packed = colorFromStableId(materialId);
    if (!palette.has(materialId)) {
      palette.set(materialId, {
        r: (packed >> 16) & 255,
        g: (packed >> 8) & 255,
        b: packed & 255,
      });
    }
    backups.push({ mesh: object, material: object.material });
    object.material = new MeshBasicMaterial({ color: new Color().setHex(packed) });
  });
  const materialIdPng = renderOverride(gl, scene, camera, widthPx, heightPx);
  for (const item of backups) {
    const temp = item.mesh.material;
    item.mesh.material = item.material;
    if (temp instanceof MeshBasicMaterial) temp.dispose();
  }
  depthMaterial.dispose();
  normalMaterial.dispose();

  return {
    depthPng,
    normalPng,
    materialIdPng,
    materialPalette: [...palette.entries()].map(([materialId, rgb]) => ({ materialId, ...rgb })),
  };
}
