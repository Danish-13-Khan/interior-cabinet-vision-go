import {
  PANE_DISPLAY_MODE_LABELS,
  PANE_DISPLAY_MODES,
  type PaneDisplayMode,
} from "../domain/desktopUx/paneDisplayMode";
import type { PaneViewTransform } from "../domain/desktopUx/paneViewNav";
import { formatPaneScaleLabel } from "../domain/desktopUx/paneViewNav";

type WorkspacePaneNavToolsProps = {
  transform: PaneViewTransform;
  sheetScaleText: string;
  displayMode: PaneDisplayMode;
  panActive: boolean;
  onFit: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onTogglePan: () => void;
  onDisplayModeChange: (mode: PaneDisplayMode) => void;
  /** Hide display mode select (e.g. 3D pane). */
  showDisplayMode?: boolean;
  /** Hide zoom/pan (e.g. orbit-controlled 3D). */
  showZoomPan?: boolean;
};

export function WorkspacePaneNavTools({
  transform,
  sheetScaleText,
  displayMode,
  panActive,
  onFit,
  onZoomIn,
  onZoomOut,
  onTogglePan,
  onDisplayModeChange,
  showDisplayMode = true,
  showZoomPan = true,
}: WorkspacePaneNavToolsProps) {
  const scaleLabel = formatPaneScaleLabel(sheetScaleText, transform.zoom);

  return (
    <span className="pane-nav-tools" aria-label="View navigation">
      <button type="button" className="tb-btn" title="Fit drawing" onClick={onFit}>
        Fit
      </button>
      {showZoomPan ? (
        <>
          <button type="button" className="tb-btn" title="Zoom out" onClick={onZoomOut}>
            −
          </button>
          <button type="button" className="tb-btn" title="Zoom in" onClick={onZoomIn}>
            +
          </button>
          <button
            type="button"
            className={`tb-btn ${panActive ? "tb-accent" : ""}`}
            title="Pan view"
            onClick={onTogglePan}
          >
            Pan
          </button>
        </>
      ) : null}
      {showDisplayMode ? (
        <label className="pane-nav-display">
          <span className="sr-only">Display mode</span>
          <select
            value={displayMode}
            title="Display mode"
            onChange={(event) =>
              onDisplayModeChange(event.target.value as PaneDisplayMode)
            }
          >
            {PANE_DISPLAY_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {PANE_DISPLAY_MODE_LABELS[mode]}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <span className="pane-nav-scale" title="Sheet scale · zoom">
        {scaleLabel}
      </span>
    </span>
  );
}
