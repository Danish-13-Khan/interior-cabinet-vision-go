import { useState, type PointerEvent as ReactPointerEvent } from "react";
import type { InteriorObjectEntity, InteriorProject, Point3Mm, Size3Mm } from "../../domain/interiorProject";
import { snapLivingRoomObject, type PlanSnapGuide } from "../../domain/livingRoom";

export type ObjectPreview = { objectId: string; position: Point3Mm; dimensions: Size3Mm };
type ObjectDrag = ObjectPreview & { mode: "move" | "resize"; startPointer: { x: number; z: number } };

export function usePlanObjectInteraction(input: {
  project: InteriorProject; snapSizeMm: number;
  /** Zoom-aware semantic snap radius in world mm (from screen px). */
  snapThresholdMm?: number;
  worldPoint: (event: ReactPointerEvent<SVGSVGElement>) => { x: number; z: number };
  onSelect: (objectId: string | null, additive?: boolean) => void;
  onMove: (objectId: string, position: Point3Mm) => void;
  onResize: (objectId: string, dimensions: Size3Mm) => void;
}) {
  const [drag, setDrag] = useState<ObjectDrag | null>(null);
  const [preview, setPreview] = useState<ObjectPreview | null>(null);
  const [guides, setGuides] = useState<PlanSnapGuide[]>([]);

  function start(event: ReactPointerEvent<SVGGElement | SVGRectElement>, object: InteriorObjectEntity, mode: ObjectDrag["mode"]) {
    if (event.button !== 0) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    input.onSelect(object.id, event.shiftKey || event.metaKey || event.ctrlKey);
    const startPointer = input.worldPoint(event as unknown as ReactPointerEvent<SVGSVGElement>);
    const next = { mode, objectId: object.id, startPointer, position: { ...object.position }, dimensions: { ...object.dimensions } };
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
      setPreview({ objectId: drag.objectId, position: result.position, dimensions: drag.dimensions });
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
    setPreview({ objectId: drag.objectId, position: drag.position, dimensions }); setGuides([]);
    return true;
  }

  function finish() {
    if (drag && preview) {
      if (
        drag.mode === "move"
        && (preview.position.x !== drag.position.x
          || preview.position.y !== drag.position.y
          || preview.position.z !== drag.position.z)
      ) {
        input.onMove(drag.objectId, preview.position);
      }
      if (
        drag.mode === "resize"
        && (preview.dimensions.widthMm !== drag.dimensions.widthMm
          || preview.dimensions.heightMm !== drag.dimensions.heightMm
          || preview.dimensions.depthMm !== drag.dimensions.depthMm)
      ) {
        input.onResize(drag.objectId, preview.dimensions);
      }
    }
    setDrag(null); setPreview(null); setGuides([]);
  }

  return { dragging: Boolean(drag), preview, guides, start, move, finish };
}
