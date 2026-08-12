import type { EulerDegrees, Point3Mm } from "../interiorProject";
import type {
  CompiledBoxPrimitive,
  CompiledCylinderPrimitive,
  CompiledRoundedBoxPrimitive,
} from "./sceneTypes";

const ZERO_ROTATION: EulerDegrees = { x: 0, y: 0, z: 0 };

function rounded(value: number) {
  return Math.round(value * 1000) / 1000;
}

export function boxPrimitive(
  id: string,
  sizeMm: { width: number; height: number; depth: number },
  positionMm: Point3Mm,
  materialId: string,
  options: {
    rotationDegrees?: EulerDegrees;
    castShadow?: boolean;
    receiveShadow?: boolean;
  } = {},
): CompiledBoxPrimitive {
  const size = {
    width: Math.max(1, rounded(sizeMm.width)),
    height: Math.max(1, rounded(sizeMm.height)),
    depth: Math.max(1, rounded(sizeMm.depth)),
  };
  return {
    kind: "box",
    id,
    sizeMm: size,
    positionMm: { ...positionMm },
    rotationDegrees: { ...(options.rotationDegrees ?? ZERO_ROTATION) },
    materialId,
    geometryKey: `box:${size.width}:${size.height}:${size.depth}`,
    castShadow: options.castShadow ?? true,
    receiveShadow: options.receiveShadow ?? true,
  };
}

export function cylinderPrimitive(
  id: string,
  dimensions: {
    radiusTopMm: number;
    radiusBottomMm?: number;
    heightMm: number;
    radialSegments?: number;
  },
  positionMm: Point3Mm,
  materialId: string,
  options: {
    rotationDegrees?: EulerDegrees;
    castShadow?: boolean;
    receiveShadow?: boolean;
  } = {},
): CompiledCylinderPrimitive {
  const radiusTopMm = Math.max(1, rounded(dimensions.radiusTopMm));
  const radiusBottomMm = Math.max(
    1,
    rounded(dimensions.radiusBottomMm ?? dimensions.radiusTopMm),
  );
  const heightMm = Math.max(1, rounded(dimensions.heightMm));
  const radialSegments = Math.max(8, Math.round(dimensions.radialSegments ?? 24));
  return {
    kind: "cylinder",
    id,
    radiusTopMm,
    radiusBottomMm,
    heightMm,
    radialSegments,
    positionMm: { ...positionMm },
    rotationDegrees: { ...(options.rotationDegrees ?? ZERO_ROTATION) },
    materialId,
    geometryKey: `cylinder:${radiusTopMm}:${radiusBottomMm}:${heightMm}:${radialSegments}`,
    castShadow: options.castShadow ?? true,
    receiveShadow: options.receiveShadow ?? true,
  };
}

export function roundedBoxPrimitive(
  id: string,
  sizeMm: { width: number; height: number; depth: number },
  positionMm: Point3Mm,
  materialId: string,
  options: {
    radiusMm?: number;
    smoothness?: number;
    rotationDegrees?: EulerDegrees;
    castShadow?: boolean;
    receiveShadow?: boolean;
  } = {},
): CompiledRoundedBoxPrimitive {
  const size = {
    width: Math.max(1, rounded(sizeMm.width)),
    height: Math.max(1, rounded(sizeMm.height)),
    depth: Math.max(1, rounded(sizeMm.depth)),
  };
  const maximumRadius = Math.min(size.width, size.height, size.depth) / 2;
  const radiusMm = Math.max(1, Math.min(maximumRadius, rounded(options.radiusMm ?? maximumRadius * 0.22)));
  const smoothness = Math.max(1, Math.min(8, Math.round(options.smoothness ?? 4)));
  return {
    kind: "rounded-box",
    id,
    sizeMm: size,
    radiusMm,
    smoothness,
    positionMm: { ...positionMm },
    rotationDegrees: { ...(options.rotationDegrees ?? ZERO_ROTATION) },
    materialId,
    geometryKey: `rounded-box:${size.width}:${size.height}:${size.depth}:${radiusMm}:${smoothness}`,
    castShadow: options.castShadow ?? true,
    receiveShadow: options.receiveShadow ?? true,
  };
}
