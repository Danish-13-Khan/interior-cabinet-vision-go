import * as T from 'three';
import { buildShowroomLayout, type ShowroomPart } from './layout';
import type { ShowroomMaterials } from './materials';
import { drawerOpen, partProgress } from './motion';

type Animated = { object: T.Object3D; target: T.Vector3; start: T.Vector3; cue: number };

export type ShowroomStage = {
  scene: T.Scene;
  key: T.DirectionalLight;
  /** Pose every part for timeline seconds `t`. */
  pose: (t: number) => void;
  dispose: () => void;
};

function mesh(size: readonly number[], material: T.Material, shadows = true) {
  const m = new T.Mesh(new T.BoxGeometry(size[0], size[1], size[2]), material);
  m.castShadow = shadows;
  m.receiveShadow = true;
  return m;
}

function drawerBox(part: ShowroomPart, inner: T.Material) {
  const box = new T.Group();
  const [w, h] = part.size;
  const depth = 0.48, side = 0.014, wall = h * 0.7;
  const bottom = mesh([w - 0.06, side, depth], inner, false);
  bottom.position.set(0, -h / 2 + 0.03, -depth / 2);
  const back = mesh([w - 0.06, wall, side], inner, false);
  back.position.set(0, -h / 2 + 0.03 + wall / 2, -depth);
  box.add(bottom, back);
  for (const x of [-1, 1]) {
    const s = mesh([side, wall, depth], inner, false);
    s.position.set(x * (w / 2 - 0.03), -h / 2 + 0.03 + wall / 2, -depth / 2);
    box.add(s);
  }
  return box;
}

/** Builds the light stage: floor, soft back wall, warm key light and the cabinet run. */
export function buildShowroomStage(materials: ShowroomMaterials): ShowroomStage {
  const scene = new T.Scene();
  const floor = new T.Mesh(new T.PlaneGeometry(9, 7), materials.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, 2.2);
  floor.receiveShadow = true;
  const wall = new T.Mesh(new T.PlaneGeometry(9, 3.4), materials.wall);
  wall.position.set(0, 1.7, -0.001);
  wall.receiveShadow = true;
  scene.add(floor, wall);
  scene.add(new T.HemisphereLight('#fffaf2', '#d9d2c4', 1.9));
  const key = new T.DirectionalLight('#fff0da', 2.6);
  key.position.set(-2.6, 4.2, 3.6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 6;
  key.shadow.normalBias = 0.02;
  Object.assign(key.shadow.camera, { left: -2.6, right: 2.6, top: 2.8, bottom: -0.6, near: 0.5, far: 12 });
  scene.add(key);
  const fill = new T.DirectionalLight('#eef2f5', 0.7);
  fill.position.set(3, 2, 4);
  scene.add(fill);

  const animated: Animated[] = [];
  let drawer: T.Object3D | null = null;
  for (const part of buildShowroomLayout()) {
    const group = new T.Group();
    group.add(mesh(part.size, materials.byKey[part.material], part.kind !== 'backsplash' && part.kind !== 'front'));
    if (part.handle) {
      const handle = mesh(part.handle.size, materials.handle);
      handle.position.set(...part.handle.offset);
      group.add(handle);
    }
    if (part.drawer) group.add(drawerBox(part, materials.inner));
    const target = new T.Vector3(...part.position);
    group.position.copy(target);
    scene.add(group);
    animated.push({ object: group, target, start: target.clone().add(new T.Vector3(...part.from)), cue: part.cue });
    if (part.drawer) drawer = group;
  }

  return {
    scene,
    key,
    pose(t) {
      for (const item of animated) {
        const progress = partProgress(t, item.cue);
        item.object.visible = progress > 0;
        item.object.position.lerpVectors(item.start, item.target, progress);
      }
      if (drawer) drawer.position.z += drawerOpen(t);
    },
    dispose() {
      scene.traverse(object => { if (object instanceof T.Mesh) object.geometry.dispose(); });
      key.shadow.map?.dispose();
    },
  };
}
