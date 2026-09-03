/** Persist original GLB material name across catalog finish replacements. */
export const GLB_SOURCE_MATERIAL_USERDATA = "catalogSourceMaterialName";

export function readGlbSourceMaterialName(
  meshUserData: Record<string, unknown>,
  materialName: string,
): string {
  const stored = meshUserData[GLB_SOURCE_MATERIAL_USERDATA];
  if (typeof stored === "string" && stored.trim()) return stored;
  return materialName;
}

export function persistGlbSourceMaterialName(
  meshUserData: Record<string, unknown>,
  sourceName: string,
): void {
  if (sourceName.trim()) meshUserData[GLB_SOURCE_MATERIAL_USERDATA] = sourceName;
}
