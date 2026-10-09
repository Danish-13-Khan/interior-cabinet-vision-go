import { PaneResizeHandle } from "../PaneResizeHandle";
import { STUDIO_PANE_MIN } from "./useStudioPanes";

type StudioPaneEdgeProps = {
  edge: "start" | "end";
  width: number;
  max: number;
  min?: number;
  onWidth: (width: number) => void;
};

/** Drag to resize the side pane. */
export function StudioPaneEdge({ edge, width, max, min = STUDIO_PANE_MIN, onWidth }: StudioPaneEdgeProps) {
  return (
    <div className={`studio-pane-edge is-${edge}`}>
      <PaneResizeHandle
        axis="x"
        value={width}
        min={Math.min(min, max)}
        max={Math.max(min, max)}
        invert={edge === "start"}
        ariaLabel={edge === "end" ? "Resize catalog" : "Resize inspector"}
        onChange={onWidth}
      />
    </div>
  );
}
