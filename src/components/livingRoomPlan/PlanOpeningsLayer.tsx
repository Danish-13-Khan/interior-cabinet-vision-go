import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { InteriorProject } from "../../domain/interiorProject";
import {
  moveOpeningOffset,
  resizeOpeningFromStart,
  resizeOpeningWidth,
} from "../../domain/livingRoom";
import { PlanOpeningGroup } from "./PlanOpeningGroup";

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
  worldPoint: (event: ReactPointerEvent<SVGSVGElement>) => { x: number; z: number };
  onSelectOpening: (openingId: string) => void;
  onMoveOpening: (openingId: string, offsetMm: number) => void;
  onResizeOpening: (openingId: string, widthMm: number, offsetMm?: number) => void;
}) {
  const [openingPreview, setOpeningPreview] = useState<OpeningPreview | null>(null);
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
    if (activeDrag.mode === "move") {
      offsetMm = moveOpeningOffset({
        startOffsetMm: activeDrag.offsetMm,
        widthMm: activeDrag.widthMm,
        wallLengthMm: length,
        deltaMm: delta,
        snapMm: input.snapSizeMm,
      });
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
  }

  return {
    openingPreview,
    startOpeningDrag,
    openingDragMove,
    finishOpeningDrag,
  };
}

export function PlanOpeningsLayer({
  project,
  activeOpeningId,
  openingPreview,
  onSelectOpening,
  onStartDrag,
}: {
  project: InteriorProject;
  activeOpeningId: string | null;
  openingPreview: OpeningPreview | null;
  onSelectOpening: (openingId: string) => void;
  onStartDrag: (
    event: ReactPointerEvent<SVGGElement | SVGCircleElement>,
    openingId: string,
    mode: "move" | "resize-start" | "resize-end",
  ) => void;
}) {
  return (
    <>
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
              onSelect={onSelectOpening}
              onStartDrag={onStartDrag}
            />
          );
        })}
    </>
  );
}
