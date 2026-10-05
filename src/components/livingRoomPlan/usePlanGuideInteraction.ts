import { useEffect, useMemo, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { InteriorProject } from "../../domain/interiorProject";
import type { BuildTool } from "../../domain/livingRoom/buildToolCommands";
import {
  addPlanGuide,
  createPlanGuideId,
  getPlanGuides,
  removePlanGuide,
  updatePlanGuide,
  type PlanGuide,
} from "../../domain/livingRoom/planGuides";

type PatchDocument = (update: (current: InteriorProject) => InteriorProject, status: string) => void;
type GuideDrag = { guide: PlanGuide; start: number; preview: number };

function isEditableTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

/** Guides tool: click places, drag moves (one commit on release), Delete removes the selected guide. */
export function usePlanGuideInteraction(input: {
  project: InteriorProject;
  tool: BuildTool;
  snapSizeMm: number;
  worldPoint: (event: ReactPointerEvent<SVGSVGElement>) => { x: number; z: number };
  onPatchDocument?: PatchDocument;
  onClearSelection: () => void;
  /** Ids of the app's selected objects, wall, opening, surface and light; any new selection drops the guide's. */
  otherSelectionKey: string;
}) {
  const stored = useMemo(() => getPlanGuides(input.project), [input.project]);
  const placingAxis = input.tool === "place-guide-x" ? "x" : input.tool === "place-guide-z" ? "z" : null;
  const interactive = Boolean(input.onPatchDocument) && (input.tool === "select" || placingAxis !== null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drag, setDrag] = useState<GuideDrag | null>(null);
  const patch = input.onPatchDocument;
  const selected = stored.find((guide) => guide.id === selectedId) ?? null;

  useEffect(() => {
    if (selectedId && !selected) setSelectedId(null);
  }, [selected, selectedId]);

  useEffect(() => {
    if (input.otherSelectionKey) setSelectedId(null);
  }, [input.otherSelectionKey]);

  function deselectUnlessGuide(event: ReactPointerEvent<Element>) {
    if (!(event.target as Element).closest?.("[data-guide-id]")) setSelectedId(null);
  }

  useEffect(() => {
    if (!selected || !patch) return;
    const onKey = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;
      if (event.key === "Escape") { setSelectedId(null); return; }
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      if (selected.locked) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setSelectedId(null);
      patch((current) => removePlanGuide(current, selected.id), `Removed guide ${selected.label ?? ""}`.trim() + ".");
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [patch, selected]);

  const snap = (value: number) => Math.round(value / input.snapSizeMm) * input.snapSizeMm;
  const along = (axis: PlanGuide["axis"], event: ReactPointerEvent<Element>) => {
    const point = input.worldPoint(event as unknown as ReactPointerEvent<SVGSVGElement>);
    return axis === "x" ? point.x : point.z;
  };

  function place(event: ReactPointerEvent<Element>): boolean {
    if (!placingAxis || !patch || event.button !== 0) return false;
    if ((event.target as Element).closest?.("[data-guide-id]")) return false;
    event.preventDefault();
    event.stopPropagation();
    const id = createPlanGuideId();
    const positionMm = snap(along(placingAxis, event));
    patch((current) => addPlanGuide(current, { axis: placingAxis, positionMm, id }), "Placed plan guide.");
    setSelectedId(id);
    return true;
  }

  function start(event: ReactPointerEvent<SVGElement>, guide: PlanGuide) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    input.onClearSelection();
    setSelectedId(guide.id);
    if (guide.locked || !patch) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ guide, start: along(guide.axis, event), preview: guide.positionMm });
  }

  function move(event: ReactPointerEvent<SVGSVGElement>): boolean {
    if (!drag) return false;
    const preview = snap(drag.guide.positionMm + along(drag.guide.axis, event) - drag.start);
    if (preview !== drag.preview) setDrag({ ...drag, preview });
    return true;
  }

  function finish(): boolean {
    if (!drag) return false;
    const { guide, preview } = drag;
    setDrag(null);
    if (preview !== guide.positionMm && patch) {
      patch((current) => updatePlanGuide(current, guide.id, { positionMm: preview }), "Moved plan guide.");
    }
    return true;
  }

  const guides = drag
    ? stored.map((guide) => (guide.id === drag.guide.id ? { ...guide, positionMm: drag.preview } : guide))
    : stored;
  return {
    guides, stored, selectedId, interactive, placing: placingAxis !== null, dragging: Boolean(drag),
    place, start, move, finish, deselectUnlessGuide,
  };
}
