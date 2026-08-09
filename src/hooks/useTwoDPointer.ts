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
  clampProjectDrafting,
  createDraftingId,
  type DraftingLeader,
  type DraftingNote,
  type DraftingViewTarget,
  type DraftingWorldPoint,
} from "../domain/draftingAnnotations";
import {
  getDimOffset,
  getTagOffset,
  type TechnicalObjectSelection,
} from "../domain/draftingEdit";
import type { DraftingTool } from "../components/twoDView/types";
import {
  proposePlacement,
  svgDeltaFromClient,
  worldFromClient,
  type TechnicalViewMetrics,
} from "../components/twoDView/placementHelpers";

function draftingViewFor(view: TechnicalViewKind): DraftingViewTarget {
  if (view === "section" || view === "detail") return "side";
  if (view === "report") return "all";
  return view;
}

type CabinetDrag = {
  kind: "cabinet";
  cabinetId: string;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  originPlacement: CabinetPlacement;
  moved: boolean;
};

type DimDrag = {
  kind: "dim";
  id: string;
  axis: "x" | "y" | "both";
  freeAxis: boolean;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  originDx: number;
  originDy: number;
  moved: boolean;
};

type TagDrag = {
  kind: "tag";
  cabinetId: string;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  originDx: number;
  originDy: number;
  moved: boolean;
};

type NoteDrag = {
  kind: "note";
  id: string;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  moved: boolean;
};

type LeaderDrag = {
  kind: "leader";
  id: string;
  handle: "target" | "label";
  pointerId: number;
  startClientX: number;
  startClientY: number;
  moved: boolean;
};

type DragState = CabinetDrag | DimDrag | TagDrag | NoteDrag | LeaderDrag;

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
  onSelectDraftObject?: (selection: TechnicalObjectSelection) => void;
  onCabinetMove?: (cabinetId: string, placement: CabinetPlacement) => boolean;
  onAddNote?: (note: DraftingNote) => void;
  onAddLeader?: (leader: DraftingLeader) => void;
  onUpdateNote?: (note: DraftingNote) => void;
  onUpdateLeader?: (leader: DraftingLeader) => void;
  onUpsertDimOffset?: (id: string, dx: number, dy: number) => void;
  onUpsertTagOffset?: (cabinetId: string, dx: number, dy: number) => void;
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
  onSelectDraftObject,
  onCabinetMove,
  onAddNote,
  onAddLeader,
  onUpdateNote,
  onUpdateLeader,
  onUpsertDimOffset,
  onUpsertTagOffset,
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
      onSelectDraftObject?.({
        kind: "opening",
        cabinetId: openingCabinetId,
        openingId,
      });
      return;
    }

    const noteNode = target?.closest?.("[data-note-id]");
    const noteId = noteNode?.getAttribute("data-note-id");
    if (noteId && onUpdateNote) {
      onSelectDraftObject?.({ kind: "note", id: noteId });
      onSelectCabinet?.(null, false);
      dragRef.current = {
        kind: "note",
        id: noteId,
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        moved: false,
      };
      suppressClickRef.current = false;
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    const leaderNode = target?.closest?.("[data-leader-id]");
    const leaderId = leaderNode?.getAttribute("data-leader-id");
    const leaderHandle =
      (leaderNode?.getAttribute("data-leader-handle") as "target" | "label" | null) ??
      "label";
    if (leaderId && onUpdateLeader) {
      onSelectDraftObject?.({ kind: "leader", id: leaderId });
      onSelectCabinet?.(null, false);
      dragRef.current = {
        kind: "leader",
        id: leaderId,
        handle: leaderHandle,
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        moved: false,
      };
      suppressClickRef.current = false;
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    const dimNode = target?.closest?.("[data-dim-id]");
    const dimId = dimNode?.getAttribute("data-dim-id");
    if (dimId && onUpsertDimOffset) {
      const drafting = clampProjectDrafting(project.drafting);
      const origin = getDimOffset(drafting.dimOffsets, dimId);
      const axisAttr = dimNode?.getAttribute("data-dim-axis");
      const axis =
        axisAttr === "x" ? "x" : axisAttr === "both" ? "both" : "y";
      onSelectDraftObject?.({ kind: "dim", id: dimId });
      onSelectCabinet?.(null, false);
      dragRef.current = {
        kind: "dim",
        id: dimId,
        axis,
        freeAxis: event.shiftKey || axisAttr === "both",
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        originDx: origin.dx,
        originDy: origin.dy,
        moved: false,
      };
      suppressClickRef.current = false;
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    const tagNode = target?.closest?.("[data-tag-cabinet-id]");
    const tagCabinetId = tagNode?.getAttribute("data-tag-cabinet-id");
    if (tagCabinetId && onUpsertTagOffset) {
      const drafting = clampProjectDrafting(project.drafting);
      const origin = getTagOffset(drafting.tagOffsets, tagCabinetId);
      onSelectDraftObject?.({ kind: "tag", cabinetId: tagCabinetId });
      onSelectCabinet?.(tagCabinetId, false);
      dragRef.current = {
        kind: "tag",
        cabinetId: tagCabinetId,
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        originDx: origin.dx,
        originDy: origin.dy,
        moved: false,
      };
      suppressClickRef.current = false;
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    const cabinetNode = target?.closest?.("[data-cabinet-id]");
    const cabinetId = cabinetNode?.getAttribute("data-cabinet-id");
    if (!cabinetId) return;

    const cabinet = project.cabinets.find((item) => item.id === cabinetId);
    if (!cabinet) return;

    const additive = event.metaKey || event.ctrlKey || event.shiftKey;
    onSelectCabinet?.(cabinetId, additive);
    onSelectDraftObject?.({ kind: "cabinet", id: cabinetId });

    if (!onCabinetMove) return;

    dragRef.current = {
      kind: "cabinet",
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
    if (!drag || drag.pointerId !== event.pointerId) return;

    const dx = event.clientX - drag.startClientX;
    const dy = event.clientY - drag.startClientY;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    drag.moved = true;
    suppressClickRef.current = true;

    if (drag.kind === "cabinet") {
      if (!onCabinetMove) return;
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
      return;
    }

    if (drag.kind === "dim" && onUpsertDimOffset) {
      const delta = svgDeltaFromClient(
        hostRef.current,
        technicalViewRef.current,
        event.clientX,
        event.clientY,
        drag.startClientX,
        drag.startClientY,
      );
      if (!delta) return;
      const free = drag.freeAxis || drag.axis === "both" || event.shiftKey;
      onUpsertDimOffset(
        drag.id,
        free || drag.axis === "x" ? drag.originDx + delta.dx : drag.originDx,
        free || drag.axis === "y" ? drag.originDy + delta.dy : drag.originDy,
      );
      return;
    }

    if (drag.kind === "tag" && onUpsertTagOffset) {
      const delta = svgDeltaFromClient(
        hostRef.current,
        technicalViewRef.current,
        event.clientX,
        event.clientY,
        drag.startClientX,
        drag.startClientY,
      );
      if (!delta) return;
      onUpsertTagOffset(drag.cabinetId, drag.originDx + delta.dx, drag.originDy + delta.dy);
      return;
    }

    if (drag.kind === "note" && onUpdateNote) {
      const world = worldFromClient(
        hostRef.current,
        technicalViewRef.current,
        view,
        room.dimensions.heightMm,
        event.clientX,
        event.clientY,
      );
      if (!world) return;
      const drafting = clampProjectDrafting(project.drafting);
      const note = drafting.notes.find((item) => item.id === drag.id);
      if (!note) return;
      onUpdateNote({ ...note, anchor: world });
      return;
    }

    if (drag.kind === "leader" && onUpdateLeader) {
      const world = worldFromClient(
        hostRef.current,
        technicalViewRef.current,
        view,
        room.dimensions.heightMm,
        event.clientX,
        event.clientY,
      );
      if (!world) return;
      const drafting = clampProjectDrafting(project.drafting);
      const leader = drafting.leaders.find((item) => item.id === drag.id);
      if (!leader) return;
      onUpdateLeader(
        drag.handle === "target"
          ? { ...leader, target: world }
          : { ...leader, label: world },
      );
    }
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
        view: draftingViewFor(view),
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
        view: draftingViewFor(view),
        text: text.trim(),
        target: leaderTarget,
        label: world,
      });
      setLeaderTarget(null);
      return;
    }

    if (!onSelectCabinet && !onSelectDraftObject) return;

    const target = event.target as Element | null;
    if (target?.closest?.("[data-draft-object]")) return;

    const cabinetNode = target?.closest?.("[data-cabinet-id]");
    const cabinetId = cabinetNode?.getAttribute("data-cabinet-id") ?? null;
    const additive = event.metaKey || event.ctrlKey || event.shiftKey;

    if (!cabinetId && !additive) {
      onSelectCabinet?.(null, false);
      onSelectDraftObject?.(null);
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
