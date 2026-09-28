import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useCanvasHeaderToolsSlot } from "../livingRoomPlan/InspectorPlanSettingsSlot";

/**
 * 3D camera toolbar lives in the canvas header when it is mounted; Hide Wall
 * stays on the canvas next to the selected wall.
 */
export function ModelViewLeftChrome(props: { toolbar: ReactNode; wallAction?: ReactNode }) {
  const headerSlot = useCanvasHeaderToolsSlot();
  return (
    <>
      {headerSlot ? createPortal(props.toolbar, headerSlot) : null}
      <div className="lr-model-left-chrome" data-testid="model-left-chrome">
        {headerSlot ? null : props.toolbar}
        {props.wallAction}
      </div>
    </>
  );
}
