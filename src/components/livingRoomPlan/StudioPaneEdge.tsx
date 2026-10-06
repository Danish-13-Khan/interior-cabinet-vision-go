import { PaneResizeHandle } from "../PaneResizeHandle";
import { STUDIO_PANE_MIN } from "./useStudioPanes";

type StudioPaneEdgeProps = {
  edge: "start" | "end";
  width: number;
  max: number;
  maximized: boolean;
  onWidth: (width: number) => void;
  onMaximize: () => void;
};

/** Drag to resize, or fill the workspace and restore. */
export function StudioPaneEdge({ edge, width, max, maximized, onWidth, onMaximize }: StudioPaneEdgeProps) {
  return (
    <div className={`studio-pane-edge is-${edge}`}>
      <button
        type="button"
        aria-pressed={maximized}
        data-testid={edge === "end" ? "catalog-pane-maximize" : "inspector-pane-maximize"}
        onClick={onMaximize}
      >
        {maximized ? "Restore" : "Maximize"}
      </button>
      <PaneResizeHandle
        axis="x"
        value={width}
        min={STUDIO_PANE_MIN}
        max={Math.max(STUDIO_PANE_MIN, max)}
        invert={edge === "start"}
        ariaLabel={edge === "end" ? "Resize catalog" : "Resize inspector"}
        onChange={onWidth}
      />
    </div>
  );
}
