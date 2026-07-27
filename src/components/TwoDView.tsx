import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type {
  CabinetPlacement,
  CabinetProject,
} from "../domain/cabinetDimensions";
import type { CountertopSegment } from "../domain/cabinetLibrary";
import type { SnapGuide } from "../domain/placementSnap";
import { snapPlanPlacement } from "../domain/placementSnap";
import {
  createTechnicalView,
  type TechnicalViewKind,
} from "../domain/technicalViews";
import type { RoomConfig } from "../domain/roomModel";

type TwoDViewProps = {
  project: CabinetProject;
  room: RoomConfig;
  view: TechnicalViewKind;
  countertops?: CountertopSegment[];
  selectedCabinetIds?: string[];
  activeCabinetId?: string | null;
  snapSizeMm?: number;
  showGrid?: boolean;
  onSelectCabinet?: (cabinetId: string | null, additive: boolean) => void;
  onCabinetMove?: (cabinetId: string, placement: CabinetPlacement) => boolean;
};

type DragState = {
  cabinetId: string;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  originPlacement: CabinetPlacement;
  moved: boolean;
};

export function TwoDView({
  project,
  room,
  view,
  countertops,
  selectedCabinetIds = [],
  activeCabinetId = null,
  snapSizeMm = 50,
  showGrid = true,
  onSelectCabinet,
  onCabinetMove,
}: TwoDViewProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([]);
  const [ghostPlacement, setGhostPlacement] = useState<{
    cabinetId: string;
    x: number;
    y: number;
    z: number;
  } | null>(null);

  const technicalView = useMemo(
    () =>
      createTechnicalView(project, room, view, countertops, {
        selectedCabinetIds,
        activeCabinetId,
        mode: "interactive",
        showGrid,
        showDimensionChains: true,
        showWallLabels: true,
        showElevationDetails: true,
        snapGuides,
        ghostPlacement,
      }),
    [
      activeCabinetId,
      countertops,
      ghostPlacement,
      project,
      room,
      selectedCabinetIds,
      showGrid,
      snapGuides,
      view,
    ],
  );

  function proposePlacement(
    cabinetId: string,
    origin: CabinetPlacement,
    clientX: number,
    clientY: number,
    startClientX: number,
    startClientY: number,
  ): { placement: CabinetPlacement; guides: SnapGuide[] } | null {
    const cabinet = project.cabinets.find((item) => item.id === cabinetId);
    const host = hostRef.current;
    const svg = host?.querySelector("svg");
    if (!cabinet || !svg) return null;

    const bounds = svg.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return null;

    const scaleX = technicalView.width / bounds.width;
    const scaleY = technicalView.height / bounds.height;
    const dxSvg = (clientX - startClientX) * scaleX;
    const dySvg = (clientY - startClientY) * scaleY;
    const deltaX = dxSvg * technicalView.scale;
    const deltaY = -dySvg * technicalView.scale;
    const deltaZ = dySvg * technicalView.scale;

    let next: CabinetPlacement = { ...origin };
    if (view === "top") {
      next = {
        ...origin,
        x: origin.x + deltaX,
        z: origin.z + deltaZ,
      };
    } else if (view === "front") {
      next = {
        ...origin,
        x: origin.x + deltaX,
        y: Math.max(0, origin.y + deltaY),
      };
    } else {
      next = {
        ...origin,
        z: origin.z + deltaX,
        y: Math.max(0, origin.y + deltaY),
      };
    }

    const snapped = snapPlanPlacement({
      cabinet,
      others: project.cabinets.filter((item) => item.id !== cabinetId),
      proposed: next,
      roomWidthMm: room.dimensions.widthMm,
      roomDepthMm: room.dimensions.depthMm,
      gridSizeMm: snapSizeMm,
    });

    if (view === "front") {
      return {
        placement: {
          ...snapped.placement,
          y: Math.round(next.y / snapSizeMm) * snapSizeMm,
          z: origin.z,
        },
        guides: snapped.guides.filter((guide) => guide.axis === "x"),
      };
    }

    if (view === "side") {
      return {
        placement: {
          ...snapped.placement,
          x: origin.x,
          y: Math.round(next.y / snapSizeMm) * snapSizeMm,
        },
        guides: snapped.guides.filter((guide) => guide.axis === "z"),
      };
    }

    return snapped;
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const target = event.target as Element | null;
    const cabinetNode = target?.closest?.("[data-cabinet-id]");
    const cabinetId = cabinetNode?.getAttribute("data-cabinet-id");
    if (!cabinetId) return;

    const cabinet = project.cabinets.find((item) => item.id === cabinetId);
    if (!cabinet) return;

    const additive = event.metaKey || event.ctrlKey || event.shiftKey;
    onSelectCabinet?.(cabinetId, additive);

    if (!onCabinetMove) return;

    dragRef.current = {
      cabinetId,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originPlacement: { ...cabinet.placement },
      moved: false,
    };
    suppressClickRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !onCabinetMove) return;

    const dx = event.clientX - drag.startClientX;
    const dy = event.clientY - drag.startClientY;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;

    drag.moved = true;
    suppressClickRef.current = true;

    const proposed = proposePlacement(
      drag.cabinetId,
      drag.originPlacement,
      event.clientX,
      event.clientY,
      drag.startClientX,
      drag.startClientY,
    );
    if (!proposed) return;

    setSnapGuides(proposed.guides);
    setGhostPlacement({
      cabinetId: drag.cabinetId,
      x: proposed.placement.x,
      y: proposed.placement.y,
      z: proposed.placement.z,
    });
    onCabinetMove(drag.cabinetId, proposed.placement);
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragRef.current = null;
    setSnapGuides([]);
    setGhostPlacement(null);
  }

  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (!onSelectCabinet) return;

    const target = event.target as Element | null;
    const cabinetNode = target?.closest?.("[data-cabinet-id]");
    const cabinetId = cabinetNode?.getAttribute("data-cabinet-id") ?? null;
    const additive = event.metaKey || event.ctrlKey || event.shiftKey;

    if (!cabinetId && !additive) {
      onSelectCabinet(null, false);
    }
  }

  return (
    <div
      ref={hostRef}
      className={`technical-view ${snapGuides.length > 0 ? "is-dragging" : ""}`}
      style={{ width: technicalView.width, height: technicalView.height }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: technicalView.svg }}
    />
  );
}
