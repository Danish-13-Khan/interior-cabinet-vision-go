import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import { Camera, Vector2, Vector3 } from "three";
import type { CabinetSceneItem } from "../../domain/cabinetGeometry";
import { getCabinetWorldCenter } from "./worldCoords";

export type MarqueeRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type MarqueeStart = {
  x: number;
  y: number;
  additive: boolean;
};

export function toLocalPoint(
  event: ReactPointerEvent<HTMLDivElement>,
  sceneFrame: HTMLDivElement | null,
) {
  const rect = sceneFrame?.getBoundingClientRect();
  if (!rect) {
    return null;
  }

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

export function projectCabinetToViewport(
  cabinet: CabinetSceneItem,
  camera: Camera | null,
  viewportSize: { width: number; height: number },
) {
  if (!camera) {
    return null;
  }

  const position = new Vector3(...getCabinetWorldCenter(cabinet));
  position.project(camera);

  return new Vector2(
    (position.x * 0.5 + 0.5) * viewportSize.width,
    (-position.y * 0.5 + 0.5) * viewportSize.height,
  );
}

export function cabinetsInMarquee(
  items: CabinetSceneItem[],
  rect: MarqueeRect,
  camera: Camera | null,
  viewportSize: { width: number; height: number },
): string[] {
  return items
    .filter((cabinet) => {
      const point = projectCabinetToViewport(cabinet, camera, viewportSize);
      if (!point) {
        return false;
      }

      return (
        point.x >= rect.x &&
        point.x <= rect.x + rect.width &&
        point.y >= rect.y &&
        point.y <= rect.y + rect.height
      );
    })
    .map((cabinet) => cabinet.id);
}

export function createMarqueeHandlers(options: {
  sceneFrameRef: RefObject<HTMLDivElement | null>;
  marqueeStartRef: RefObject<MarqueeStart | null>;
  marqueeRect: MarqueeRect | null;
  setMarqueeRect: (rect: MarqueeRect | null) => void;
  items: CabinetSceneItem[];
  viewportCameraRef: RefObject<Camera | null>;
  viewportSizeRef: RefObject<{ width: number; height: number }>;
  onMarqueeSelect?: (cabinetIds: string[], additive?: boolean) => void;
}) {
  const {
    sceneFrameRef,
    marqueeStartRef,
    marqueeRect,
    setMarqueeRect,
    items,
    viewportCameraRef,
    viewportSizeRef,
    onMarqueeSelect,
  } = options;

  function handleMarqueePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !event.shiftKey) {
      return;
    }

    const point = toLocalPoint(event, sceneFrameRef.current);
    if (!point) {
      return;
    }

    marqueeStartRef.current = {
      ...point,
      additive: event.metaKey || event.ctrlKey,
    };
    setMarqueeRect({
      x: point.x,
      y: point.y,
      width: 0,
      height: 0,
    });
    event.preventDefault();
    event.stopPropagation();
  }

  function handleMarqueePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const start = marqueeStartRef.current;
    if (!start) {
      return;
    }

    const point = toLocalPoint(event, sceneFrameRef.current);
    if (!point) {
      return;
    }

    setMarqueeRect({
      x: Math.min(start.x, point.x),
      y: Math.min(start.y, point.y),
      width: Math.abs(point.x - start.x),
      height: Math.abs(point.y - start.y),
    });
    event.preventDefault();
    event.stopPropagation();
  }

  function handleMarqueePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const start = marqueeStartRef.current;
    const rect = marqueeRect;
    marqueeStartRef.current = null;

    if (!start || !rect) {
      return;
    }

    const selectedIds = cabinetsInMarquee(
      items,
      rect,
      viewportCameraRef.current,
      viewportSizeRef.current,
    );

    if (selectedIds.length > 0) {
      onMarqueeSelect?.(selectedIds, start.additive);
    }

    setMarqueeRect(null);
    event.preventDefault();
    event.stopPropagation();
  }

  return {
    handleMarqueePointerDown,
    handleMarqueePointerMove,
    handleMarqueePointerUp,
  };
}
