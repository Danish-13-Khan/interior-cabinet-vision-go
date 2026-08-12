import { Group } from "three";
import { box, mat, PALETTE, rounded } from "./meshFactory.mjs";
import { exportGlb, normalizeGroup } from "./threeExport.mjs";

/** Curated coffee table: top + frame_* slots. */
export function buildCoffeeTable() {
  const group = new Group();
  group.name = "coffee-table";
  const oak = mat(PALETTE.oak, { roughness: 0.55 });
  const metal = mat(PALETTE.metal, { roughness: 0.34, metalness: 0.75 });

  group.add(rounded("top", 1.2, 0.05, 0.65, 0.02, oak, [0, 0.355, 0]));
  group.add(box("frame_apron", 1.08, 0.04, 0.52, metal, [0, 0.31, 0]));
  for (const [x, z] of [[-0.5, -0.26], [0.5, -0.26], [-0.5, 0.26], [0.5, 0.26]]) {
    group.add(box(`frame_leg_${x}_${z}`, 0.045, 0.31, 0.045, metal, [x, 0.155, z]));
  }

  return normalizeGroup(group, 1.2, 0.38, 0.65);
}

export async function writeCoffeeTable() {
  await exportGlb(buildCoffeeTable(), "coffee-table.glb");
}
