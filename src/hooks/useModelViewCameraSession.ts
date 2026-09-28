import { useCallback, useEffect, useRef, useState } from "react";
import {
  resolveModelViewFKeyFitMode,
  type ModelViewFitMode,
} from "../domain/livingRoom/modelViewFit";
import type { ModelViewPresetId } from "../domain/livingRoom";
import { setModelViewCanvasFocused } from "./modelViewFocusGate";
import { useModelViewCameraHotkeys } from "./useModelViewCameraHotkeys";
import { useSelectionFrameRequest } from "./useSelectionFrameRequest";

export function useModelViewCameraSession(enabled: boolean, hasSelection = false) {
  const [viewPreset, setViewPreset] = useState<ModelViewPresetId>("dollhouse");
  const [fitVersion, setFitVersion] = useState(0);
  const [fitMode, setFitMode] = useState<ModelViewFitMode>("room");
  const hasSelectionRef = useRef(hasSelection);
  hasSelectionRef.current = hasSelection;

  const fitRoom = useCallback(() => {
    setFitMode("room");
    setFitVersion((value) => value + 1);
  }, []);

  const focusSelection = useCallback(() => {
    setFitMode("selection");
    setFitVersion((value) => value + 1);
  }, []);

  /** Camera dock Reset: back to Dollhouse, framed on the cabinet run. */
  const resetView = useCallback(() => {
    setViewPreset("dollhouse");
    setFitMode("run");
    setFitVersion((value) => value + 1);
  }, []);

  /** Canvas F: focus selection when present, otherwise fit room (toolbar Fit Room stays room-only). */
  const fitFromHotkey = useCallback(() => {
    setFitMode(resolveModelViewFKeyFitMode(hasSelectionRef.current));
    setFitVersion((value) => value + 1);
  }, []);

  useModelViewCameraHotkeys({
    enabled,
    onViewPreset: setViewPreset,
    onFitRoom: fitFromHotkey,
    onFocusSelection: focusSelection,
  });

  useSelectionFrameRequest(() => {
    if (enabled) focusSelection();
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
    resetView,
    onCanvasFocus: () => setModelViewCanvasFocused(true),
    onCanvasBlur: () => setModelViewCanvasFocused(false),
  };
}
