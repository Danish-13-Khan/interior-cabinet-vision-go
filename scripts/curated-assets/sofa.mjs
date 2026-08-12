import { Group } from "three";
import { cylinder, mat, PALETTE, rounded } from "./meshFactory.mjs";
import { exportGlb, normalizeGroup } from "./threeExport.mjs";

/** Curated 3-seat sofa: upholstery_* + legs_* slots, floor origin. */
export function buildSofa() {
  const group = new Group();
  group.name = "sofa-3-seat";
  const fabric = mat(PALETTE.oatmeal, { roughness: 0.92 });
  const metal = mat(PALETTE.metal, { roughness: 0.35, metalness: 0.72 });

  group.add(rounded("upholstery_base", 2.05, 0.22, 0.82, 0.06, fabric, [0, 0.31, 0]));
  group.add(rounded("upholstery_back", 2.0, 0.48, 0.18, 0.05, fabric, [0, 0.66, 0.34]));
  group.add(rounded("upholstery_arm_l", 0.16, 0.36, 0.78, 0.05, fabric, [-0.98, 0.48, -0.02]));
  group.add(rounded("upholstery_arm_r", 0.16, 0.36, 0.78, 0.05, fabric, [0.98, 0.48, -0.02]));

  for (const [i, x] of [[0, -0.62], [1, 0], [2, 0.62]]) {
    group.add(rounded(`upholstery_seat_${i}`, 0.58, 0.12, 0.58, 0.05, fabric, [x, 0.46, -0.05]));
    group.add(rounded(`upholstery_back_cushion_${i}`, 0.56, 0.34, 0.14, 0.05, fabric, [x, 0.7, 0.24]));
  }

  for (const [sx, sz] of [[-0.88, -0.3], [0.88, -0.3], [-0.88, 0.3], [0.88, 0.3]]) {
    group.add(cylinder(`legs_${sx}_${sz}`, 0.028, 0.034, 0.2, 14, metal, [sx, 0.1, sz]));
  }

  return normalizeGroup(group, 2.2, 0.82, 0.92);
}

export async function writeSofa() {
  await exportGlb(buildSofa(), "sofa-3-seat.glb");
}
