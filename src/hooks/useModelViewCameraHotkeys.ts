import { useEffect } from "react";
import {
  eventMatchesBinding,
  MODEL_VIEW_SHORTCUT_ACTION_IDS,
  readShortcutMap,
} from "../domain/desktopUx";
import type { ModelViewPresetId } from "../domain/livingRoom";
import { isAppModalOpen } from "./appModalGate";
import { isModelViewCanvasFocused } from "./modelViewFocusGate";

const PRESET_BY_ACTION: Partial<Record<(typeof MODEL_VIEW_SHORTCUT_ACTION_IDS)[number], ModelViewPresetId>> = {
  modelCamTop: "top",
  modelCamFront: "front",
  modelCamSide: "side",
  modelCamIsometric: "isometric",
  modelCamPerspective: "perspective",
};

/** Phase M1 camera shortcuts — only while the 3D canvas is focused. */
export function useModelViewCameraHotkeys({
  enabled,
  onViewPreset,
  onFitRoom,
  onFocusSelection,
}: {
  enabled: boolean;
  onViewPreset: (preset: ModelViewPresetId) => void;
  onFitRoom: () => void;
  onFocusSelection: () => void;
}) {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (!isModelViewCanvasFocused() || isAppModalOpen()) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=true]")) return;

      const shortcutMap = readShortcutMap();
      for (const actionId of MODEL_VIEW_SHORTCUT_ACTION_IDS) {
        if (!eventMatchesBinding(event, shortcutMap[actionId])) continue;
        event.preventDefault();
        event.stopPropagation();
        if (actionId === "modelFitRoom") {
          onFitRoom();
          return;
        }
        if (actionId === "modelFocusSelection") {
          onFocusSelection();
          return;
        }
        const preset = PRESET_BY_ACTION[actionId];
        if (preset) onViewPreset(preset);
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [enabled, onFitRoom, onFocusSelection, onViewPreset]);
}
