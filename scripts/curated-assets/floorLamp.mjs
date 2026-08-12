import { Group } from "three";
import { cylinder, mat, PALETTE } from "./meshFactory.mjs";
import { exportGlb, normalizeGroup } from "./threeExport.mjs";

/** Curated floor lamp: frame_* + shade slots. */
export function buildFloorLamp() {
  const group = new Group();
  group.name = "floor-lamp";
  const metal = mat(PALETTE.metal, { roughness: 0.32, metalness: 0.78 });
  const shade = mat(PALETTE.shade, { roughness: 0.9 });

  group.add(cylinder("frame_base", 0.15, 0.15, 0.03, 28, metal, [0, 0.015, 0]));
  group.add(cylinder("frame_stem", 0.018, 0.02, 1.25, 14, metal, [0, 0.655, 0]));
  group.add(cylinder("frame_neck", 0.03, 0.022, 0.06, 14, metal, [0, 1.3, 0]));
  group.add(cylinder("shade", 0.13, 0.2, 0.34, 28, shade, [0, 1.45, 0]));
  group.add(cylinder("shade_liner", 0.11, 0.17, 0.3, 24, mat("#fff8ef", { roughness: 0.95 }), [0, 1.45, 0]));

  return normalizeGroup(group, 0.42, 1.65, 0.42);
}

export async function writeFloorLamp() {
  await exportGlb(buildFloorLamp(), "floor-lamp.glb");
}
