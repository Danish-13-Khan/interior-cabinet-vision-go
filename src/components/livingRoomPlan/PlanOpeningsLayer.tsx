import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { InteriorProject } from "../../domain/interiorProject";
import {
  resizeOpeningFromStart,
  resizeOpeningWidth,
  snapOpeningOffset,
  type PlanDisplayUnit,
} from "../../domain/livingRoom";
import type { PlanSnapResult } from "../../domain/livingRoom/planSnapEngine";
import { PlanOpeningGroup } from "./PlanOpeningGroup";
import { PlanSnapMarker } from "./PlanSnapMarker";

type OpeningDrag = {
  openingId: string;
  mode: "move" | "resize-start" | "resize-end";
  startPoint: { x: number; z: number };
  offsetMm: number;
  widthMm: number;
};

type OpeningPreview = { id: string; offsetMm: number; widthMm: number };

export function usePlanOpeningInteraction(input: {
  project: InteriorProject;
  snapSizeMm: number;
  /** Zoom-aware pick radius in mm for the along-wall targets (Phase 4); 0 disables them. */
  thresholdMm?: number;
  worldPoint: (event: ReactPointerEvent<SVGSVGElement>) => { x: number; z: number };
  onSelectOpening: (openingId: string) => void;
  onMoveOpening: (openingId: string, offsetMm: number) => void;
  onResizeOpening: (openingId: string, widthMm: number, offsetMm?: number) => void;
}) {
  const [openingPreview, setOpeningPreview] = useState<OpeningPreview | null>(null);
  const [openingSnap, setOpeningSnap] = useState<PlanSnapResult | null>(null);
  const openingDragRef = useRef<OpeningDrag | null>(null);
  const openingPreviewRef = useRef<OpeningPreview | null>(null);

  function startOpeningDrag(
    event: ReactPointerEvent<SVGGElement | SVGCircleElement>,
    openingId: string,
    mode: OpeningDrag["mode"],
  ) {
    if (event.button !== 0) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const opening = input.project.openings.find((item) => item.id === openingId);
    if (!opening) return;
    input.onSelectOpening(openingId);
    const nextDrag: OpeningDrag = {
      openingId,
      mode,
      startPoint: input.worldPoint(event as unknown as ReactPointerEvent<SVGSVGElement>),
      offsetMm: opening.offsetMm,
      widthMm: opening.widthMm,
    };
    const nextPreview = { id: openingId, offsetMm: opening.offsetMm, widthMm: opening.widthMm };
    openingDragRef.current = nextDrag;
    openingPreviewRef.current = nextPreview;
    setOpeningPreview(nextPreview);
    setOpeningSnap(null);
  }

  function openingDragMove(event: ReactPointerEvent<SVGSVGElement>) {
    const activeDrag = openingDragRef.current;
    if (!activeDrag) return false;
    const opening = input.project.openings.find((item) => item.id === activeDrag.openingId);
    const wall = opening && input.project.walls.find((item) => item.id === opening.wallId);
    if (!opening || !wall) return true;
    const point = input.worldPoint(event);
    const dx = wall.end.x - wall.start.x;
    const dz = wall.end.z - wall.start.z;
    const length = Math.max(1, Math.hypot(dx, dz));
    const delta = ((point.x - activeDrag.startPoint.x) * dx + (point.z - activeDrag.startPoint.z) * dz) / length;
    let offsetMm = activeDrag.offsetMm;
    let widthMm = activeDrag.widthMm;
    let snap: PlanSnapResult | null = null;
    if (activeDrag.mode === "move") {
      // Centre follows the pointer; the along-wall targets or the grid decide where it lands.
      const result = snapOpeningOffset(input.project, wall, {
        centreMm: activeDrag.offsetMm + activeDrag.widthMm / 2 + delta,
        widthMm: activeDrag.widthMm,
        excludeOpeningId: opening.id,
        thresholdMm: event.altKey ? 0 : input.thresholdMm ?? 0,
        gridMm: input.snapSizeMm,
      });
      offsetMm = result.offsetMm;
      snap = result.snap;
    } else if (activeDrag.mode === "resize-end") {
      widthMm = resizeOpeningWidth({
        startWidthMm: activeDrag.widthMm,
        offsetMm: activeDrag.offsetMm,
        wallLengthMm: length,
        deltaMm: delta,
        snapMm: input.snapSizeMm,
      });
    } else {
      const resized = resizeOpeningFromStart({
        startOffsetMm: activeDrag.offsetMm,
        startWidthMm: activeDrag.widthMm,
        wallLengthMm: length,
        deltaMm: delta,
        snapMm: input.snapSizeMm,
      });
      offsetMm = resized.offsetMm;
      widthMm = resized.widthMm;
    }
    const nextPreview = { id: opening.id, offsetMm, widthMm };
    openingPreviewRef.current = nextPreview;
    setOpeningPreview(nextPreview);
    setOpeningSnap(snap);
    return true;
  }

  function finishOpeningDrag() {
    const activeDrag = openingDragRef.current;
    const activePreview = openingPreviewRef.current;
    if (activeDrag && activePreview) {
      if (activeDrag.mode === "move") {
        input.onMoveOpening(activeDrag.openingId, activePreview.offsetMm);
      } else if (activeDrag.mode === "resize-end") {
        input.onResizeOpening(activeDrag.openingId, activePreview.widthMm);
      } else {
        input.onResizeOpening(activeDrag.openingId, activePreview.widthMm, activePreview.offsetMm);
      }
    }
    openingDragRef.current = null;
    openingPreviewRef.current = null;
    setOpeningPreview(null);
    setOpeningSnap(null);
  }

  return {
    openingPreview,
    openingSnap,
    startOpeningDrag,
    openingDragMove,
    finishOpeningDrag,
  };
}

export function PlanOpeningsLayer({
  project,
  activeOpeningId,
  openingPreview,
  snap = null,
  markerMm,
  onSelectOpening,
  onStartDrag,
  unit,
  interactive = true,
}: {
  project: InteriorProject;
  activeOpeningId: string | null;
  openingPreview: OpeningPreview | null;
  /** Along-wall target the dragged opening landed on (Phase 4). */
  snap?: PlanSnapResult | null;
  markerMm?: number;
  onSelectOpening: (openingId: string) => void;
  onStartDrag: (
    event: ReactPointerEvent<SVGGElement | SVGCircleElement>,
    openingId: string,
    mode: "move" | "resize-start" | "resize-end",
  ) => void;
  unit: PlanDisplayUnit;
  interactive?: boolean;
}) {
  const startDrag = interactive ? onStartDrag : (() => undefined);
  return (
    <g className="lr-plan-openings-layer" data-testid="lr-plan-openings-layer">
      {project.openings
        .filter((opening) => opening.extensions?.layerVisible !== false)
        .map((opening) => {
          const wall = project.walls.find((item) => item.id === opening.wallId);
          if (!wall) return null;
          return (
            <PlanOpeningGroup
              key={opening.id}
              opening={opening}
              wall={wall}
              preview={openingPreview}
              active={opening.id === activeOpeningId}
              onSelect={interactive ? onSelectOpening : () => undefined}
              onStartDrag={startDrag}
              unit={unit}
            />
          );
        })}
      {snap ? <PlanSnapMarker snap={snap} sizeMm={markerMm ?? 40} testId="lr-opening-snap" /> : null}
    </g>
  );
}
