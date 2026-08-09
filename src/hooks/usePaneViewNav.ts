import {
  useCallback,
  useRef,
  useState,
  type PointerEvent,
  type WheelEvent,
} from "react";
import {
  DEFAULT_PANE_VIEW,
  PANE_ZOOM_STEP,
  clampPaneView,
  fitPaneView,
  panPaneView,
  zoomPaneView,
  type PaneViewTransform,
} from "../domain/desktopUx/paneViewNav";

type UsePaneViewNavArgs = {
  initial?: PaneViewTransform;
};

export function usePaneViewNav({ initial }: UsePaneViewNavArgs = {}) {
  const [transform, setTransform] = useState(() =>
    clampPaneView(initial ?? DEFAULT_PANE_VIEW),
  );
  const [panActive, setPanActive] = useState(false);
  const dragRef = useRef<{
    pointerId: number;
    lastX: number;
    lastY: number;
  } | null>(null);

  const zoomIn = useCallback((originX = 0, originY = 0) => {
    setTransform((prev) => zoomPaneView(prev, PANE_ZOOM_STEP, originX, originY));
  }, []);

  const zoomOut = useCallback((originX = 0, originY = 0) => {
    setTransform((prev) =>
      zoomPaneView(prev, 1 / PANE_ZOOM_STEP, originX, originY),
    );
  }, []);

  const fit = useCallback(
    (
      content: { width: number; height: number },
      viewport: { width: number; height: number },
    ) => {
      setTransform(fitPaneView(content, viewport));
    },
    [],
  );

  const reset = useCallback(() => {
    setTransform(DEFAULT_PANE_VIEW);
  }, []);

  const togglePan = useCallback(() => {
    setPanActive((prev) => !prev);
  }, []);

  function onViewportWheel(
    event: WheelEvent<HTMLElement>,
    originX: number,
    originY: number,
  ) {
    event.preventDefault();
    const factor = event.deltaY < 0 ? PANE_ZOOM_STEP : 1 / PANE_ZOOM_STEP;
    setTransform((prev) => zoomPaneView(prev, factor, originX, originY));
  }

  function onPanPointerDown(event: PointerEvent<HTMLElement>) {
    if (!panActive && event.button !== 1) return false;
    dragRef.current = {
      pointerId: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    return true;
  }

  function onPanPointerMove(event: PointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return false;
    const dx = event.clientX - drag.lastX;
    const dy = event.clientY - drag.lastY;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    setTransform((prev) => panPaneView(prev, dx, dy));
    return true;
  }

  function onPanPointerUp(event: PointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    return true;
  }

  return {
    transform,
    panActive,
    setTransform,
    zoomIn,
    zoomOut,
    fit,
    reset,
    togglePan,
    setPanActive,
    onViewportWheel,
    onPanPointerDown,
    onPanPointerMove,
    onPanPointerUp,
  };
}
