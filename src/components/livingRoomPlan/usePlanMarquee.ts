import { useState, type PointerEvent as ReactPointerEvent } from "react";
import type { InteriorProject, InteriorRoomEntity, Point2Mm } from "../../domain/interiorProject";
import { getObjectPlanBounds, rectsIntersect } from "../../domain/livingRoom";

type MarqueeState = {
  start: Point2Mm;
  current: Point2Mm;
  additive: boolean;
  /** True when gesture began on room floor (click without drag → select room). */
  fromFloor: boolean;
};

/** Select-mode rubber band: drag selects objects, a click clears or selects the room. */
export function usePlanMarquee(input: {
  project: InteriorProject;
  room: InteriorRoomEntity | null;
  selectedIds: string[];
  clickThresholdMm: number;
  onSelect: (objectId: string | null, additive?: boolean) => void;
  onSelectMany?: (objectIds: string[]) => void;
  onSelectSurface: (surfaceId: string | null) => void;
  onSelectRoom?: () => void;
}) {
  const [marquee, setMarquee] = useState<MarqueeState | null>(null);

  function begin(event: ReactPointerEvent<SVGElement>, start: Point2Mm, fromFloor: boolean) {
    setMarquee({ start, current: start, additive: event.shiftKey || event.metaKey || event.ctrlKey, fromFloor });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function update(point: Point2Mm): boolean {
    if (!marquee) return false;
    setMarquee({ ...marquee, current: point });
    return true;
  }

  function finish(): boolean {
    if (!marquee) return false;
    const minX = Math.min(marquee.start.x, marquee.current.x);
    const maxX = Math.max(marquee.start.x, marquee.current.x);
    const minZ = Math.min(marquee.start.z, marquee.current.z);
    const maxZ = Math.max(marquee.start.z, marquee.current.z);
    setMarquee(null);
    if (Math.hypot(maxX - minX, maxZ - minZ) < input.clickThresholdMm) {
      if (marquee.fromFloor && !marquee.additive) {
        input.onSelectRoom?.();
      } else if (!marquee.additive) {
        input.onSelect(null);
        input.onSelectSurface(null);
      }
      return true;
    }
    const hit = input.project.objects.filter((object) => {
      if (input.room && object.roomId !== input.room.id) return false;
      return rectsIntersect(getObjectPlanBounds(object), { minX, minZ, maxX, maxZ });
    }).map((object) => object.id);
    if (input.onSelectMany) {
      input.onSelectMany(marquee.additive ? Array.from(new Set([...input.selectedIds, ...hit])) : hit);
    } else if (hit[0]) {
      input.onSelect(hit[0], marquee.additive);
    } else if (!marquee.additive) {
      input.onSelect(null);
    }
    return true;
  }

  const rect = marquee ? {
    x: Math.min(marquee.start.x, marquee.current.x),
    z: Math.min(marquee.start.z, marquee.current.z),
    width: Math.abs(marquee.current.x - marquee.start.x),
    height: Math.abs(marquee.current.z - marquee.start.z),
  } : null;

  return { active: Boolean(marquee), rect, begin, update, finish };
}
