import { useEffect } from "react";
import {
  eventMatchesBinding,
  readShortcutMap,
} from "../domain/desktopUx";
import { isAppModalOpen } from "./appModalGate";
import { isModelViewCanvasFocused } from "./modelViewFocusGate";
import type { LivingRoomWorkspaceView } from "../components/livingRoomPlan/workspaceProps";

export function useLivingRoomPlanHotkeys({
  projectHomeOpen,
  snapSizeMm,
  workspaceView,
  canUndo,
  canRedo,
  onView,
  onUndo,
  onRedo,
  onDuplicate,
  onDelete,
  onRotateSelection,
  onNudge,
  onClearSelection,
  onCycleSelection,
  onFitPlan,
  onFitSelection,
  onCancelTool,
  onMeasureTool,
  onOpenMaterial,
}: {
  projectHomeOpen: boolean;
  snapSizeMm: number;
  workspaceView: LivingRoomWorkspaceView;
  canUndo: boolean;
  canRedo: boolean;
  onView: (view: LivingRoomWorkspaceView) => void;
  onUndo: () => void;
  onRedo: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRotateSelection: (delta: number) => void;
  onNudge: (dx: number, dz: number) => void;
  onClearSelection: () => void;
  onCycleSelection?: (delta: 1 | -1) => void;
  onFitPlan?: () => void;
  onFitSelection?: () => void;
  onCancelTool?: () => void;
  onMeasureTool?: () => void;
  onOpenMaterial?: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isAppModalOpen()) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select")) return;
      if (projectHomeOpen) return;
      const modelFocused = isModelViewCanvasFocused();
      const shortcutMap = readShortcutMap();

      // Material browser — honour shortcutMap.openMaterial even with 3D canvas focused.
      if (onOpenMaterial && eventMatchesBinding(event, shortcutMap.openMaterial)) {
        event.preventDefault();
        onOpenMaterial();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          if (canRedo) onRedo();
        } else if (canUndo) {
          onUndo();
        }
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        onCancelTool?.();
        onClearSelection();
        return;
      }
      if (event.key === "1" && !event.shiftKey) {
        if (modelFocused) return;
        event.preventDefault();
        onView("plan");
        return;
      }
      if (event.key === "2" && !event.shiftKey) {
        if (modelFocused) return;
        event.preventDefault();
        onView("model");
        return;
      }
      if (event.key.toLowerCase() === "f" && !event.metaKey && !event.ctrlKey) {
        if (modelFocused) return;
        event.preventDefault();
        if (event.shiftKey) onFitSelection?.();
        else onFitPlan?.();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "0") {
        event.preventDefault();
        onFitPlan?.();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "d") {
        event.preventDefault();
        onDuplicate();
        return;
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        onDelete();
        return;
      }
      if (event.key.toLowerCase() === "m" && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        onMeasureTool?.();
        return;
      }
      if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        onRotateSelection(event.shiftKey ? -90 : 90);
        return;
      }
      if ((event.key === "[" || event.key === "]") && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        onCycleSelection?.(event.key === "]" ? 1 : -1);
        return;
      }
      const amount = event.shiftKey ? snapSizeMm * 5 : snapSizeMm;
      if (event.key === "ArrowLeft") onNudge(-amount, 0);
      if (event.key === "ArrowRight") onNudge(amount, 0);
      if (event.key === "ArrowUp") onNudge(0, -amount);
      if (event.key === "ArrowDown") onNudge(0, amount);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    canRedo, canUndo, onCancelTool, onClearSelection, onCycleSelection, onDelete, onDuplicate, onFitPlan,
    onFitSelection, onMeasureTool, onNudge, onOpenMaterial, onRedo, onRotateSelection, onUndo, onView,
    projectHomeOpen, snapSizeMm, workspaceView,
  ]);
}
