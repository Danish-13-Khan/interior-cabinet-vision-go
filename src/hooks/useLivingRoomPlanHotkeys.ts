import { useEffect } from "react";
import type { LivingRoomWorkspaceView } from "../components/livingRoomPlan/workspaceProps";

export function useLivingRoomPlanHotkeys({
  projectHomeOpen,
  snapSizeMm,
  workspaceView,
  onView,
  onDuplicate,
  onDelete,
  onRotateSelection,
  onNudge,
  onClearSelection,
}: {
  projectHomeOpen: boolean;
  snapSizeMm: number;
  workspaceView: LivingRoomWorkspaceView;
  onView: (view: LivingRoomWorkspaceView) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRotateSelection: (delta: number) => void;
  onNudge: (dx: number, dz: number) => void;
  onClearSelection: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select")) return;
      if (projectHomeOpen) return;
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
      if (event.key === "3") {
        event.preventDefault();
        onView("render");
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
      const amount = event.shiftKey ? snapSizeMm * 5 : snapSizeMm;
      if (event.key === "ArrowLeft") onNudge(-amount, 0);
      if (event.key === "ArrowRight") onNudge(amount, 0);
      if (event.key === "ArrowUp") onNudge(0, -amount);
      if (event.key === "ArrowDown") onNudge(0, amount);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    onClearSelection, onDelete, onDuplicate, onNudge, onRotateSelection, onView,
    projectHomeOpen, snapSizeMm, workspaceView,
  ]);
}
