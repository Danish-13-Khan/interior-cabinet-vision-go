import { Box3, Raycaster, Vector2, Vector3, type Camera, type Object3D } from "three";

export type ModelPickScreenPoint = { x: number; y: number; pickId: string };

export function findPickRoot(scene: Object3D, pickId: string): Object3D | null {
  let found: Object3D | null = null;
  scene.traverse((object) => {
    if (!found && object.userData?.modelPickId === pickId) found = object;
  });
  return found;
}

export function toClientPoint(
  world: Vector3,
  camera: Camera,
  canvas: HTMLCanvasElement,
  pickId: string,
): ModelPickScreenPoint {
  const projected = world.clone().project(camera);
  if (projected.z < -1 || projected.z > 1) return { pickId, x: Number.NaN, y: Number.NaN };
  const rect = canvas.getBoundingClientRect();
  return {
    pickId,
    x: rect.left + (projected.x * 0.5 + 0.5) * rect.width,
    y: rect.top + (-projected.y * 0.5 + 0.5) * rect.height,
  };
}

function classifyPickHit(object: Object3D): { pickId: string | null; occluder: boolean } {
  let current: Object3D | null = object;
  while (current) {
    const pickId = current.userData?.modelPickId;
    if (typeof pickId === "string" && pickId.length > 0) {
      return { pickId, occluder: false };
    }
    if (current.userData?.modelPickOccluder === true) {
      return { pickId: null, occluder: true };
    }
    current = current.parent;
  }
  return { pickId: null, occluder: false };
}

/** First R3F-interactive pick target; explicit compiled occluders block it. */
export function firstPickIdFromRay(
  scene: Object3D,
  camera: Camera,
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): string | null {
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  const pointer = new Vector2(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -(((clientY - rect.top) / rect.height) * 2 - 1),
  );
  const raycaster = new Raycaster();
  raycaster.setFromCamera(pointer, camera);
  for (const hit of raycaster.intersectObject(scene, true)) {
    const classified = classifyPickHit(hit.object);
    if (classified.pickId) return classified.pickId;
    if (classified.occluder) return null;
  }
  return null;
}

function candidateWorldPoints(root: Object3D, camera: Camera): Vector3[] {
  const box = new Box3().setFromObject(root);
  const center = box.isEmpty() ? root.getWorldPosition(new Vector3()) : box.getCenter(new Vector3());
  if (box.isEmpty()) center.y += 0.45;
  const towardCamera = camera.position.clone().sub(center);
  if (towardCamera.lengthSq() < 1e-6) towardCamera.set(0, 0.4, 0.4);
  towardCamera.normalize();
  const size = box.isEmpty() ? new Vector3(0.2, 0.4, 0.2) : box.getSize(new Vector3());
  const hx = Math.max(0.02, size.x * 0.35);
  const hy = Math.max(0.02, size.y * 0.35);
  const hz = Math.max(0.02, size.z * 0.35);
  return [
    center,
    center.clone().addScaledVector(towardCamera, 0.08),
    center.clone().addScaledVector(towardCamera, 0.16),
    center.clone().add(new Vector3(hx, 0, 0)),
    center.clone().add(new Vector3(-hx, 0, 0)),
    center.clone().add(new Vector3(0, hy, 0)),
    center.clone().add(new Vector3(0, -hy, 0)),
    center.clone().add(new Vector3(0, 0, hz)),
    center.clone().add(new Vector3(0, 0, -hz)),
  ];
}

export function visibleScreenPointForPickId(
  scene: Object3D,
  camera: Camera,
  canvas: HTMLCanvasElement,
  pickId: string,
): ModelPickScreenPoint | null {
  const root = findPickRoot(scene, pickId);
  if (!root) return null;
  for (const world of candidateWorldPoints(root, camera)) {
    const point = toClientPoint(world, camera, canvas, pickId);
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) continue;
    if (firstPickIdFromRay(scene, camera, canvas, point.x, point.y) === pickId) return point;
  }
  return null;
}

/** Stable projected center used to drive an actual browser/R3F pointer click. */
export function projectedScreenPointForPickId(
  scene: Object3D,
  camera: Camera,
  canvas: HTMLCanvasElement,
  pickId: string,
): ModelPickScreenPoint | null {
  const root = findPickRoot(scene, pickId);
  if (!root) return null;
  const world = candidateWorldPoints(root, camera)[0];
  const point = toClientPoint(world, camera, canvas, pickId);
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return null;
  const rect = canvas.getBoundingClientRect();
  return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom
    ? point
    : null;
}
