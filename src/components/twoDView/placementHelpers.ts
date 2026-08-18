import type {
  CabinetPlacement,
  CabinetProject,
} from "../../domain/cabinetDimensions";
import type { SnapGuide } from "../../domain/placementSnap";
import { snapElevationHeight, snapPlanPlacement } from "../../domain/placementSnap";
import { placementConflict } from "../../domain/placementSafety";
import {
  elevationFrontSvgToWorldMm,
  elevationSideSvgToWorldMm,
  planSvgToWorldMm,
  type TechnicalViewKind,
} from "../../domain/technicalViews";
import type { RoomConfig } from "../../domain/roomModel";
import {
  worldPointForView,
  type DraftingWorldPoint,
} from "../../domain/draftingAnnotations";

export type TechnicalViewMetrics = {
  width: number;
  height: number;
  originX: number;
  originY: number;
  scale: number;
};

export function worldFromClient(
  host: HTMLDivElement | null,
  technicalView: TechnicalViewMetrics,
  view: TechnicalViewKind,
  roomHeightMm: number,
  clientX: number,
  clientY: number,
): DraftingWorldPoint | null {
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
      roomHeightMm,
      technicalView.scale,
    );
    return worldPointForView(view, { x: point.x, y: point.y, z: 0 });
  }
  if (view === "side" || view === "section") {
    const point = elevationSideSvgToWorldMm(
      svgX,
      svgY,
      technicalView.originX,
      technicalView.originY,
      roomHeightMm,
      technicalView.scale,
    );
    return worldPointForView("side", { x: 0, y: point.y, z: point.z });
  }
  if (view === "report" || view === "detail") return null;
  const point = planSvgToWorldMm(
    svgX,
    svgY,
    technicalView.originX,
    technicalView.originY,
    technicalView.scale,
  );
  return worldPointForView(view, { x: point.x, y: 0, z: point.z });
}

export function svgDeltaFromClient(
  host: HTMLDivElement | null,
  technicalView: TechnicalViewMetrics,
  clientX: number,
  clientY: number,
  startClientX: number,
  startClientY: number,
): { dx: number; dy: number } | null {
  const svg = host?.querySelector("svg");
  if (!svg) return null;
  const bounds = svg.getBoundingClientRect();
  if (bounds.width <= 0 || bounds.height <= 0) return null;
  const scaleX = technicalView.width / bounds.width;
  const scaleY = technicalView.height / bounds.height;
  return {
    dx: (clientX - startClientX) * scaleX,
    dy: (clientY - startClientY) * scaleY,
  };
}

export function proposePlacement(
  project: CabinetProject,
  room: RoomConfig,
  view: TechnicalViewKind,
  technicalView: TechnicalViewMetrics,
  host: HTMLDivElement | null,
  snapSizeMm: number,
  cabinetId: string,
  origin: CabinetPlacement,
  clientX: number,
  clientY: number,
  startClientX: number,
  startClientY: number,
): { placement: CabinetPlacement; guides: SnapGuide[] } | null {
  const cabinet = project.cabinets.find((item) => item.id === cabinetId);
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
  if (view === "report" || view === "detail") {
    return null;
  }
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
    // side + section
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
    const placement = {
      ...snapped.placement,
      y: origin.attachment === "floor" ? 0 : heightSnap.y,
      z: origin.z,
    };
    if (placementConflict({ cabinet, others, placement, room })) return null;
    return {
      placement,
      guides: [
        ...snapped.guides.filter((guide) => guide.axis === "x"),
        ...(origin.attachment === "floor" ? [] : heightSnap.guides),
      ],
    };
  }

  if (view === "side" || view === "section") {
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
    const placement = {
      ...snapped.placement,
      x: origin.x,
      y: origin.attachment === "floor" ? 0 : heightSnap.y,
    };
    if (placementConflict({ cabinet, others, placement, room })) return null;
    return {
      placement,
      guides: [
        ...snapped.guides.filter((guide) => guide.axis === "z"),
        ...(origin.attachment === "floor" ? [] : heightSnap.guides),
      ],
    };
  }

  return placementConflict({ cabinet, others, placement: snapped.placement, room })
    ? null
    : snapped;
}
