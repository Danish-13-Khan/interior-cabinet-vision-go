import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useRef, useState } from "react";
import {
  resolveModelCutawaySides,
} from "../../domain/livingRoom/modelReviewNodes";

function sidesKey(sides: ReadonlySet<string>) {
  return [...sides].sort().join(",");
}

function cameraPositionMm(camera: { position: { x: number; z: number } }) {
  return { x: camera.position.x * 1000, z: camera.position.z * 1000 };
}

/** Cut away the near wall using the live orbit camera, not the saved still pose. */
export function useOrbitCutawaySides(
  enabled: boolean,
  centerX: number,
  centerZ: number,
  fallbackXmm: number | null,
  fallbackZmm: number | null,
) {
  const { camera, invalidate } = useThree();
  const fallback = fallbackXmm === null || fallbackZmm === null
    ? null
    : { x: fallbackXmm, z: fallbackZmm };
  const roomCenter = { x: centerX, z: centerZ };
  const [sides, setSides] = useState(() => resolveModelCutawaySides(
    enabled ? cameraPositionMm(camera) : fallback,
    roomCenter,
  ));
  const keyRef = useRef(sidesKey(sides));
  const centerRef = useRef(roomCenter);
  centerRef.current = roomCenter;

  useLayoutEffect(() => {
    const next = resolveModelCutawaySides(
      enabled ? cameraPositionMm(camera) : fallback,
      { x: centerX, z: centerZ },
    );
    const key = sidesKey(next);
    if (key === keyRef.current) return;
    keyRef.current = key;
    setSides(next);
  }, [enabled, fallbackXmm, fallbackZmm, centerX, centerZ, camera]);

  useFrame(() => {
    if (!enabled) return;
    const next = resolveModelCutawaySides(cameraPositionMm(camera), centerRef.current);
    const key = sidesKey(next);
    if (key === keyRef.current) return;
    keyRef.current = key;
    setSides(next);
    invalidate();
  });

  return sides;
}
