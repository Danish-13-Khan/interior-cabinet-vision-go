import type { CompiledLivingRoomScene, CompiledSceneBounds } from "./sceneTypes";
import { modelSelectionTarget } from "./modelSelection";
import { computeCompiledSceneBounds } from "./sceneCompilerBounds";
import {
  resolveModelViewPose,
  type ModelViewPose,
  type ModelViewPresetId,
} from "./modelViewPresets";

export type ModelViewFitSelection = {
  objectIds: readonly string[];
  wallId: string | null;
  openingId: string | null;
};

export type ModelViewFitMode = "room" | "selection";

export type ModelViewFitResult = ModelViewPose & {
  /** World span used for orthographic zoom / framing distance. */
  spanMm: number;
};

function nodeMatchesSelection(
  node: CompiledLivingRoomScene["nodes"][number],
  selection: ModelViewFitSelection,
): boolean {
  const target = modelSelectionTarget(node);
  if (!target) return false;
  if (target.kind === "object") return selection.objectIds.includes(target.id);
  if (target.kind === "wall") return selection.wallId === target.id;
  return selection.openingId === target.id;
}

function spanFromBounds(bounds: CompiledSceneBounds): number {
  return Math.max(bounds.size.widthMm, bounds.size.heightMm, bounds.size.depthMm, 1200);
}

/** World AABB for the current selection via compiled-scene bounds (node transforms included). */
export function resolveModelViewSelectionBoundsMm(
  scene: CompiledLivingRoomScene,
  selection: ModelViewFitSelection,
): { center: CompiledSceneBounds["center"]; spanMm: number; bounds: CompiledSceneBounds } | null {
  const selected = scene.nodes.filter((node) => nodeMatchesSelection(node, selection));
  if (!selected.some((node) => node.primitives.length > 0)) return null;
  const bounds = computeCompiledSceneBounds(selected);
  return { center: bounds.center, spanMm: spanFromBounds(bounds), bounds };
}

export function resolveModelViewFitPose(
  scene: CompiledLivingRoomScene,
  viewPreset: ModelViewPresetId,
  mode: ModelViewFitMode,
  selection: ModelViewFitSelection,
): ModelViewFitResult {
  const basePreset: Exclude<ModelViewPresetId, "perspective" | "walkthrough"> =
    viewPreset === "perspective" || viewPreset === "walkthrough" ? "dollhouse" : viewPreset;

  if (mode === "room") {
    const roomPose = resolveModelViewPose(scene, basePreset);
    return { ...roomPose, spanMm: spanFromBounds(scene.bounds) };
  }

  const selected = resolveModelViewSelectionBoundsMm(scene, selection);
  if (!selected) {
    const roomPose = resolveModelViewPose(scene, basePreset);
    return { ...roomPose, spanMm: spanFromBounds(scene.bounds) };
  }

  const { center, spanMm } = selected;
  const distance = spanMm * 1.35;
  const target = { x: center.x, y: center.y, z: center.z };

  if (basePreset === "isometric") {
    const iso = spanMm * 1.4;
    return {
      position: { x: center.x + iso, y: center.y + iso, z: center.z + iso },
      target,
      fieldOfViewDegrees: 35,
      spanMm,
    };
  }
  if (basePreset === "top") {
    return {
      position: { x: center.x, y: center.y + distance * 1.5, z: center.z + 1 },
      target,
      fieldOfViewDegrees: 38,
      spanMm,
    };
  }
  if (basePreset === "front") {
    return {
      position: { x: center.x, y: center.y + distance * 0.1, z: center.z + distance },
      target,
      fieldOfViewDegrees: 42,
      spanMm,
    };
  }
  if (basePreset === "side") {
    return {
      position: { x: center.x - distance, y: center.y + distance * 0.1, z: center.z },
      target,
      fieldOfViewDegrees: 42,
      spanMm,
    };
  }
  return {
    position: {
      x: center.x + distance * 0.9,
      y: center.y + distance * 0.55,
      z: center.z + distance * 0.9,
    },
    target,
    fieldOfViewDegrees: 42,
    spanMm,
  };
}
