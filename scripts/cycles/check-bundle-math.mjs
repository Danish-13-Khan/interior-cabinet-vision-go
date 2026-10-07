/**
 * Cross-check `render-sources/blender/still_bundle_math.py` against three.js.
 * Transforms points through the same Euler orders in both and compares.
 *
 *   node scripts/cycles/check-bundle-math.mjs
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Euler, Matrix4, Vector3 } from "three";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const script = join(root, "render-sources", "blender", "still_bundle_math.py");

const cases = [
  { transform: { position: { x: 1, y: 2, z: 3 }, rotation: { x: 90, y: 180, z: 0, order: "YXZ" } }, point: [0.5, 0, -0.2] },
  { transform: { position: { x: -0.75, y: 2.81, z: -0.32 }, rotation: { x: 37, y: -112, z: 15, order: "XYZ" } }, point: [1.03, -0.011, 0.004] },
  { transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 45, z: 0, order: "XYZ" }, scale: { x: 2, y: 0.5, z: 1.5 } }, point: [1, 1, 1] },
  { transform: { position: { x: 2, y: 0.4, z: -1 }, rotation: { x: -90, y: 30, z: 0, order: "YXZ" } }, point: [0, 0, -1] },
];

const rad = (deg) => (deg * Math.PI) / 180;

const expected = cases.map(({ transform, point }) => {
  const { position, rotation, scale } = transform;
  const m = new Matrix4()
    .makeTranslation(position.x, position.y, position.z)
    .multiply(new Matrix4().makeRotationFromEuler(new Euler(rad(rotation.x), rad(rotation.y), rad(rotation.z), rotation.order)))
    .multiply(new Matrix4().makeScale(scale?.x ?? 1, scale?.y ?? 1, scale?.z ?? 1));
  const three = new Vector3(...point).applyMatrix4(m);
  return { three: [three.x, three.y, three.z], blender: [three.x, -three.z, three.y] };
});

const python = spawnSync("python3", [script], { input: JSON.stringify(cases), encoding: "utf8" });
if (python.status !== 0) {
  console.error(python.stderr);
  process.exit(1);
}
const actual = JSON.parse(python.stdout);
let worst = 0;
actual.forEach((result, index) => {
  for (const space of ["three", "blender"]) {
    for (let axis = 0; axis < 3; axis += 1) {
      worst = Math.max(worst, Math.abs(result[space][axis] - expected[index][space][axis]));
    }
  }
});
console.log(`max |python − three.js| = ${worst.toExponential(2)} over ${cases.length} cases`);
if (worst > 1e-6) {
  console.error("MISMATCH", JSON.stringify({ expected, actual }, null, 1));
  process.exit(1);
}
