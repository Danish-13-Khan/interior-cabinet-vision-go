import {
  WALL_LAYOUT_LABELS,
  WALL_LAYOUT_SIDES,
  type WallLayoutSide,
  type WallLayoutSummary,
} from "../domain/wallLayout";

type WallLayoutPanelProps = {
  activeWall: WallLayoutSide;
  summary: WallLayoutSummary;
  onWallChange: (side: WallLayoutSide) => void;
  onSelectWallCabinets: () => void;
  onAutoPack: () => void;
  onFinishEnds: () => void;
};

export function WallLayoutPanel({
  activeWall,
  summary,
  onWallChange,
  onSelectWallCabinets,
  onAutoPack,
  onFinishEnds,
}: WallLayoutPanelProps) {
  const baseBand = summary.bands.find((band) => band.band === "base");
  const wallBand = summary.bands.find((band) => band.band === "wall");
  const tallBand = summary.bands.find((band) => band.band === "tall");

  return (
    <section className="wall-layout-panel" aria-label="Wall layout">
      <div className="wall-layout-title">
        <div>
          <strong>Wall Layout</strong>
          <span>{summary.lengthMm} mm working span</span>
        </div>
        <span className={summary.warnings.length > 0 ? "wall-health is-warning" : "wall-health"}>
          {summary.warnings.length > 0 ? `${summary.warnings.length} issues` : "Clear"}
        </span>
      </div>

      <div className="wall-selector" role="tablist" aria-label="Active room wall">
        {WALL_LAYOUT_SIDES.map((side) => (
          <button
            key={side}
            type="button"
            role="tab"
            aria-selected={activeWall === side}
            className={activeWall === side ? "is-active" : ""}
            onClick={() => onWallChange(side)}
          >
            {WALL_LAYOUT_LABELS[side].replace(" Wall", "")}
          </button>
        ))}
      </div>

      <div className="wall-layout-metrics">
        <div><span>Base</span><strong>{baseBand?.cabinetIds.length ?? 0}</strong></div>
        <div><span>Wall</span><strong>{wallBand?.cabinetIds.length ?? 0}</strong></div>
        <div><span>Tall</span><strong>{tallBand?.cabinetIds.length ?? 0}</strong></div>
        <div><span>Free</span><strong>{Math.round(summary.availableBaseMm)}</strong><small>mm</small></div>
      </div>

      <div className="wall-layout-output">
        <span>{summary.runIds.length} runs</span>
        <span>{summary.fillerCount} fillers</span>
        <span>{summary.countertopCount} tops</span>
      </div>

      {summary.warnings.length > 0 ? (
        <div className="wall-layout-warnings">
          {summary.warnings.slice(0, 3).map((warning) => <span key={warning}>{warning}</span>)}
        </div>
      ) : null}

      <div className="wall-layout-actions">
        <button type="button" onClick={onSelectWallCabinets} disabled={summary.cabinetIds.length === 0}>
          Select Wall
        </button>
        <button type="button" onClick={onAutoPack} disabled={summary.runIds.length === 0}>
          Auto Pack Runs
        </button>
        <button type="button" className="is-primary" onClick={onFinishEnds} disabled={summary.runIds.length === 0}>
          Complete Wall
        </button>
      </div>

      <p className="wall-layout-hint">Drag catalog items into the elevation. Complete Wall packs runs and finishes exposed ends.</p>
    </section>
  );
}
