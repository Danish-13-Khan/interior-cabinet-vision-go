import type { DraftingTool } from "./TwoDView";
import type { ViewPreset } from "./cabinetScene/types";

export function DraftingToolButtons({
  draftingTool,
  onDraftingToolChange,
}: {
  draftingTool: DraftingTool;
  onDraftingToolChange: (tool: DraftingTool) => void;
}) {
  return (
    <span className="drawing-drafting-tools" aria-label="Drafting tools">
      {(
        [
          ["select", "Select"],
          ["note", "Note"],
          ["leader", "Leader"],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          type="button"
          className={`tb-btn ${draftingTool === id ? "tb-accent" : ""}`}
          onClick={() => onDraftingToolChange(id)}
        >
          {label}
        </button>
      ))}
    </span>
  );
}

const VIEW_PRESETS: Array<{ id: ViewPreset; label: string }> = [
  { id: "iso", label: "ISO" },
  { id: "front", label: "Front" },
  { id: "side", label: "Side" },
  { id: "top", label: "Top" },
];

export function SceneCameraButtons({
  onSetViewPreset,
}: {
  onSetViewPreset: (preset: ViewPreset) => void;
}) {
  return (
    <span className="drawing-drafting-tools scene-pane-camera" aria-label="3D camera">
      {VIEW_PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          className="tb-btn"
          title={`Camera ${preset.label}`}
          onClick={() => onSetViewPreset(preset.id)}
        >
          {preset.label}
        </button>
      ))}
    </span>
  );
}
