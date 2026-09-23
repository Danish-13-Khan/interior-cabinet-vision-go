import { useEffect } from "react";
import type { PlanViewControls } from "../livingRoomPlan/planViewControls";
import { nextModelFieldOfView } from "../../domain/studio/modelFieldOfView";

/** Registers fit and zoom for the model camera while the 3D view is mounted. */
export function RegisterModelViewportControls(props: {
  onRegister?: (controls: PlanViewControls | null) => void;
  fitPlan: () => void;
  fitSelection: () => void;
  fieldOfView: number;
  onFieldOfView: (value: number) => void;
}) {
  const { onRegister, fitPlan, fitSelection, fieldOfView, onFieldOfView } = props;
  useEffect(() => {
    if (!onRegister) return;
    onRegister({
      fitPlan,
      fitSelection,
      zoomIn: () => onFieldOfView(nextModelFieldOfView(fieldOfView, "in")),
      zoomOut: () => onFieldOfView(nextModelFieldOfView(fieldOfView, "out")),
    });
    return () => onRegister(null);
  }, [onRegister, fitPlan, fitSelection, fieldOfView, onFieldOfView]);
  return null;
}
