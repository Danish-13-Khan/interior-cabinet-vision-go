import { Group } from "three";
import { cylinder, mat, PALETTE } from "./meshFactory.mjs";
import { exportGlb, normalizeGroup } from "./threeExport.mjs";

/** Curated side table: top + frame_* slots. */
export function buildSideTable() {
  const group = new Group();
  group.name = "side-table";
  const oak = mat(PALETTE.oak, { roughness: 0.55 });
  const metal = mat(PALETTE.metal, { roughness: 0.34, metalness: 0.75 });

  group.add(cylinder("top", 0.24, 0.24, 0.032, 40, oak, [0, 0.504, 0]));
  group.add(cylinder("frame_stem", 0.022, 0.026, 0.44, 18, metal, [0, 0.26, 0]));
  group.add(cylinder("frame_base", 0.17, 0.17, 0.028, 36, metal, [0, 0.014, 0]));
  group.add(cylinder("frame_collar", 0.04, 0.04, 0.02, 18, metal, [0, 0.47, 0]));

  return normalizeGroup(group, 0.48, 0.52, 0.48);
}

export async function writeSideTable() {
  await exportGlb(buildSideTable(), "side-table.glb");
}
