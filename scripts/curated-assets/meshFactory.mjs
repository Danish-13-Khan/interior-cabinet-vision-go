import {
  BoxGeometry,
  CylinderGeometry,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

const PALETTE = {
  oatmeal: "#c8baa6",
  olive: "#73765a",
  oak: "#b98a58",
  walnut: "#5a3928",
  metal: "#2d302f",
  shade: "#efe6d8",
  foliage: "#5f6b4e",
  planter: "#a89078",
};

export function mat(color, opts = {}) {
  return new MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.7,
    metalness: opts.metalness ?? 0,
  });
}

export function namedMesh(name, geometry, material, position = [0, 0, 0]) {
  const mesh = new Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function rounded(name, w, h, d, radius, material, position, segments = 3) {
  return namedMesh(
    name,
    new RoundedBoxGeometry(w, h, d, segments, radius),
    material,
    position,
  );
}

export function box(name, w, h, d, material, position) {
  return namedMesh(name, new BoxGeometry(w, h, d), material, position);
}

export function cylinder(name, rTop, rBottom, h, segments, material, position) {
  return namedMesh(
    name,
    new CylinderGeometry(rTop, rBottom, h, segments),
    material,
    position,
  );
}

export function sphere(name, radius, segments, material, position) {
  return namedMesh(
    name,
    new SphereGeometry(radius, segments, segments),
    material,
    position,
  );
}

export { PALETTE };
