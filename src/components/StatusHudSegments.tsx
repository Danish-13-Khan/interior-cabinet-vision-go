import {
  draftingToolLabel,
  formatPointerHud,
  workspaceTabLabel,
  type ViewportHudState,
} from "../domain/desktopUx";

type StatusHudSegmentsProps = {
  hud: ViewportHudState;
  onCycleSnap?: () => void;
  onToggleGrid?: () => void;
};

export function StatusHudSegments({
  hud,
  onCycleSnap,
  onToggleGrid,
}: StatusHudSegmentsProps) {
  return (
    <span className="status-hud" aria-label="Viewport feedback">
      <span className="status-hud-coords" title="Pointer world coordinates (mm)">
        {formatPointerHud(hud.pointer)}
      </span>
      <button
        type="button"
        className="status-hud-chip"
        title="Cycle snap grid"
        onClick={onCycleSnap}
      >
        Snap {hud.snapSizeMm}
      </button>
      <button
        type="button"
        className={`status-hud-chip ${hud.showGrid ? "is-on" : ""}`}
        title="Toggle grid"
        onClick={onToggleGrid}
      >
        Grid {hud.showGrid ? "On" : "Off"}
      </button>
      <span className="status-hud-chip is-static" title="Active drafting tool">
        {draftingToolLabel(hud.draftingTool)}
      </span>
      <span className="status-hud-chip is-static" title="Active workspace view">
        {workspaceTabLabel(hud.workspaceTab)}
        {hud.sheetLabel ? ` · ${hud.sheetLabel}` : ""}
      </span>
      {hud.snapGuideCount && hud.snapGuideCount > 0 ? (
        <span className="status-hud-chip is-accent" title="Active snap guides">
          Guides {hud.snapGuideCount}
        </span>
      ) : null}
    </span>
  );
}
