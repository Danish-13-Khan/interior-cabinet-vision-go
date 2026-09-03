import type { MaterialSlotPolicy } from "./types";

function matchMeshToken(name: string, materialGroups: Record<string, string>): string | null {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return null;
  for (const [slot, token] of Object.entries(materialGroups)) {
    const needle = token.trim().toLowerCase();
    if (!needle) continue;
    if (normalized === needle || normalized.includes(needle)) return slot;
  }
  return null;
}

/** Prefer original GLB material name → semantic slot, then mesh-name token fallback. */
export function matchSlotFromMaterialOrMeshName(args: {
  materialName?: string | null;
  meshName: string;
  slotPolicies?: Record<string, MaterialSlotPolicy>;
  materialGroups?: Record<string, string>;
}): string | null {
  const materialName = args.materialName?.trim().toLowerCase() ?? "";
  if (materialName && args.slotPolicies) {
    for (const [slot, policy] of Object.entries(args.slotPolicies)) {
      const hit = policy.sourceMaterialNames.some(
        (name) => name.trim().toLowerCase() === materialName,
      );
      if (hit) return slot;
    }
  }
  if (args.materialGroups) return matchMeshToken(args.meshName, args.materialGroups);
  return null;
}

export function resolveMaterialIdForPrimitive(args: {
  materialName?: string | null;
  meshName: string;
  slotPolicies?: Record<string, MaterialSlotPolicy>;
  materialGroups?: Record<string, string>;
  materialBindings: Record<string, string>;
}): string | null {
  const slot = matchSlotFromMaterialOrMeshName(args);
  if (!slot) return null;
  return args.materialBindings[slot] ?? null;
}
