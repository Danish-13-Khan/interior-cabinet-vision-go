import { interiorsCabinetRunHint, type InteriorsChromeTool } from "../../domain/desktopUx";
import type { InteriorProject } from "../../domain/interiorProject";
import type { PlanReadabilitySettings } from "../../domain/livingRoom";
import { PlanOnDemandChrome } from "./PlanOnDemandChrome";
import { PlanReadabilityToolbar } from "./PlanReadabilityToolbar";
import { PlanPrintExportControls } from "./PlanPrintExportControls";
import type { InteriorsCabinetRunCommands } from "./interiorsCabinetRunCommands";

export function InteriorsCabinetRunTitlebar({
  tool,
  showGrid,
  snapSizeMm,
  readability,
  commands,
  project,
  onPatchDocument,
  onShowGrid,
  onSnapSize,
  onReadability,
}: {
  tool: InteriorsChromeTool;
  showGrid: boolean;
  snapSizeMm: number;
  readability: PlanReadabilitySettings;
  commands?: InteriorsCabinetRunCommands;
  project: InteriorProject;
  onPatchDocument: (
    update: (current: InteriorProject) => InteriorProject,
    status: string,
  ) => void;
  onShowGrid: (value: boolean) => void;
  onSnapSize: (value: number) => void;
  onReadability: (patch: Partial<PlanReadabilitySettings>) => void;
}) {
  return (
    <div className="lr-draw-titlebar lr-plan-titlebar lr-run-titlebar has-readability" data-testid="interiors-cabinet-run-titlebar">
      <p className="lr-plan-title-copy">
        <strong>Cabinet run</strong>
        <span className="lr-plan-title-sep" aria-hidden>·</span>
        <span className="lr-plan-title-hint">{interiorsCabinetRunHint(tool)}</span>
      </p>
      <div className="lr-plan-title-actions">
        <PlanOnDemandChrome
          layers={(
            <PlanReadabilityToolbar
              settings={readability}
              onChange={onReadability}
              planMarksEnabled={commands?.planMarksEnabled}
              onPlanMarks={commands?.onTogglePlanMarks}
            />
          )}
          exportPanel={<PlanPrintExportControls project={project} onPatchDocument={onPatchDocument} />}
        />
        <div className="lr-plan-view-tools" role="group" aria-label="Plan view">
          <span className="lr-plan-units">Units: {readability.unit}</span>
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
    </div>
  );
}
