import { useState } from "react";
import {
  cabinetTypeLabels,
  supportsCountertop,
  type CabinetInstance,
  type CabinetProject,
  type CabinetType,
} from "../domain/cabinetDimensions";
import type { CabinetRun } from "../domain/cabinetLibrary";
import { createRunAuthoringModel } from "../domain/cabinetRunAuthoring";
import type { WallLayoutSummary } from "../domain/wallLayout";

type WallRunInspectorProps = {
  run: CabinetRun | null;
  summary: WallLayoutSummary;
  project: CabinetProject;
  activeCabinet: CabinetInstance | null;
  fillerCount: number;
  countertopCount: number;
  onSelectRun: () => void;
  onSelectCabinet: (cabinetId: string) => void;
  onAutoPack: () => void;
  onCompleteWall: () => void;
  onReplaceFamily: (type: CabinetType) => void;
  onSplitCabinet: () => void;
  onToggleCountertopBreak: () => void;
  onDuplicateCabinet: () => void;
  onDeleteCabinet: () => void;
};

export function WallRunInspector({
  run,
  summary,
  project,
  activeCabinet,
  fillerCount,
  countertopCount,
  onSelectRun,
  onSelectCabinet,
  onAutoPack,
  onCompleteWall,
  onReplaceFamily,
  onSplitCabinet,
  onToggleCountertopBreak,
  onDuplicateCabinet,
  onDeleteCabinet,
}: WallRunInspectorProps) {
  const [replacementFamily, setReplacementFamily] = useState<CabinetType>("base");
  const model = createRunAuthoringModel({
    project,
    run,
    activeCabinetId: activeCabinet?.id ?? null,
  });
  const selectedReplacement = model.replacementTypes.includes(replacementFamily)
    ? replacementFamily
    : model.replacementTypes[0];
  const activeInRun = Boolean(
    activeCabinet && run?.cabinetIds.includes(activeCabinet.id),
  );
  const canBreakCountertop = Boolean(
    activeInRun &&
      run?.band === "base" &&
      activeCabinet &&
      supportsCountertop(activeCabinet.config.type) &&
      model.members[model.members.length - 1]?.id !== activeCabinet.id,
  );

  return (
    <section className="property-section wall-run-inspector">
      <div className="property-section-heading">
        <div>
          <strong>Run Authoring</strong>
          <span>{summary.label} · {summary.lengthMm} mm</span>
        </div>
        <span className={`run-health is-${model.health}`}>
          {run ? model.health : "no run"}
        </span>
      </div>

      {run ? (
        <>
          <div className="wall-run-inspector-grid">
            <div><span>Band</span><strong>{run.band}</strong></div>
            <div><span>Run span</span><strong>{model.spanMm} mm</strong></div>
            <div><span>Members</span><strong>{model.members.length}</strong></div>
            <div><span>Open gaps</span><strong>{model.gaps.length}</strong></div>
          </div>

          <div className="run-member-strip" aria-label="Ordered run members">
            {model.members.map((cabinet, index) => (
              <button
                key={cabinet.id}
                type="button"
                className={activeCabinet?.id === cabinet.id ? "is-active" : ""}
                title={`${cabinet.name} · ${cabinet.config.dimensions.width} mm`}
                onClick={() => onSelectCabinet(cabinet.id)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{cabinet.config.dimensions.width}</strong>
                {cabinet.config.countertopBreakAfter ? <i title="Countertop break">|</i> : null}
              </button>
            ))}
          </div>

          {model.gaps.length > 0 || model.overlapCount > 0 ? (
            <div className="run-diagnostics">
              {model.gaps.slice(0, 3).map((gap) => (
                <span key={`${gap.afterCabinetId}-${gap.beforeCabinetId}`}>
                  Gap {gap.widthMm} mm between run members
                </span>
              ))}
              {model.overlapCount > 0 ? <span>{model.overlapCount} overlapping member pair(s)</span> : null}
            </div>
          ) : (
            <p className="run-ready-note">Continuous run. Generated outputs are current.</p>
          )}

          <div className="run-generated-row">
            <span>Generated</span>
            <strong>{fillerCount} fillers</strong>
            <strong>{countertopCount} tops</strong>
            <strong>{model.countertopBreakCount} breaks</strong>
          </div>

          <div className="wall-run-inspector-actions">
            <button type="button" onClick={onSelectRun}>Select Run</button>
            <button type="button" onClick={onAutoPack}>Pack Members</button>
            <button type="button" className="is-primary" onClick={onCompleteWall}>Complete Wall</button>
          </div>

          <div className="run-command-group">
            <label htmlFor="run-replacement-family">Replace selected family</label>
            <div>
              <select
                id="run-replacement-family"
                value={selectedReplacement ?? ""}
                disabled={!activeInRun || model.replacementTypes.length < 2}
                onChange={(event) => setReplacementFamily(event.currentTarget.value as CabinetType)}
              >
                {model.replacementTypes.map((type) => (
                  <option key={type} value={type}>{cabinetTypeLabels[type]}</option>
                ))}
              </select>
              <button
                type="button"
                disabled={!activeInRun || !selectedReplacement || selectedReplacement === activeCabinet?.config.type}
                onClick={() => selectedReplacement && onReplaceFamily(selectedReplacement)}
              >
                Replace
              </button>
            </div>
          </div>

          <div className="run-context-actions">
            <button type="button" disabled={!activeInRun || !model.canSplitActive} onClick={onSplitCabinet}>
              Split
            </button>
            <button type="button" disabled={!activeInRun} onClick={onDuplicateCabinet}>Duplicate</button>
            <button
              type="button"
              className={activeCabinet?.config.countertopBreakAfter ? "is-active" : ""}
              disabled={!canBreakCountertop}
              onClick={onToggleCountertopBreak}
            >
              Top Break
            </button>
            <button type="button" className="is-danger" disabled={!activeInRun} onClick={onDeleteCabinet}>Delete</button>
          </div>

          {run.cornerTransition ? <p className="engineering-note">Corner transition detected and retained.</p> : null}
        </>
      ) : (
        <p className="engineering-note">Place or select a cabinet on this wall to begin a run.</p>
      )}
    </section>
  );
}
