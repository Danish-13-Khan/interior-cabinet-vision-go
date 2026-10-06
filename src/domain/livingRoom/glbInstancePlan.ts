import type { RenderBinding } from "./renderAssetContracts";

/** Same packaged model and the same material slots can share one draw. */
export function glbInstanceKey(binding: RenderBinding): string | null {
  if (binding.strategy !== "glb") return null;
  const asset = binding.modelAssetId ?? binding.modelUrl;
  if (!asset) return null;
  const slots = Object.keys(binding.materialBindings).sort()
    .map((slot) => `${slot}=${binding.materialBindings[slot]}`)
    .join("|");
  return `${asset}|${binding.preserveSourceMaterials ? "source" : "catalog"}|${slots}`;
}

/**
 * Ids drawn as instances. A selected or transforming object stays a live clone
 * so picking, the outline and the drag preview keep working.
 */
export function instancedGlbNodeIds(
  nodes: readonly { id: string; renderBinding: RenderBinding }[],
  liveIds: ReadonlySet<string>,
): Set<string> {
  const groups = new Map<string, string[]>();
  for (const node of nodes) {
    const key = glbInstanceKey(node.renderBinding);
    if (!key) continue;
    const list = groups.get(key) ?? [];
    list.push(node.id);
    groups.set(key, list);
  }
  const instanced = new Set<string>();
  for (const ids of groups.values()) {
    if (ids.length < 2) continue;
    for (const id of ids) {
      if (!liveIds.has(id)) instanced.add(id);
    }
  }
  return instanced;
}
