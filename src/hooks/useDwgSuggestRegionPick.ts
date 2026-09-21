import { useEffect, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { Point2Mm } from "../domain/interiorProject";
import { normalizeDwgSuggestRegion, type DwgSuggestPlanRegion } from "../domain/livingRoom";

type Draft = { start: Point2Mm; current: Point2Mm };

export function useDwgSuggestRegionPick(args: {
  enabled: boolean;
  worldPoint: (event: ReactPointerEvent<SVGElement>) => Point2Mm;
  onCommit: (region: DwgSuggestPlanRegion | null) => void;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);

  useEffect(() => {
    if (!args.enabled) setDraft(null);
  }, [args.enabled]);

  function begin(event: ReactPointerEvent<SVGElement>) {
    if (!args.enabled || event.button !== 0) return false;
    event.preventDefault();
    event.stopPropagation();
    const start = args.worldPoint(event);
    setDraft({ start, current: start });
    event.currentTarget.setPointerCapture(event.pointerId);
    return true;
  }

  function move(event: ReactPointerEvent<SVGElement>) {
    if (!draft) return false;
    setDraft({ ...draft, current: args.worldPoint(event) });
    return true;
  }

  function finish() {
    if (!draft) return false;
    args.onCommit(normalizeDwgSuggestRegion(draft.start, draft.current));
    setDraft(null);
    return true;
  }

  const rect = draft ? normalizeDwgSuggestRegion(draft.start, draft.current) : null;
  return { draftRect: rect, begin, move, finish };
}
