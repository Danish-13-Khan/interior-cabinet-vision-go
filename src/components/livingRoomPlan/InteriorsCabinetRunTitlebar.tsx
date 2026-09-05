import { interiorsCabinetRunHint, type InteriorsChromeTool } from "../../domain/desktopUx";
import type { PlanReadabilitySettings } from "../../domain/livingRoom";
import { PlanReadabilityToolbar } from "./PlanReadabilityToolbar";
import type { InteriorsCabinetRunCommands } from "./interiorsCabinetRunCommands";

export function InteriorsCabinetRunTitlebar({
  tool,
  showGrid,
  snapSizeMm,
  readability,
  commands,
  onShowGrid,
  onSnapSize,
  onReadability,
}: {
  tool: InteriorsChromeTool;
  showGrid: boolean;
  snapSizeMm: number;
  readability: PlanReadabilitySettings;
  commands?: InteriorsCabinetRunCommands;
  onShowGrid: (value: boolean) => void;
  onSnapSize: (value: number) => void;
  onReadability: (patch: Partial<PlanReadabilitySettings>) => void;
}) {
  return (
    <div className="lr-draw-titlebar lr-plan-titlebar lr-run-titlebar has-readability" data-testid="interiors-cabinet-run-titlebar">
      <span>
        <strong>Cabinet run</strong>
        {" · "}
        {interiorsCabinetRunHint(tool)}
      </span>
      <PlanReadabilityToolbar
        settings={readability}
        onChange={onReadability}
        planMarksEnabled={commands?.planMarksEnabled}
        onPlanMarks={commands?.onTogglePlanMarks}
      />
      <small>Scale: Fit · Units: {readability.unit}</small>
      <div>
        <button type="button" className={showGrid ? "is-active" : ""} aria-pressed={showGrid} onClick={() => onShowGrid(!showGrid)}>
          Grid
        </button>
        <select aria-label="Snap size" value={snapSizeMm} onChange={(event) => onSnapSize(Number(event.target.value))}>
          <option value="25">Snap 25 mm</option>
          <option value="50">Snap 50 mm</option>
          <option value="100">Snap 100 mm</option>
        </select>
      </div>
    </div>
  );
}
