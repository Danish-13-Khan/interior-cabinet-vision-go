import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { snapPlanPoint, type InteriorProject, type Point2Mm } from "../../domain/interiorProject";

export type WallTranslatePreview = {
  wallId: string;
  start: Point2Mm;
  end: Point2Mm;
  nodeIds: [string, string];
};

type NodeDrag = {
  kind: "node";
  nodeId: string;
  origin: Point2Mm;
  position: Point2Mm;
};

type WallDrag = {
  kind: "wall";
  wallId: string;
  startPointer: Point2Mm;
  originStart: Point2Mm;
  originEnd: Point2Mm;
  startNodeId: string;
  endNodeId: string;
  delta: Point2Mm;
  moved: boolean;
};

const MOVE_THRESHOLD_MM = 40;

/** Select-tool drag for wall endpoints and whole-wall translate (preview locally, commit on up). */
export function usePlanWallInteraction(input: {
  active: boolean;
  project: InteriorProject;
  snapSizeMm: number;
  worldPoint: (event: ReactPointerEvent<SVGSVGElement>) => Point2Mm;
  onSelectWall: (wallId: string) => void;
  onMoveNode: (nodeId: string, position: Point2Mm) => void;
  onTranslateWall: (wallId: string, delta: Point2Mm) => void;
}) {
  const [drag, setDrag] = useState<NodeDrag | WallDrag | null>(null);
  const dragRef = useRef<NodeDrag | WallDrag | null>(null);

  function setDragState(next: NodeDrag | WallDrag | null) {
    dragRef.current = next;
    setDrag(next);
  }

  function beginNode(event: ReactPointerEvent<Element>, nodeId: string) {
    if (!input.active || event.button !== 0) return false;
    const node = input.project.nodes.find((item) => item.id === nodeId);
    if (!node) return false;
    event.stopPropagation();
    const svg = ((event.currentTarget as SVGElement).ownerSVGElement ?? event.currentTarget) as Element;
    svg.setPointerCapture?.(event.pointerId);
    const wall = input.project.walls.find((item) =>
      item.startNodeId === nodeId || item.endNodeId === nodeId);
    if (wall) input.onSelectWall(wall.id);
    setDragState({ kind: "node", nodeId, origin: { ...node.position }, position: { ...node.position } });
    return true;
  }

  function beginWall(event: ReactPointerEvent<Element>, wallId: string) {
    if (!input.active || event.button !== 0) return false;
    const wall = input.project.walls.find((item) => item.id === wallId);
    if (!wall?.startNodeId || !wall.endNodeId) return false;
    event.stopPropagation();
    const svg = ((event.currentTarget as SVGElement).ownerSVGElement ?? event.currentTarget) as Element;
    svg.setPointerCapture?.(event.pointerId);
    input.onSelectWall(wallId);
    const startPointer = input.worldPoint(event as unknown as ReactPointerEvent<SVGSVGElement>);
    setDragState({
      kind: "wall",
      wallId,
      startPointer,
      originStart: { ...wall.start },
      originEnd: { ...wall.end },
      startNodeId: wall.startNodeId,
      endNodeId: wall.endNodeId,
      delta: { x: 0, z: 0 },
      moved: false,
    });
    return true;
  }

  function move(event: ReactPointerEvent<SVGSVGElement>) {
    const current = dragRef.current;
    if (!current) return false;
    const point = input.worldPoint(event);
    if (current.kind === "node") {
      const others = input.project.nodes.filter((node) => node.id !== current.nodeId);
      const position = snapPlanPoint(point, input.snapSizeMm, others);
      setDragState({ ...current, position });
      return true;
    }
    const raw = { x: point.x - current.startPointer.x, z: point.z - current.startPointer.z };
    const snappedStart = snapPlanPoint(
      { x: current.originStart.x + raw.x, z: current.originStart.z + raw.z },
      input.snapSizeMm,
      input.project.nodes.filter((node) =>
        node.id !== current.startNodeId && node.id !== current.endNodeId),
    );
    const delta = {
      x: snappedStart.x - current.originStart.x,
      z: snappedStart.z - current.originStart.z,
    };
    setDragState({
      ...current,
      delta,
      moved: current.moved || Math.hypot(delta.x, delta.z) >= MOVE_THRESHOLD_MM,
    });
    return true;
  }

  function finish() {
    const current = dragRef.current;
    if (!current) return false;
    if (current.kind === "node") {
      if (Math.hypot(current.position.x - current.origin.x, current.position.z - current.origin.z) >= 1) {
        input.onMoveNode(current.nodeId, current.position);
      }
    } else if (current.moved) {
      input.onTranslateWall(current.wallId, current.delta);
    }
    setDragState(null);
    return true;
  }

  const previewNodes = new Map<string, Point2Mm>();
  if (drag?.kind === "node") previewNodes.set(drag.nodeId, drag.position);
  if (drag?.kind === "wall") {
    previewNodes.set(drag.startNodeId, {
      x: drag.originStart.x + drag.delta.x, z: drag.originStart.z + drag.delta.z,
    });
    previewNodes.set(drag.endNodeId, {
      x: drag.originEnd.x + drag.delta.x, z: drag.originEnd.z + drag.delta.z,
    });
  }

  const translatePreview: WallTranslatePreview | null = drag?.kind === "wall"
    ? {
      wallId: drag.wallId,
      start: { x: drag.originStart.x + drag.delta.x, z: drag.originStart.z + drag.delta.z },
      end: { x: drag.originEnd.x + drag.delta.x, z: drag.originEnd.z + drag.delta.z },
      nodeIds: [drag.startNodeId, drag.endNodeId],
    }
    : null;

  return {
    dragging: Boolean(drag),
    translatePreview,
    previewNodes,
    beginNode,
    beginWall,
    move,
    finish,
  };
}
