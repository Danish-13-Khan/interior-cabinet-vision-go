import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type RefObject } from "react";
import { Raycaster, Vector2, Vector3, type Mesh } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

const FOCUS_MS = 260;

type Focus = { start: number; target: Vector3; camera: Vector3; delta: Vector3 };

/**
 * Double-click a surface to orbit around it. Zooming toward the cursor carries
 * the orbit target with it, so without this the next orbit swings around a point
 * nobody chose. Target and camera shift together, so the view direction and
 * distance are kept and the clicked point comes to the centre.
 */
export function OrbitPivotFocus({
  controlsRef,
  navigatingRef,
  cancelGenerationRef,
  enabled,
}: {
  controlsRef: RefObject<OrbitControlsImpl | null>;
  navigatingRef: RefObject<boolean>;
  /** Bumped so CameraRig drops any framing ease and treats the pose as the user's. */
  cancelGenerationRef: RefObject<number>;
  enabled: boolean;
}) {
  const { camera, gl, scene, invalidate } = useThree();
  const focus = useRef<Focus | null>(null);

  useEffect(() => {
    if (!enabled) return undefined;
    const element = gl.domElement;
    function onDoubleClick(event: MouseEvent) {
      const controls = controlsRef.current;
      const rect = element.getBoundingClientRect();
      if (!controls || rect.width <= 0 || rect.height <= 0) return;
      const pointer = new Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -(((event.clientY - rect.top) / rect.height) * 2 - 1),
      );
      const raycaster = new Raycaster();
      raycaster.setFromCamera(pointer, camera);
      // Meshes only: the grid and helper lines are not something to orbit around.
      const hit = raycaster.intersectObject(scene, true)
        .find((item) => (item.object as Mesh).isMesh === true && item.object.visible);
      if (!hit) return;
      cancelGenerationRef.current += 1;
      focus.current = {
        start: performance.now(),
        target: controls.target.clone(),
        camera: camera.position.clone(),
        delta: hit.point.clone().sub(controls.target),
      };
      invalidate();
    }
    element.addEventListener("dblclick", onDoubleClick);
    return () => element.removeEventListener("dblclick", onDoubleClick);
  }, [camera, cancelGenerationRef, controlsRef, enabled, gl, invalidate, scene]);

  useFrame(() => {
    const active = focus.current;
    const controls = controlsRef.current;
    if (!active || !controls) return;
    // A drag that starts mid-ease wins.
    if (navigatingRef.current) {
      focus.current = null;
      return;
    }
    const t = Math.min(1, (performance.now() - active.start) / FOCUS_MS);
    const eased = 1 - (1 - t) ** 3;
    controls.target.copy(active.target).addScaledVector(active.delta, eased);
    camera.position.copy(active.camera).addScaledVector(active.delta, eased);
    controls.update();
    if (t >= 1) focus.current = null;
    else invalidate();
  });

  return null;
}
