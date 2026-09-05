import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import {
  PLAN_VIEW_DEFAULT_MARGIN_MM,
  PLAN_VIEW_ZOOM_STEP,
  clientToPlanPoint,
  clientToPlanPointFromSvg,
  fitPlanViewToBounds,
  panPlanViewByScreen,
  planViewBoxString,
  planViewWorldPerPx,
  screenPxToWorldMm,
  zoomPlanViewToward,
  type PlanViewBounds,
  type PlanViewBox,
} from "../domain/livingRoom/planViewTransform";

type SvgSize = { width: number; height: number };

const FALLBACK_VIEW: PlanViewBox = { minX: -1000, minZ: -1000, width: 8000, height: 6000 };

export function usePlanCanvasNavigation(options: {
  fitBounds: PlanViewBounds | null;
  /** When this key changes, re-fit (new project / room). */
  fitKey: string;
  marginMm?: number;
}) {
  const marginMm = options.marginMm ?? PLAN_VIEW_DEFAULT_MARGIN_MM;
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [svgEl, setSvgEl] = useState<SVGSVGElement | null>(null);
  const setSvgRef = useCallback((node: SVGSVGElement | null) => {
    svgRef.current = node;
    setSvgEl(node);
  }, []);
  const [view, setView] = useState<PlanViewBox>(FALLBACK_VIEW);
  const viewRef = useRef(view);
  viewRef.current = view;
  const [spaceDown, setSpaceDown] = useState(false);
  const [panning, setPanning] = useState(false);
  const panDrag = useRef<{ pointerId: number; lastX: number; lastY: number } | null>(null);
  const fittedKey = useRef<string | null>(null);

  const readSize = useCallback((): SvgSize => {
    const rect = svgRef.current?.getBoundingClientRect();
    return {
      width: Math.max(1, rect?.width ?? 800),
      height: Math.max(1, rect?.height ?? 600),
    };
  }, []);

  const fitToBounds = useCallback((bounds: PlanViewBounds | null) => {
    if (!bounds) return;
    const size = readSize();
    setView(fitPlanViewToBounds(bounds, size.width, size.height, marginMm));
  }, [marginMm, readSize]);

  useEffect(() => {
    if (!options.fitBounds) return;
    if (fittedKey.current === options.fitKey) return;
    fittedKey.current = options.fitKey;
    fitToBounds(options.fitBounds);
  }, [fitToBounds, options.fitBounds, options.fitKey]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.code !== "Space") return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=true]")) return;
      event.preventDefault();
      setSpaceDown(true);
    }
    function onKeyUp(event: KeyboardEvent) {
      if (event.code === "Space") setSpaceDown(false);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    const svg = svgEl;
    if (!svg) return;
    function handleWheel(event: WheelEvent) {
      event.preventDefault();
      const current = viewRef.current;
      const factor = event.ctrlKey
        ? Math.exp(-event.deltaY * 0.01)
        : (event.deltaY < 0 ? PLAN_VIEW_ZOOM_STEP : 1 / PLAN_VIEW_ZOOM_STEP);
      const fromCtm = clientToPlanPointFromSvg(svg!, event.clientX, event.clientY);
      const rect = svg!.getBoundingClientRect();
      const origin = fromCtm ?? clientToPlanPoint(current, event.clientX, event.clientY, rect);
      setView((prev) => zoomPlanViewToward(prev, factor, origin.x, origin.z));
    }
    svg.addEventListener("wheel", handleWheel, { passive: false });
    return () => svg.removeEventListener("wheel", handleWheel);
  }, [svgEl]);

  function worldFromClient(clientX: number, clientY: number) {
    const svg = svgRef.current;
    if (svg) {
      const fromCtm = clientToPlanPointFromSvg(svg, clientX, clientY);
      if (fromCtm) return fromCtm;
    }
    const rect = svg?.getBoundingClientRect();
    if (!rect) return { x: 0, z: 0 };
    return clientToPlanPoint(viewRef.current, clientX, clientY, rect);
  }

  function onWheel(event: ReactWheelEvent<SVGSVGElement>) {
    event.preventDefault();
  }

  function beginPan(event: ReactPointerEvent<SVGSVGElement>) {
    const middle = event.button === 1;
    const space = spaceDown && event.button === 0;
    if (!middle && !space) return false;
    event.preventDefault();
    event.stopPropagation();
    panDrag.current = { pointerId: event.pointerId, lastX: event.clientX, lastY: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
    setPanning(true);
    return true;
  }

  function movePan(event: ReactPointerEvent<SVGSVGElement>) {
    const drag = panDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return false;
    const dx = event.clientX - drag.lastX;
    const dy = event.clientY - drag.lastY;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    const size = readSize();
    setView((prev) => panPlanViewByScreen(prev, dx, dy, size.width, size.height));
    return true;
  }

  function endPan(event: ReactPointerEvent<SVGSVGElement>) {
    const drag = panDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    panDrag.current = null;
    setPanning(false);
    return true;
  }

  const fitPlan = useCallback(() => {
    fitToBounds(options.fitBounds);
  }, [fitToBounds, options.fitBounds]);

  const fitSelectionBounds = useCallback((bounds: PlanViewBounds | null) => {
    if (!bounds) {
      fitPlan();
      return;
    }
    fitToBounds(bounds);
  }, [fitPlan, fitToBounds]);

  const worldPerPx = useCallback(() => {
    const size = readSize();
    return planViewWorldPerPx(viewRef.current, size.width, size.height);
  }, [readSize]);

  const screenToWorldMm = useCallback((screenPx: number) => {
    return screenPxToWorldMm(screenPx, worldPerPx());
  }, [worldPerPx]);

  return {
    svgRef: setSvgRef,
    view,
    viewBox: planViewBoxString(view),
    spaceDown,
    panning,
    onWheel,
    beginPan,
    movePan,
    endPan,
    worldFromClient,
    worldPerPx,
    screenToWorldMm,
    fitPlan,
    fitSelectionBounds,
    setView,
  };
}
