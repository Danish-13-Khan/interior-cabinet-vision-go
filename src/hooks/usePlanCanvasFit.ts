import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { planCanvasCssSize } from "../domain/livingRoom/planCanvasCssSize";
import { fitPlanViewToBounds, type PlanViewBounds, type PlanViewBox } from "../domain/livingRoom/planViewTransform";

export function usePlanCanvasFit(options: {
  svg: SVGSVGElement | null;
  fitBounds: PlanViewBounds | null;
  fitKey: string;
  marginMm: number;
  setView: Dispatch<SetStateAction<PlanViewBox>>;
}) {
  const fittedKey = useRef<string | null>(null);
  const { svg, fitBounds, fitKey, marginMm, setView } = options;

  const applyFit = useCallback((bounds: PlanViewBounds | null, key?: string) => {
    if (!bounds) return false;
    const size = planCanvasCssSize(svg?.getBoundingClientRect());
    if (!size) return false;
    setView(fitPlanViewToBounds(bounds, size.width, size.height, marginMm));
    if (key !== undefined) fittedKey.current = key;
    return true;
  }, [marginMm, setView, svg]);

  useEffect(() => {
    if (!fitBounds || fittedKey.current === fitKey) return;
    if (applyFit(fitBounds, fitKey)) return;
    let tries = 0;
    let frame = 0;
    const retry = () => {
      tries += 1;
      if (applyFit(fitBounds, fitKey) || tries > 24) return;
      frame = requestAnimationFrame(retry);
    };
    frame = requestAnimationFrame(retry);
    return () => cancelAnimationFrame(frame);
  }, [applyFit, fitBounds, fitKey]);

  useEffect(() => {
    if (!svg || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (fittedKey.current === fitKey) return;
      applyFit(fitBounds, fitKey);
    });
    observer.observe(svg);
    return () => observer.disconnect();
  }, [applyFit, fitBounds, fitKey, svg]);

  return {
    fitToBounds: (bounds: PlanViewBounds | null) => {
      applyFit(bounds);
    },
  };
}
