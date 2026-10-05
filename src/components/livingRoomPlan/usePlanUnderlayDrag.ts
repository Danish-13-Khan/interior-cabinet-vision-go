import { useState, type PointerEvent as ReactPointerEvent } from "react";
import type { LivingRoomPlanUnderlay } from "../../domain/livingRoom";
import { canMoveUnderlay, translateUnderlay } from "../../domain/livingRoom/planUnderlayTransform";

type UnderlayDrag = {
  origin: LivingRoomPlanUnderlay;
  startPointer: { x: number; z: number };
  preview: LivingRoomPlanUnderlay;
};

/** Move-underlay gesture: local preview while dragging, one `onCommit` on release. */
export function usePlanUnderlayDrag(input: {
  active: boolean;
  underlay: LivingRoomPlanUnderlay | null;
  worldPoint: (event: ReactPointerEvent<SVGSVGElement>) => { x: number; z: number };
  onCommit?: (underlay: LivingRoomPlanUnderlay) => void;
}) {
  const [drag, setDrag] = useState<UnderlayDrag | null>(null);
  const movable = input.active && Boolean(input.onCommit) && canMoveUnderlay(input.underlay);

  function start(event: ReactPointerEvent<SVGImageElement>) {
    if (!movable || !input.underlay || event.button !== 0) return;
    event.stopPropagation();
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const startPointer = input.worldPoint(event as unknown as ReactPointerEvent<SVGSVGElement>);
    setDrag({ origin: input.underlay, startPointer, preview: input.underlay });
  }

  function move(event: ReactPointerEvent<SVGSVGElement>): boolean {
    if (!drag) return false;
    const point = input.worldPoint(event);
    setDrag({
      ...drag,
      preview: translateUnderlay(drag.origin, point.x - drag.startPointer.x, point.z - drag.startPointer.z),
    });
    return true;
  }

  function finish(): boolean {
    if (!drag) return false;
    const { origin, preview } = drag;
    setDrag(null);
    if (preview.xMm !== origin.xMm || preview.zMm !== origin.zMm) input.onCommit?.(preview);
    return true;
  }

  return {
    movable,
    dragging: Boolean(drag),
    preview: drag ? { xMm: drag.preview.xMm ?? 0, zMm: drag.preview.zMm ?? 0 } : null,
    start,
    move,
    finish,
  };
}
