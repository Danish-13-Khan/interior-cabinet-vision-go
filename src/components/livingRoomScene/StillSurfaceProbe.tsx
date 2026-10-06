import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { Raycaster, Vector2, type Material, type Object3D } from "three";
import {
  nearestStillSurface,
  stillLuma,
  summarizeStillSurfaces,
  type StillRgb,
  type StillSurfaceReading,
} from "../../domain/livingRoom/stillSurfaceClass";
import { EXCLUDE_FROM_EXPORT } from "../../rendering/sceneExport/sceneExportFilter";

const COLS = 8;
const ROWS = 6;

function tagsFrom(object: Object3D) {
  let primitiveId: string | undefined;
  let pickKind: string | undefined;
  let current: Object3D | null = object;
  while (current) {
    const data = current.userData as { primitiveId?: unknown; modelPickKind?: unknown };
    if (!primitiveId && typeof data.primitiveId === "string") primitiveId = data.primitiveId;
    if (!pickKind && typeof data.modelPickKind === "string") pickKind = data.modelPickKind;
    current = current.parent;
  }
  return { primitiveId, pickKind };
}

function materialDraws(material: Material) {
  if (material.visible === false || material.colorWrite === false) return false;
  return !(material.transparent && material.opacity <= 0);
}

/** Pick volumes, contact shadows, and gizmos are not the pixel on screen. */
function isProbeHelper(object: Object3D) {
  let current: Object3D | null = object;
  while (current) {
    if (!current.visible) return true;
    const data = current.userData as { primitiveId?: unknown };
    if (data.primitiveId === "opening-pick") return true;
    if (current.userData?.[EXCLUDE_FROM_EXPORT] === true) return true;
    if (/Helper$/.test(current.type) || (current as { isLight?: boolean }).isLight) return true;
    current = current.parent;
  }
  const mesh = object as Object3D & { isMesh?: boolean; material?: Material | Material[] };
  if (!mesh.isMesh || mesh.material == null) return false;
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  return materials.length > 0 && materials.every((item) => !materialDraws(item));
}

function firstHitName(object: Object3D) {
  const tags = tagsFrom(object);
  if (tags.primitiveId) return tags.primitiveId;
  if (tags.pickKind) return `pick:${tags.pickKind}`;
  const keys = Object.keys(object.userData).filter((key) => key !== "parent").slice(0, 3);
  const label = object.name || object.parent?.name || object.type;
  return keys.length ? `${label}{${keys.join(",")}}` : label;
}

function framePixels(canvas: HTMLCanvasElement) {
  const copy = document.createElement("canvas");
  copy.width = canvas.width;
  copy.height = canvas.height;
  const context = copy.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Could not read the still frame");
  context.drawImage(canvas, 0, 0);
  return context.getImageData(0, 0, copy.width, copy.height);
}

function pixelAt(image: ImageData, x: number, y: number): StillRgb {
  const index = (y * image.width + x) * 4;
  const r = image.data[index] ?? 0;
  const g = image.data[index + 1] ?? 0;
  const b = image.data[index + 2] ?? 0;
  return { r, g, b, luma: stillLuma(r, g, b) };
}

/** Read the framebuffer only where the nearest visible hit is wall, floor, or door. */
export function sampleStillSurfaces(
  camera: Parameters<Raycaster["setFromCamera"]>[1],
  scene: Object3D,
  canvas: HTMLCanvasElement,
): StillSurfaceReading {
  const image = framePixels(canvas);
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  const samples: { kind: NonNullable<ReturnType<typeof nearestStillSurface>>; rgb: StillRgb }[] = [];
  const firstHits: Record<string, number> = {};
  camera.updateMatrixWorld();
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const ndcX = (col / (COLS - 1)) * 1.4 - 0.7;
      const ndcY = (row / (ROWS - 1)) * 1.4 - 0.7;
      pointer.set(ndcX, ndcY);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(scene, true).map((item) => ({
        object: item.object,
        tags: tagsFrom(item.object),
        helper: isProbeHelper(item.object),
      }));
      const visible = hits.find((item) => !item.helper);
      const name = visible ? firstHitName(visible.object) : "miss";
      firstHits[name] = (firstHits[name] ?? 0) + 1;
      const kind = nearestStillSurface(hits);
      if (!kind) continue;
      const x = Math.min(image.width - 1, Math.max(0, Math.round((ndcX * 0.5 + 0.5) * (image.width - 1))));
      const y = Math.min(image.height - 1, Math.max(0, Math.round((-ndcY * 0.5 + 0.5) * (image.height - 1))));
      samples.push({ kind, rgb: pixelAt(image, x, y) });
    }
  }
  return { ...summarizeStillSurfaces(samples), firstHits };
}

/** Mounted only while a still script has pinned capture DPR. */
export function StillSurfaceProbe() {
  const { camera, scene, gl } = useThree();
  useEffect(() => {
    const read = () => sampleStillSurfaces(camera, scene, gl.domElement);
    window.__stillSurfaceProbe = read;
    return () => {
      if (window.__stillSurfaceProbe === read) delete window.__stillSurfaceProbe;
    };
  }, [camera, scene, gl]);
  return null;
}
