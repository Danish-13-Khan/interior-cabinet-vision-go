import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import type { RefObject } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  dollyBlockedByMinDistance,
  orbitWheelZoomScale,
} from "../../domain/livingRoom/modelViewFitDistance";

const dollyDirection = new Vector3();

/** When zoom-to-cursor is clamped at minDistance, slide camera and target forward. */
export function CursorDollyPastMin({
  controlsRef,
}: {
  controlsRef: RefObject<OrbitControlsImpl | null>;
}) {
  const { camera, gl, invalidate } = useThree();
  useEffect(() => {
    const element = gl.domElement;
    let distanceBefore = 0;
    function onWheelCapture(event: WheelEvent) {
      const controls = controlsRef.current;
      if (!controls?.enabled || !controls.enableZoom || event.deltaY >= 0) {
        distanceBefore = 0;
        return;
      }
      distanceBefore = camera.position.distanceTo(controls.target);
    }
    function onWheel(event: WheelEvent) {
      const controls = controlsRef.current;
      if (!controls?.enabled || !controls.enableZoom || event.deltaY >= 0) return;
      const blocked = dollyBlockedByMinDistance(
        distanceBefore, orbitWheelZoomScale(controls.zoomSpeed), controls.minDistance,
      );
      if (blocked <= 0) return;
      const rect = element.getBoundingClientRect();
      const ndcX = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
      const ndcY = -((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 + 1;
      dollyDirection.set(ndcX, ndcY, 1).unproject(camera).sub(camera.position).normalize();
      camera.position.addScaledVector(dollyDirection, blocked);
      controls.target.addScaledVector(dollyDirection, blocked);
      controls.update();
      invalidate();
    }
    element.addEventListener("wheel", onWheelCapture, true);
    element.addEventListener("wheel", onWheel);
    return () => {
      element.removeEventListener("wheel", onWheelCapture, true);
      element.removeEventListener("wheel", onWheel);
    };
  }, [camera, controlsRef, gl, invalidate]);
  return null;
}
