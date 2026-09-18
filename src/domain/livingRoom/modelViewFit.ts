import type { CompiledLivingRoomScene, CompiledSceneBounds } from "./sceneTypes";
import { modelSelectionTarget } from "./modelSelection";
import { computeCompiledSceneBounds } from "./sceneCompilerBounds";
import { aabbFitDistanceMm, selectionFitDistanceMm, offsetFromTargetMm } from "./modelViewFitDistance";
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

export type ModelViewHeldFit = {
  mode: ModelViewFitMode;
  selection: ModelViewFitSelection;
};

export type ModelViewFitResult = ModelViewPose & {
  /** World span used for orthographic zoom / framing distance. */
  spanMm: number;
};

/** Copy of the selection used when Fit was invoked — later sidebar changes must not steal it. */
export function snapshotModelViewFit(
  mode: ModelViewFitMode,
  selection: ModelViewFitSelection | undefined,
): ModelViewHeldFit {
  const source = selection ?? { objectIds: [], wallId: null, openingId: null };
  return {
    mode,
    selection: {
      objectIds: [...source.objectIds],
      wallId: source.wallId,
      openingId: source.openingId,
    },
  };
}

/** Recapture only on a new Fit shot; otherwise keep the Fit-time target. */
export function resolveHeldFitSnapshot(input: {
  applyFitShot: boolean;
  liveMode: ModelViewFitMode;
  liveSelection: ModelViewFitSelection | undefined;
  held: ModelViewHeldFit | null;
}): ModelViewHeldFit {
  if (input.applyFitShot || !input.held) {
    return snapshotModelViewFit(input.liveMode, input.liveSelection);
  }
  return input.held;
}

/** Plain F in 3D: focus selection when present, otherwise fit the room. */
export function resolveModelViewFKeyFitMode(hasSelection: boolean): ModelViewFitMode {
  return hasSelection ? "selection" : "room";
}

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

function spanFromBounds(bounds: CompiledSceneBounds, floorMm = 0): number {
  return Math.max(bounds.size.widthMm, bounds.size.heightMm, bounds.size.depthMm, floorMm);
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
  view?: { widthPx: number; heightPx: number; fieldOfViewDegrees?: number },
): ModelViewFitResult {
  const basePreset: Exclude<ModelViewPresetId, "perspective" | "walkthrough"> =
    viewPreset === "perspective" || viewPreset === "walkthrough" ? "dollhouse" : viewPreset;

  if (mode === "room") {
    const roomPose = resolveModelViewPose(scene, basePreset);
    return { ...roomPose, spanMm: spanFromBounds(scene.bounds, 1200) };
  }

  const selected = resolveModelViewSelectionBoundsMm(scene, selection);
  if (!selected) {
    const roomPose = resolveModelViewPose(scene, basePreset);
    return { ...roomPose, spanMm: spanFromBounds(scene.bounds, 1200) };
  }

  const { center, spanMm, bounds } = selected;
  const fov = view?.fieldOfViewDegrees
    ?? (basePreset === "isometric" ? 35 : basePreset === "top" ? 38 : 42);
  const aspect = view ? view.widthPx / Math.max(view.heightPx, 1) : 1.6;
  const target = { x: center.x, y: center.y, z: center.z };
  const pose = (direction: { x: number; y: number; z: number }) => {
    const distance = view
      ? aabbFitDistanceMm({
        min: bounds.min,
        max: bounds.max,
        viewFromTarget: direction,
        fovDegrees: fov,
        aspect,
      })
      : selectionFitDistanceMm(bounds.size, view, spanMm, fov);
    return {
      position: offsetFromTargetMm(target, direction, distance),
      target,
      fieldOfViewDegrees: fov,
      spanMm,
    };
  };

  if (basePreset === "isometric") return pose({ x: 1, y: 1, z: 1 });
  if (basePreset === "top") return pose({ x: 0, y: 1, z: 0.02 });
  if (basePreset === "front") return pose({ x: 0, y: 0.1, z: 1 });
  if (basePreset === "side") return pose({ x: -1, y: 0.1, z: 0 });
  return pose({ x: 1, y: 0.55, z: 1 });
}
