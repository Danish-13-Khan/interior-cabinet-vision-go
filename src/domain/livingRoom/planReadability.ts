import { roomPlanViewBounds, selectRoomWalls, type InteriorProject, type Size3Mm, type WallEntity } from "../interiorProject";

export type PlanDisplayUnit = "mm" | "cm" | "m" | "ft-in";
export type PlanVisualStyle = "fill" | "line";
export type PlanReadabilitySettings = {
  unit: PlanDisplayUnit;
  alwaysShowWallLengths: boolean;
  visualStyle: PlanVisualStyle;
};

export type PlanDimensionPair = {
  innerWidthMm: number;
  innerDepthMm: number;
  outerWidthMm: number;
  outerDepthMm: number;
};

export const DEFAULT_PLAN_READABILITY: PlanReadabilitySettings = {
  unit: "mm",
  alwaysShowWallLengths: false,
  visualStyle: "fill",
};

function trimmed(value: number, digits: number) {
  return value.toFixed(digits).replace(/\.0+$|(?<=\.[0-9]*?)0+$/g, "");
}

function formatFeetInches(mm: number) {
  const totalEighths = Math.round((mm / 25.4) * 8);
  const feet = Math.floor(totalEighths / 96);
  const remainder = totalEighths - feet * 96;
  const inches = Math.floor(remainder / 8);
  const eighths = remainder % 8;
  const fractions = ["", "⅛", "¼", "⅜", "½", "⅝", "¾", "⅞"];
  const inchText = eighths ? `${inches} ${fractions[eighths]}` : String(inches);
  return `${feet}′ ${inchText}″`;
}

export function formatPlanDimension(mm: number, unit: PlanDisplayUnit) {
  if (unit === "cm") return `${trimmed(mm / 10, 1)} cm`;
  if (unit === "m") return `${trimmed(mm / 1000, 3)} m`;
  if (unit === "ft-in") return formatFeetInches(mm);
  return `${Math.round(mm)} mm`;
}

function sideThickness(walls: WallEntity[], side: string) {
  return walls.find((wall) => wall.extensions?.wallSide === side)?.thicknessMm ?? 0;
}

export function planDimensionPair(dimensions: Size3Mm, walls: WallEntity[]): PlanDimensionPair {
  const left = sideThickness(walls, "left") / 2;
  const right = sideThickness(walls, "right") / 2;
  const back = sideThickness(walls, "back") / 2;
  const front = sideThickness(walls, "front") / 2;
  return {
    innerWidthMm: Math.max(0, dimensions.widthMm - left - right),
    innerDepthMm: Math.max(0, dimensions.depthMm - back - front),
    outerWidthMm: dimensions.widthMm + left + right,
    outerDepthMm: dimensions.depthMm + back + front,
  };
}

/** Dimension envelope for arbitrary room loops; cached room dimensions are ignored. */
export function topologyPlanDimensionPair(
  project: InteriorProject,
  roomId: string,
): PlanDimensionPair {
  const bounds = roomPlanViewBounds(project, roomId);
  const walls = selectRoomWalls(project, roomId);
  const halfThickness = Math.max(0, ...walls.map((wall) => wall.thicknessMm / 2));
  return {
    innerWidthMm: Math.max(0, bounds.widthMm - halfThickness * 2),
    innerDepthMm: Math.max(0, bounds.depthMm - halfThickness * 2),
    outerWidthMm: bounds.widthMm + halfThickness * 2,
    outerDepthMm: bounds.depthMm + halfThickness * 2,
  };
}

export function wallLengthMm(wall: WallEntity) {
  return Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z);
}

export function wallLabelPose(wall: WallEntity) {
  let angle = Math.atan2(wall.end.z - wall.start.z, wall.end.x - wall.start.x) * 180 / Math.PI;
  if (angle > 90 || angle < -90) angle += angle > 90 ? -180 : 180;
  return {
    x: (wall.start.x + wall.end.x) / 2,
    z: (wall.start.z + wall.end.z) / 2,
    angle,
  };
}
