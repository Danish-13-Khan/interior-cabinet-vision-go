import {
  useRef,
  useState,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import type {
  CabinetPlacement,
  CabinetProject,
} from "../domain/cabinetDimensions";
import type { SnapGuide } from "../domain/placementSnap";
import type { TechnicalViewKind } from "../domain/technicalViews";
import type { RoomConfig } from "../domain/roomModel";
import {
  createDraftingId,
  type DraftingLeader,
  type DraftingNote,
  type DraftingWorldPoint,
} from "../domain/draftingAnnotations";
import type { DraftingTool } from "../components/twoDView/types";
import {
  proposePlacement,
  worldFromClient,
  type TechnicalViewMetrics,
} from "../components/twoDView/placementHelpers";

type DragState = {
  cabinetId: string;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  originPlacement: CabinetPlacement;
  moved: boolean;
};

type UseTwoDPointerArgs = {
  hostRef: RefObject<HTMLDivElement | null>;
  technicalViewRef: MutableRefObject<TechnicalViewMetrics>;
  project: CabinetProject;
  room: RoomConfig;
  view: TechnicalViewKind;
  snapSizeMm: number;
  draftingTool: DraftingTool;
  onSelectCabinet?: (cabinetId: string | null, additive: boolean) => void;
  onSelectOpening?: (cabinetId: string, openingId: string) => void;
  onCabinetMove?: (cabinetId: string, placement: CabinetPlacement) => boolean;
  onAddNote?: (note: DraftingNote) => void;
  onAddLeader?: (leader: DraftingLeader) => void;
};

export function useTwoDPointer({
  hostRef,
  technicalViewRef,
  project,
  room,
  view,
  snapSizeMm,
  draftingTool,
  onSelectCabinet,
  onSelectOpening,
  onCabinetMove,
  onAddNote,
  onAddLeader,
}: UseTwoDPointerArgs) {
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

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (draftingTool !== "select") return;

    const target = event.target as Element | null;
    const openingNode = target?.closest?.("[data-opening-id]");
    const openingId = openingNode?.getAttribute("data-opening-id");
    const openingCabinetId = openingNode?.getAttribute("data-cabinet-id");
    if (openingId && openingCabinetId && onSelectOpening && (view === "front" || view === "side")) {
      onSelectOpening(openingCabinetId, openingId);
      return;
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
      project,
      room,
      view,
      technicalViewRef.current,
      hostRef.current,
      snapSizeMm,
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
      const world = worldFromClient(
        hostRef.current,
        technicalViewRef.current,
        view,
        room.dimensions.heightMm,
        event.clientX,
        event.clientY,
      );
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
      const world = worldFromClient(
        hostRef.current,
        technicalViewRef.current,
        view,
        room.dimensions.heightMm,
        event.clientX,
        event.clientY,
      );
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

  return {
    snapGuides,
    ghostPlacement,
    leaderTarget,
    handlePointerDown,
    handlePointerMove,
    endDrag,
    handleClick,
  };
}
