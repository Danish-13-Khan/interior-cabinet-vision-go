import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type {
  CabinetPlacement,
  CabinetProject,
} from "../domain/cabinetDimensions";
import type { CabinetRun, CountertopSegment, RunFiller } from "../domain/cabinetLibrary";
import type { SnapGuide } from "../domain/placementSnap";
import { snapElevationHeight, snapPlanPlacement } from "../domain/placementSnap";
import {
  createTechnicalView,
  elevationFrontSvgToWorldMm,
  elevationSideSvgToWorldMm,
  planSvgToWorldMm,
  type TechnicalViewKind,
} from "../domain/technicalViews";
import type { RoomConfig } from "../domain/roomModel";
import {
  clampDraftingDisplay,
  createDraftingId,
  worldPointForView,
  type DraftingDisplayPreferences,
  type DraftingLeader,
  type DraftingNote,
  type DraftingWorldPoint,
} from "../domain/draftingAnnotations";

export type DraftingTool = "select" | "note" | "leader";

type TwoDViewProps = {
  project: CabinetProject;
  room: RoomConfig;
  view: TechnicalViewKind;
  countertops?: CountertopSegment[];
  runs?: CabinetRun[];
  fillers?: RunFiller[];
  selectedCabinetIds?: string[];
  activeCabinetId?: string | null;
  activeOpeningId?: string | null;
  snapSizeMm?: number;
  showGrid?: boolean;
  draftingDisplay?: DraftingDisplayPreferences;
  draftingTool?: DraftingTool;
  onSelectCabinet?: (cabinetId: string | null, additive: boolean) => void;
  onSelectOpening?: (cabinetId: string, openingId: string) => void;
  onCabinetMove?: (cabinetId: string, placement: CabinetPlacement) => boolean;
  onAddNote?: (note: DraftingNote) => void;
  onAddLeader?: (leader: DraftingLeader) => void;
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
  runs = [],
  fillers = [],
  selectedCabinetIds = [],
  activeCabinetId = null,
  activeOpeningId = null,
  snapSizeMm = 50,
  showGrid = true,
  draftingDisplay,
  draftingTool = "select",
  onSelectCabinet,
  onSelectOpening,
  onCabinetMove,
  onAddNote,
  onAddLeader,
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
  const [leaderTarget, setLeaderTarget] = useState<DraftingWorldPoint | null>(null);

  const display = clampDraftingDisplay(draftingDisplay ?? project.preferences?.drafting);

  const technicalView = useMemo(
    () =>
      createTechnicalView(project, room, view, countertops, {
        selectedCabinetIds,
        activeCabinetId,
        activeOpeningId,
        mode: "interactive",
        showGrid,
        showDimensionChains: display.showDimensionChains,
        showWallLabels: display.showWallLabels,
        showCabinetTags: display.showCabinetTags,
        showOpeningTags: display.showOpeningTags,
        showApplianceTags: display.showApplianceTags,
        showElevationDetails: true,
        dimMinSegmentMm: display.dimMinSegmentMm,
        snapGuides,
        ghostPlacement,
        runs,
        fillers,
        drafting: project.drafting,
      }),
    [
      activeCabinetId,
      activeOpeningId,
      countertops,
      display.dimMinSegmentMm,
      display.showApplianceTags,
      display.showCabinetTags,
      display.showDimensionChains,
      display.showOpeningTags,
      display.showWallLabels,
      fillers,
      ghostPlacement,
      project,
      room,
      runs,
      selectedCabinetIds,
      showGrid,
      snapGuides,
      view,
    ],
  );

  function worldFromClient(clientX: number, clientY: number): DraftingWorldPoint | null {
    const host = hostRef.current;
    const svg = host?.querySelector("svg");
    if (!svg) return null;
    const bounds = svg.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return null;
    const scaleX = technicalView.width / bounds.width;
    const scaleY = technicalView.height / bounds.height;
    const svgX = (clientX - bounds.left) * scaleX;
    const svgY = (clientY - bounds.top) * scaleY;
    if (view === "front") {
      const point = elevationFrontSvgToWorldMm(
        svgX,
        svgY,
        technicalView.originX,
        technicalView.originY,
        room.dimensions.heightMm,
        technicalView.scale,
      );
      return worldPointForView(view, { x: point.x, y: point.y, z: 0 });
    }
    if (view === "side") {
      const point = elevationSideSvgToWorldMm(
        svgX,
        svgY,
        technicalView.originX,
        technicalView.originY,
        room.dimensions.heightMm,
        technicalView.scale,
      );
      return worldPointForView(view, { x: 0, y: point.y, z: point.z });
    }
    const point = planSvgToWorldMm(
      svgX,
      svgY,
      technicalView.originX,
      technicalView.originY,
      technicalView.scale,
    );
    return worldPointForView(view, { x: point.x, y: 0, z: point.z });
  }

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

    const others = project.cabinets.filter((item) => item.id !== cabinetId);
    const snapped = snapPlanPlacement({
      cabinet,
      others,
      proposed: next,
      roomWidthMm: room.dimensions.widthMm,
      roomDepthMm: room.dimensions.depthMm,
      gridSizeMm: snapSizeMm,
    });

    if (view === "front") {
      const sillHeights = room.windows
        .filter((item) => item.side === "back-wall")
        .map((item) => item.sillHeightMm);
      const heightSnap = snapElevationHeight({
        proposedY: next.y,
        heightMm: cabinet.config.dimensions.height,
        others: others.filter(
          (item) =>
            item.placement.attachment === "floor" ||
            item.placement.attachment === "back-wall",
        ),
        roomHeightMm: room.dimensions.heightMm,
        gridSizeMm: snapSizeMm,
        sillHeightsMm: sillHeights,
      });
      return {
        placement: {
          ...snapped.placement,
          y: origin.attachment === "floor" ? 0 : heightSnap.y,
          z: origin.z,
        },
        guides: [
          ...snapped.guides.filter((guide) => guide.axis === "x"),
          ...(origin.attachment === "floor" ? [] : heightSnap.guides),
        ],
      };
    }

    if (view === "side") {
      const sillHeights = room.windows
        .filter((item) => item.side === "left-wall" || item.side === "right-wall")
        .map((item) => item.sillHeightMm);
      const heightSnap = snapElevationHeight({
        proposedY: next.y,
        heightMm: cabinet.config.dimensions.height,
        others: others.filter(
          (item) =>
            item.placement.attachment === "floor" ||
            item.placement.attachment === "left-wall" ||
            item.placement.attachment === "right-wall",
        ),
        roomHeightMm: room.dimensions.heightMm,
        gridSizeMm: snapSizeMm,
        sillHeightsMm: sillHeights,
      });
      return {
        placement: {
          ...snapped.placement,
          x: origin.x,
          y: origin.attachment === "floor" ? 0 : heightSnap.y,
        },
        guides: [
          ...snapped.guides.filter((guide) => guide.axis === "z"),
          ...(origin.attachment === "floor" ? [] : heightSnap.guides),
        ],
      };
    }

    return snapped;
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (draftingTool !== "select") return;

    const target = event.target as Element | null;
    const openingNode = target?.closest?.("[data-opening-id]");
    const openingId = openingNode?.getAttribute("data-opening-id");
    const openingCabinetId = openingNode?.getAttribute("data-cabinet-id");
    if (openingId && openingCabinetId && onSelectOpening && (view === "front" || view === "side")) {
      onSelectOpening(openingCabinetId, openingId);
      // Still allow drag from opening face for cabinet move
    }

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

    if (draftingTool === "note" && onAddNote) {
      const world = worldFromClient(event.clientX, event.clientY);
      if (!world) return;
      const text = window.prompt("Annotation note:", "Site note");
      if (!text?.trim()) return;
      onAddNote({
        id: createDraftingId("note"),
        view,
        text: text.trim(),
        anchor: world,
      });
      return;
    }

    if (draftingTool === "leader" && onAddLeader) {
      const world = worldFromClient(event.clientX, event.clientY);
      if (!world) return;
      if (!leaderTarget) {
        setLeaderTarget(world);
        return;
      }
      const text = window.prompt("Leader callout:", "Callout");
      if (!text?.trim()) {
        setLeaderTarget(null);
        return;
      }
      onAddLeader({
        id: createDraftingId("leader"),
        view,
        text: text.trim(),
        target: leaderTarget,
        label: world,
      });
      setLeaderTarget(null);
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
      className={`technical-view drafting-tool-${draftingTool} ${snapGuides.length > 0 ? "is-dragging" : ""}`}
      style={{ width: technicalView.width, height: technicalView.height }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClick={handleClick}
    >
      {leaderTarget ? (
        <div className="drafting-tool-hint">Leader: click label position</div>
      ) : null}
      <div
        className="technical-view-svg"
        dangerouslySetInnerHTML={{ __html: technicalView.svg }}
      />
    </div>
  );
}
