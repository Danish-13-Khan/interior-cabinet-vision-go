/**
 * Match a GLB mesh or material name to a project materialSlots key.
 * Tokens come from ModelAssetDefinition.materialGroups values.
 */
export function matchMaterialSlotForName(
  name: string,
  materialGroups: Record<string, string>,
): string | null {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return null;
  for (const [slot, token] of Object.entries(materialGroups)) {
    const needle = token.trim().toLowerCase();
    if (!needle) continue;
    if (normalized === needle || normalized.includes(needle)) return slot;
  }
  return null;
}

export function resolveMaterialIdForMeshName(
  name: string,
  materialGroups: Record<string, string>,
  materialBindings: Record<string, string>,
): string | null {
  const slot = matchMaterialSlotForName(name, materialGroups);
  if (!slot) return null;
  return materialBindings[slot] ?? null;
}
