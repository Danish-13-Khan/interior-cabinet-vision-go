import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type RefObject } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { CameraDebugSnapshot } from "../../domain/orbit/cameraDebug";

type OrbitDebugProbeProps = {
  canvas: CameraDebugSnapshot["canvas"];
  controlsRef: RefObject<OrbitControlsImpl | null>;
  exposure?: number | null;
  wireframe: boolean;
  punctualLights: boolean;
  onSnapshot: (snapshot: CameraDebugSnapshot) => void;
};

/**
 * Inside-canvas probe for Phase 4. Samples orbit + renderer stats; applies
 * session-only wireframe / punctual visibility without touching product stores.
 */
export function OrbitDebugProbe({
  canvas,
  controlsRef,
  exposure = null,
  wireframe,
  punctualLights,
  onSnapshot,
}: OrbitDebugProbeProps) {
  const { gl, scene, frameloop } = useThree();
  const lastSampleRef = useRef(0);
  const fpsWindowRef = useRef<number[]>([]);
  const materialBackupRef = useRef<Map<string, boolean>>(new Map());

  useEffect(() => {
    const backups = materialBackupRef.current;
    scene.traverse((obj) => {
      const mesh = obj as { isMesh?: boolean; material?: { uuid?: string; wireframe?: boolean } | Array<{ uuid?: string; wireframe?: boolean }> };
      if (!mesh.isMesh || !mesh.material) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        if (!mat || mat.uuid == null || mat.wireframe === undefined) continue;
        if (!backups.has(mat.uuid)) backups.set(mat.uuid, mat.wireframe);
        mat.wireframe = wireframe ? true : (backups.get(mat.uuid) ?? false);
      }
    });
  }, [scene, wireframe]);

  useEffect(() => {
    scene.traverse((obj) => {
      const light = obj as { isLight?: boolean; visible?: boolean; userData?: { cameraDebugPunctual?: boolean } };
      if (!light.isLight) return;
      // Skip ambient-like lights if tagged; otherwise treat Directional/Point/Spot as punctual.
      const typeName = obj.type;
      if (typeName === "AmbientLight" || typeName === "HemisphereLight") return;
      light.visible = punctualLights;
      light.userData = { ...light.userData, cameraDebugPunctual: true };
    });
  }, [scene, punctualLights]);

  useFrame((_, delta) => {
    const now = performance.now();
    const fps = delta > 0 ? 1 / delta : null;
    if (fps != null && Number.isFinite(fps)) {
      const window = fpsWindowRef.current;
      window.push(fps);
      if (window.length > 30) window.shift();
    }
    // Throttle DOM updates
    if (now - lastSampleRef.current < 120) return;
    lastSampleRef.current = now;

    const controls = controlsRef.current;
    const avgFps =
      fpsWindowRef.current.length > 0
        ? fpsWindowRef.current.reduce((a, b) => a + b, 0) / fpsWindowRef.current.length
        : null;

    let distance: number | null = null;
    let target: [number, number, number] | null = null;
    let polar: number | null = null;
    let screenSpacePanning = false;
    let enableDamping = false;
    let dampingFactor = 0;

    if (controls) {
      screenSpacePanning = Boolean(controls.screenSpacePanning);
      enableDamping = Boolean(controls.enableDamping);
      dampingFactor = controls.dampingFactor;
      polar = controls.getPolarAngle();
      const t = controls.target;
      target = [t.x, t.y, t.z];
      if (controls.object) {
        distance = controls.object.position.distanceTo(t);
      }
    }

    const info = gl.info?.render;
    onSnapshot({
      canvas,
      screenSpacePanning,
      enableDamping,
      dampingFactor,
      distance,
      target,
      polar,
      fps: avgFps,
      frameMs: avgFps ? 1000 / avgFps : null,
      triangles: info?.triangles ?? null,
      drawCalls: info?.calls ?? null,
      exposure,
      frameloop: typeof frameloop === "string" ? frameloop : String(frameloop ?? "—"),
    });
  });

  return null;
}
