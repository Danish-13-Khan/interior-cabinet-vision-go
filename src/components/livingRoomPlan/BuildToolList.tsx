import type { BuildTool } from "../../domain/livingRoom/buildToolCommands";

const tools: Array<{ id: BuildTool; label: string; note: string }> = [
  { id: "select", label: "Select", note: "Drag nodes · move walls · Escape" },
  { id: "measure", label: "Measure", note: "Click A → B · running lengths · snaps" },
  { id: "calibrate-underlay", label: "Calibrate underlay", note: "Mark known distance · scale plan image" },
  { id: "upload-underlay", label: "Upload floor plan", note: "PNG / JPG / WebP tracing image" },
  { id: "draw-room", label: "Draw Room", note: "Drag a rectangle or close a polygon" },
  { id: "draw-wall", label: "Draw Wall", note: "Drag segments · split · join nodes" },
  { id: "draw-partition", label: "Draw Partition", note: "Interior walls · split · delete" },
  { id: "draw-surface", label: "Draw Surface", note: "Polygon zones · material finish" },
  { id: "place-door", label: "Place Doors", note: "Arm tool, then place on a wall" },
  { id: "place-window", label: "Place Windows", note: "Arm tool, then place on a wall" },
  { id: "place-column", label: "Place Column", note: "Click the plan to drop a column" },
];

type BuildToolListProps = {
  activeTool: BuildTool;
  onTool: (tool: BuildTool) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
};

export function BuildToolList({
  activeTool,
  onTool,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: BuildToolListProps) {
  return (
    <div className="lr-build-tool-list" aria-label="Build tools">
      <div className="lr-build-history">
        <button type="button" disabled={!canUndo} onClick={onUndo}>Undo</button>
        <button type="button" disabled={!canRedo} onClick={onRedo}>Redo</button>
      </div>
      {tools.map((tool) => (
        <button
          type="button"
          key={tool.id}
          data-build-tool={tool.id}
          className={activeTool === tool.id ? "is-active" : ""}
          onClick={() => onTool(tool.id)}
        >
          <strong>{tool.label}</strong>
          <small>{tool.note}</small>
        </button>
      ))}
    </div>
  );
}
