import {
  getFootprintDimensions,
  normalizeRotationAngle,
  type CabinetInstance,
  type RoomBounds,
} from "../cabinetDimensions";
import {
  RUN_ALIGNMENT_TOLERANCE_MM,
  type CabinetRunAxis,
  type CabinetRunSide,
  runBandForType,
} from "./types";

export function isRunCandidate(cabinet: CabinetInstance) {
  return (
    cabinet.config.type !== "table" &&
    cabinet.config.type !== "chair" &&
    cabinet.config.type !== "sofa" &&
    cabinet.config.type !== "mirror"
  );
}

export function inferRunAxis(cabinet: CabinetInstance): CabinetRunAxis {
  return cabinet.placement.attachment === "left-wall" ||
    cabinet.placement.attachment === "right-wall" ||
    normalizeRotationAngle(cabinet.placement.rotation) === 90 ||
    normalizeRotationAngle(cabinet.placement.rotation) === 270
    ? "z"
    : "x";
}

export function inferRunSide(
  cabinet: CabinetInstance,
  roomBounds: RoomBounds,
): CabinetRunSide {
  if (cabinet.placement.attachment !== "floor") {
    return cabinet.placement.attachment;
  }

  const footprint = getFootprintDimensions(
    cabinet.config.dimensions,
    cabinet.placement.rotation,
  );
  const nearBackWall =
    Math.abs(
      cabinet.placement.z - (-roomBounds.depthMm / 2 + footprint.depth / 2),
    ) < RUN_ALIGNMENT_TOLERANCE_MM;
  const nearLeftWall =
    Math.abs(
      cabinet.placement.x - (-roomBounds.widthMm / 2 + footprint.depth / 2),
    ) < RUN_ALIGNMENT_TOLERANCE_MM;
  const nearRightWall =
    Math.abs(
      cabinet.placement.x - (roomBounds.widthMm / 2 - footprint.depth / 2),
    ) < RUN_ALIGNMENT_TOLERANCE_MM;

  if (nearBackWall) return "back-wall";
  if (nearLeftWall) return "left-wall";
  if (nearRightWall) return "right-wall";
  return "free";
}

export function getRunLineValue(cabinet: CabinetInstance, axis: CabinetRunAxis) {
  return axis === "x" ? cabinet.placement.z : cabinet.placement.x;
}

export function getRunPrimaryValue(
  cabinet: CabinetInstance,
  axis: CabinetRunAxis,
) {
  return axis === "x" ? cabinet.placement.x : cabinet.placement.z;
}

export function getRunSpan(cabinet: CabinetInstance, axis: CabinetRunAxis) {
  const footprint = getFootprintDimensions(
    cabinet.config.dimensions,
    cabinet.placement.rotation,
  );
  return axis === "x" ? footprint.width : footprint.depth;
}

export function getRunExtent(cabinet: CabinetInstance, axis: CabinetRunAxis) {
  const primary = getRunPrimaryValue(cabinet, axis);
  const span = getRunSpan(cabinet, axis);
  return { start: primary - span / 2, end: primary + span / 2, span, primary };
}

export function cabinetsAreAdjacent(
  first: CabinetInstance,
  second: CabinetInstance,
  axis: CabinetRunAxis,
  gapToleranceMm: number,
) {
  const firstExtent = getRunExtent(first, axis);
  const secondExtent = getRunExtent(second, axis);
  return secondExtent.start - firstExtent.end <= gapToleranceMm;
}

export function wallFaceLineValue(
  side: CabinetRunSide,
  depthMm: number,
  roomBounds: RoomBounds,
) {
  switch (side) {
    case "back-wall":
      return -roomBounds.depthMm / 2 + depthMm / 2;
    case "left-wall":
      return -roomBounds.widthMm / 2 + depthMm / 2;
    case "right-wall":
      return roomBounds.widthMm / 2 - depthMm / 2;
    default:
      return null;
  }
}

export function orderedRunCabinets(
  runCabinetIds: string[],
  cabinets: CabinetInstance[],
  axis: CabinetRunAxis,
) {
  return runCabinetIds
    .map((id) => cabinets.find((cabinet) => cabinet.id === id))
    .filter((cabinet): cabinet is CabinetInstance => Boolean(cabinet))
    .sort((a, b) => getRunPrimaryValue(a, axis) - getRunPrimaryValue(b, axis));
}

export function cabinetRunBand(cabinet: CabinetInstance) {
  return runBandForType(cabinet.config.type);
}
