import { Group } from "three";
import { cylinder, mat, PALETTE, rounded } from "./meshFactory.mjs";
import { exportGlb, normalizeGroup } from "./threeExport.mjs";

/** Curated lounge chair: upholstery_* + frame_* slots. */
export function buildLoungeChair() {
  const group = new Group();
  group.name = "lounge-chair";
  const fabric = mat(PALETTE.olive, { roughness: 0.94 });
  const wood = mat(PALETTE.oak, { roughness: 0.58 });

  group.add(rounded("upholstery_seat", 0.68, 0.14, 0.62, 0.05, fabric, [0, 0.44, -0.04]));
  group.add(rounded("upholstery_back", 0.66, 0.46, 0.14, 0.05, fabric, [0, 0.72, 0.28]));
  group.add(rounded("frame_arm_l", 0.07, 0.3, 0.58, 0.03, wood, [-0.36, 0.5, 0]));
  group.add(rounded("frame_arm_r", 0.07, 0.3, 0.58, 0.03, wood, [0.36, 0.5, 0]));
  group.add(cylinder("frame_leg_l", 0.028, 0.034, 0.38, 14, wood, [-0.28, 0.19, 0.02]));
  group.add(cylinder("frame_leg_r", 0.028, 0.034, 0.38, 14, wood, [0.28, 0.19, 0.02]));
  group.add(cylinder("frame_leg_bl", 0.024, 0.03, 0.34, 12, wood, [-0.26, 0.17, 0.26]));
  group.add(cylinder("frame_leg_br", 0.024, 0.03, 0.34, 12, wood, [0.26, 0.17, 0.26]));

  return normalizeGroup(group, 0.82, 0.88, 0.86);
}

export async function writeLoungeChair() {
  await exportGlb(buildLoungeChair(), "lounge-chair.glb");
}
