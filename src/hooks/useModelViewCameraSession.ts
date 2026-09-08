import { useCallback, useEffect, useState } from "react";
import type { ModelViewFitMode } from "../domain/livingRoom/modelViewFit";
import type { ModelViewPresetId } from "../domain/livingRoom";
import { setModelViewCanvasFocused } from "./modelViewFocusGate";
import { useModelViewCameraHotkeys } from "./useModelViewCameraHotkeys";

export function useModelViewCameraSession(enabled: boolean) {
  const [viewPreset, setViewPreset] = useState<ModelViewPresetId>("dollhouse");
  const [fitVersion, setFitVersion] = useState(0);
  const [fitMode, setFitMode] = useState<ModelViewFitMode>("room");

  const fitRoom = useCallback(() => {
    setFitMode("room");
    setFitVersion((value) => value + 1);
  }, []);

  const focusSelection = useCallback(() => {
    setFitMode("selection");
    setFitVersion((value) => value + 1);
  }, []);

  useModelViewCameraHotkeys({
    enabled,
    onViewPreset: setViewPreset,
    onFitRoom: fitRoom,
    onFocusSelection: focusSelection,
  });

  useEffect(() => {
    if (!enabled) setModelViewCanvasFocused(false);
    return () => setModelViewCanvasFocused(false);
  }, [enabled]);

  return {
    viewPreset,
    setViewPreset,
    fitVersion,
    fitMode,
    fitRoom,
    focusSelection,
    onCanvasFocus: () => setModelViewCanvasFocused(true),
    onCanvasBlur: () => setModelViewCanvasFocused(false),
  };
}
