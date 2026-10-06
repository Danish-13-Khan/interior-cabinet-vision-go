import { useCallback, useState } from "react";
import type { CameraDebugSnapshot } from "../../domain/orbit/cameraDebug";
import { usePerfHudSession } from "../../hooks/usePerfHudSession";

export function useCameraDebugSession() {
  const hud = usePerfHudSession();
  const [snapshot, setSnapshot] = useState<CameraDebugSnapshot | null>(null);
  const [wireframe, setWireframe] = useState(false);
  const [showGridOverride, setShowGridOverride] = useState<boolean | null>(null);
  const [punctualLights, setPunctualLights] = useState(true);

  const onSnapshot = useCallback((next: CameraDebugSnapshot) => {
    setSnapshot(next);
  }, []);

  return {
    enabled: hud.visible,
    close: hud.close,
    snapshot,
    onSnapshot,
    wireframe,
    setWireframe,
    showGridOverride,
    setShowGridOverride,
    punctualLights,
    setPunctualLights,
  };
}
