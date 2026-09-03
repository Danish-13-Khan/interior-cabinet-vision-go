import { interiorsDrawRoomHint, type InteriorsChromeTool } from "../../domain/desktopUx";
import type { BuildTool, PlanReadabilitySettings } from "../../domain/livingRoom";
import { PlanReadabilityToolbar } from "./PlanReadabilityToolbar";

export function InteriorsDrawRoomTitlebar({
  projectName,
  tool,
  buildTool,
  showGrid,
  snapSizeMm,
  readability,
  onShowGrid,
  onSnapSize,
  onReadability,
}: {
  projectName: string;
  tool: InteriorsChromeTool;
  buildTool?: BuildTool;
  showGrid: boolean;
  snapSizeMm: number;
  readability: PlanReadabilitySettings;
  onShowGrid: (value: boolean) => void;
  onSnapSize: (value: number) => void;
  onReadability: (patch: Partial<PlanReadabilitySettings>) => void;
}) {
  return (
    <div className="lr-draw-titlebar lr-plan-titlebar has-readability" data-testid="interiors-draw-titlebar">
      <span>
        <strong>Room plan</strong>
        {" · "}
        <span className="lr-draw-project-name">{projectName}</span>
        {" · "}
        {interiorsDrawRoomHint(tool, buildTool)}
      </span>
      <PlanReadabilityToolbar settings={readability} onChange={onReadability} />
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
