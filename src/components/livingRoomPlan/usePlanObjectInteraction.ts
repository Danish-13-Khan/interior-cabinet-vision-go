import { useState, type PointerEvent as ReactPointerEvent } from "react";
import type { InteriorObjectEntity, InteriorProject, Point3Mm, Size3Mm } from "../../domain/interiorProject";
import { snapLivingRoomObject, type PlanSnapGuide } from "../../domain/livingRoom";
import type { PlanSnapResult } from "../../domain/livingRoom/planSnapEngine";

export type ObjectPreview = {
  objectId: string;
  position: Point3Mm;
  dimensions: Size3Mm;
  rotationY?: number;
};

export type SnappedMovePose = {
  position: Point3Mm;
  rotationY: number;
  /** Along-wall target a cabinet landed on (Phase 4), for the shared marker. */
  snap?: PlanSnapResult | null;
};

type ObjectDrag = ObjectPreview & { mode: "move" | "resize"; startPointer: { x: number; z: number } };

export function usePlanObjectInteraction(input: {
  project: InteriorProject; snapSizeMm: number;
  /** Zoom-aware semantic snap radius in world mm (from screen px). */
  snapThresholdMm?: number;
  /** Toolbar Snap toggle; off disables the along-wall targets (the wall-flush snap stays). */
  snapEnabled?: boolean;
  worldPoint: (event: ReactPointerEvent<SVGSVGElement>) => { x: number; z: number };
  onSelect: (objectId: string | null, additive?: boolean) => void;
  onMove: (objectId: string, position: Point3Mm) => void;
  onResize: (objectId: string, dimensions: Size3Mm) => void;
  /**
   * Live pre-drop validation during drag. When a pose is returned, the ghost
   * uses that wall-snapped position + rotation so it matches the validated drop.
   */
  onMovePreview?: (objectId: string, position: Point3Mm, thresholdMm?: number) => SnappedMovePose | null | void;
  onResizePreview?: (objectId: string, dimensions: Size3Mm) => void;
  /** Called when a drag gesture ends (after optional commit). */
  onDragEnd?: (info: { committed: boolean; mode: "move" | "resize" }) => void;
}) {
  const [drag, setDrag] = useState<ObjectDrag | null>(null);
  const [preview, setPreview] = useState<ObjectPreview | null>(null);
  const [guides, setGuides] = useState<PlanSnapGuide[]>([]);
  const [wallSnap, setWallSnap] = useState<PlanSnapResult | null>(null);

  function start(event: ReactPointerEvent<SVGGElement | SVGRectElement>, object: InteriorObjectEntity, mode: ObjectDrag["mode"]) {
    if (event.button !== 0) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    input.onSelect(object.id, event.shiftKey || event.metaKey || event.ctrlKey);
    const startPointer = input.worldPoint(event as unknown as ReactPointerEvent<SVGSVGElement>);
    const next = {
      mode,
      objectId: object.id,
      startPointer,
      position: { ...object.position },
      dimensions: { ...object.dimensions },
      rotationY: object.rotation.y,
    };
    setDrag(next); setPreview(next);
  }

  function move(event: ReactPointerEvent<SVGSVGElement>) {
    if (!drag) return false;
    const point = input.worldPoint(event);
    const dx = point.x - drag.startPointer.x;
    const dz = point.z - drag.startPointer.z;
    if (drag.mode === "move") {
      const result = snapLivingRoomObject(
        input.project,
        drag.objectId,
        { ...drag.position, x: drag.position.x + dx, z: drag.position.z + dz },
        input.snapSizeMm,
        input.snapThresholdMm,
      );
      const alongThreshold = input.snapEnabled === false || event.altKey ? 0 : input.snapThresholdMm;
      const snapped = input.onMovePreview?.(drag.objectId, result.position, alongThreshold);
      if (snapped && typeof snapped === "object" && "position" in snapped) {
        setPreview({
          objectId: drag.objectId,
          position: snapped.position,
          dimensions: drag.dimensions,
          rotationY: snapped.rotationY,
        });
        setWallSnap(snapped.snap ?? null);
      } else {
        setWallSnap(null);
        setPreview({
          objectId: drag.objectId,
          position: result.position,
          dimensions: drag.dimensions,
          rotationY: drag.rotationY,
        });
      }
      setGuides(result.guides);
      return true;
    }
    const object = input.project.objects.find((item) => item.id === drag.objectId)!;
    const radians = (-object.rotation.y * Math.PI) / 180;
    const localX = dx * Math.cos(radians) - dz * Math.sin(radians);
    const localZ = dx * Math.sin(radians) + dz * Math.cos(radians);
    const dimensions = {
      ...drag.dimensions,
      widthMm: Math.max(100, Math.round((drag.dimensions.widthMm + localX * 2) / input.snapSizeMm) * input.snapSizeMm),
      depthMm: Math.max(100, Math.round((drag.dimensions.depthMm + localZ * 2) / input.snapSizeMm) * input.snapSizeMm),
    };
    setPreview({
      objectId: drag.objectId,
      position: drag.position,
      dimensions,
      rotationY: drag.rotationY,
    });
    setGuides([]);
    setWallSnap(null);
    input.onResizePreview?.(drag.objectId, dimensions);
    return true;
  }

  function finish() {
    let committed = false;
    const mode = drag?.mode ?? "move";
    if (drag && preview) {
      if (
        drag.mode === "move"
        && (preview.position.x !== drag.position.x
          || preview.position.y !== drag.position.y
          || preview.position.z !== drag.position.z)
      ) {
        input.onMove(drag.objectId, preview.position);
        committed = true;
      }
      if (
        drag.mode === "resize"
        && (preview.dimensions.widthMm !== drag.dimensions.widthMm
          || preview.dimensions.heightMm !== drag.dimensions.heightMm
          || preview.dimensions.depthMm !== drag.dimensions.depthMm)
      ) {
        input.onResize(drag.objectId, preview.dimensions);
        committed = true;
      }
    }
    if (drag) {
      input.onDragEnd?.({ committed, mode });
    }
    setDrag(null); setPreview(null); setGuides([]); setWallSnap(null);
  }

  return { dragging: Boolean(drag), preview, guides, wallSnap, start, move, finish };
}
