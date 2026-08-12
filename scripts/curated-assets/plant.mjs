import { Group } from "three";
import { cylinder, mat, PALETTE, sphere } from "./meshFactory.mjs";
import { exportGlb, normalizeGroup } from "./threeExport.mjs";

/** Curated indoor plant: foliage_* + planter slots. */
export function buildPlant() {
  const group = new Group();
  group.name = "indoor-plant";
  const planter = mat(PALETTE.planter, { roughness: 0.95 });
  const foliage = mat(PALETTE.foliage, { roughness: 0.88 });
  const stem = mat(PALETTE.walnut, { roughness: 0.7 });

  group.add(cylinder("planter", 0.2, 0.15, 0.34, 28, planter, [0, 0.17, 0]));
  group.add(cylinder("planter_soil", 0.18, 0.18, 0.04, 24, mat("#3d332c", { roughness: 1 }), [0, 0.32, 0]));
  group.add(cylinder("foliage_stem", 0.02, 0.025, 0.55, 10, stem, [0, 0.6, 0]));

  const leaves = [
    ["foliage_a", 0.18, [-0.12, 0.95, 0.02]],
    ["foliage_b", 0.16, [0.14, 1.05, -0.04]],
    ["foliage_c", 0.17, [0.02, 1.18, 0.08]],
    ["foliage_d", 0.14, [-0.08, 1.12, -0.1]],
    ["foliage_e", 0.13, [0.1, 0.88, 0.1]],
  ];
  for (const [name, radius, pos] of leaves) {
    group.add(sphere(name, radius, 18, foliage, pos));
  }

  return normalizeGroup(group, 0.72, 1.45, 0.72);
}

export async function writePlant() {
  await exportGlb(buildPlant(), "indoor-plant.glb");
}
