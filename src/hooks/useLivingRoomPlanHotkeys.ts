import { useEffect } from "react";
import { isAppModalOpen } from "./appModalGate";
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
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isAppModalOpen()) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select")) return;
      if (projectHomeOpen) return;
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
        if (workspaceView === "model") {
          event.preventDefault();
          onClearSelection();
        }
        return;
      }
      if (event.key === "1") {
        event.preventDefault();
        onView("plan");
        return;
      }
      if (event.key === "2") {
        event.preventDefault();
        onView("model");
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
    canRedo, canUndo, onClearSelection, onCycleSelection, onDelete, onDuplicate, onNudge, onRedo, onRotateSelection,
    onUndo, onView, projectHomeOpen, snapSizeMm, workspaceView,
  ]);
}
