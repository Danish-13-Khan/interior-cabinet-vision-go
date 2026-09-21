import { useCallback, useMemo, useState } from "react";
import {
  readCameraDebugEnabledFromBrowser,
  type CameraDebugSnapshot,
} from "../../domain/orbit/cameraDebug";

export function useCameraDebugSession() {
  const enabled = useMemo(() => readCameraDebugEnabledFromBrowser(), []);
  const [snapshot, setSnapshot] = useState<CameraDebugSnapshot | null>(null);
  const [wireframe, setWireframe] = useState(false);
  const [showGridOverride, setShowGridOverride] = useState<boolean | null>(null);
  const [punctualLights, setPunctualLights] = useState(true);

  const onSnapshot = useCallback((next: CameraDebugSnapshot) => {
    setSnapshot(next);
  }, []);

  return {
    enabled,
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
