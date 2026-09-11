import type { RenderQuality } from "../interiorProject";
import type { RenderMode } from "./renderAssetContracts";
import { resolveModelViewMaxGlbCasters } from "./modelViewPerf";

/**
 * GLB mesh shadow casting — additive Model View Standard on top of Studio hero.
 * Studio Draft stays preview/non-casting; all hero tiers keep casting.
 * Model View Standard also respects a simultaneous GLB caster budget (Phase G).
 */
export function resolveGlbCastShadow(args: {
  renderMode: RenderMode;
  modelViewPreview?: boolean;
  modelViewQuality?: RenderQuality | null;
  /** 0-based index among GLB nodes in the compiled scene. */
  glbCasterSlot?: number;
  maxGlbCasters?: number;
}): boolean {
  if (args.renderMode === "hero") return true;
  if (!(args.modelViewPreview && args.modelViewQuality === "standard")) return false;
  const max = args.maxGlbCasters
    ?? resolveModelViewMaxGlbCasters(args.modelViewQuality);
  if (typeof args.glbCasterSlot === "number") {
    return args.glbCasterSlot < max;
  }
  return max > 0;
}

/** Assign stable GLB caster slots in scene-node order. */
export function assignGlbCasterSlots(
  nodes: readonly { id: string; renderBinding: { strategy: string } }[],
): Map<string, number> {
  const slots = new Map<string, number>();
  let next = 0;
  for (const node of nodes) {
    if (node.renderBinding.strategy === "glb") {
      slots.set(node.id, next);
      next += 1;
    }
  }
  return slots;
}
