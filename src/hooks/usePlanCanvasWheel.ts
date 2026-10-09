import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import {
  clientToPlanPoint,
  clientToPlanPointFromSvg,
  panPlanViewByScreen,
  zoomPlanViewToward,
  type PlanViewBox,
} from "../domain/livingRoom/planViewTransform";
import { classifyPlanWheel } from "../domain/livingRoom/planWheelGesture";

/** Native non-passive wheel listener: trackpad scroll pans, pinch / mouse wheel / ⌘ zooms at cursor. */
export function usePlanCanvasWheel(options: {
  svg: SVGSVGElement | null;
  viewRef: MutableRefObject<PlanViewBox>;
  setView: Dispatch<SetStateAction<PlanViewBox>>;
}) {
  const { svg, viewRef, setView } = options;
  useEffect(() => {
    if (!svg) return;
    const el = svg;
    function handleWheel(event: WheelEvent) {
      event.preventDefault();
      const gesture = classifyPlanWheel(event as WheelEvent & { wheelDeltaY?: number });
      const rect = el.getBoundingClientRect();
      if (gesture.kind === "pan") {
        const width = Math.max(1, rect.width);
        const height = Math.max(1, rect.height);
        setView((prev) => panPlanViewByScreen(prev, gesture.dxPx, gesture.dyPx, width, height));
        return;
      }
      if (gesture.factor === 1) return;
      const origin = clientToPlanPointFromSvg(el, event.clientX, event.clientY)
        ?? clientToPlanPoint(viewRef.current, event.clientX, event.clientY, rect);
      setView((prev) => zoomPlanViewToward(prev, gesture.factor, origin.x, origin.z));
    }
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [svg, viewRef, setView]);
}
