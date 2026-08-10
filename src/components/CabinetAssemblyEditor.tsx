import { useMemo } from "react";
import { clampCabinetConfig, type CabinetConfig } from "../domain/cabinetDimensions";
import {
  applyCabinetEditorChange,
} from "../domain/cabinetEditorSchema";
import {
  resolveCabinetComposition,
  normalizeComposition,
  syncFlatFieldsFromComposition,
} from "../domain/cabinetComposition";
import {
  collectOpeningLeaves,
  findOpeningNode,
  updateOpeningLeaf,
} from "../domain/cabinetOpeningStructure";
import {
  applyElevationOpeningCommand,
  ELEVATION_CONTENT_SHORT_LABELS,
  getElevationOpeningToolbarState,
  type ElevationOpeningCommand,
} from "../domain/elevationOpeningEdit";
import {
  summarizeCabinetAssembly,
  validateCabinetAssembly,
} from "../domain/cabinetAssembly";
import { layoutCabinetElevationFace } from "../domain/openingLayout";

type CabinetAssemblyEditorProps = {
  config: CabinetConfig;
  activeOpeningId?: string | null;
  onConfigChange: (config: CabinetConfig) => void;
  onSelectOpening?: (openingId: string) => void;
};

export function CabinetAssemblyEditor({
  config,
  activeOpeningId,
  onConfigChange,
  onSelectOpening,
}: CabinetAssemblyEditorProps) {
  const composition = useMemo(() => resolveCabinetComposition(config), [config]);
  const structure = composition.openingStructure;
  const leaves = useMemo(
    () => (structure ? collectOpeningLeaves(structure.root) : []),
    [structure],
  );
  const resolvedActiveId =
    activeOpeningId && structure && findOpeningNode(structure.root, activeOpeningId)
      ? activeOpeningId
      : structure?.activeOpeningId ?? null;
  const activeLeaf = leaves.find((leaf) => leaf.id === resolvedActiveId) ?? leaves[0] ?? null;
  const layout = useMemo(() => layoutCabinetElevationFace(config), [config]);
  const summary = useMemo(() => summarizeCabinetAssembly(config), [config]);
  const issues = useMemo(() => validateCabinetAssembly(config), [config]);
  const state = getElevationOpeningToolbarState(config, activeLeaf?.id);
  const activeRect = layout.openings.find((opening) => opening.id === activeLeaf?.id);

  if (!structure || !activeLeaf) {
    return <p className="property-grid-empty">This family has no editable assembly.</p>;
  }

  function selectOpening(openingId: string) {
    onSelectOpening?.(openingId);
  }

  function applyField(fieldId: string, value: string | number | boolean) {
    const selected = applyCabinetEditorChange(
      config,
      "activeOpening",
      activeLeaf!.id,
      null,
    );
    onConfigChange(applyCabinetEditorChange(selected, fieldId, value, null));
  }

  function applyCommand(command: ElevationOpeningCommand) {
    onConfigChange(applyElevationOpeningCommand(config, command, activeLeaf!.id));
  }

  function applyDrawerRatios(drawerRatios: number[] | undefined) {
    const nextStructure = updateOpeningLeaf(
      structure!,
      activeLeaf!.id,
      { drawerRatios },
      config.type,
      config.dimensions.width,
    );
    const nextComposition = normalizeComposition(
      config.type,
      { ...composition, openingStructure: nextStructure },
      config.dimensions.width,
    );
    onConfigChange(
      clampCabinetConfig({
        ...config,
        composition: nextComposition,
        ...syncFlatFieldsFromComposition(nextComposition),
      }),
    );
  }

  const activeIssues = issues.filter(
    (issue) => !issue.openingId || issue.openingId === activeLeaf.id,
  );

  return (
    <div className="assembly-editor">
      <section className="assembly-summary" aria-label="Assembly summary">
        <span><strong>{summary.openingCount}</strong> openings</span>
        <span><strong>{summary.doorCount}</strong> doors</span>
        <span><strong>{summary.drawerCount}</strong> drawers</span>
        <span><strong>{summary.shelfCount}</strong> shelves</span>
      </section>

      <section className="assembly-section">
        <header className="assembly-section-heading">
          <h2>Opening map</h2>
          <span>Select in elevation or here</span>
        </header>
        <div className="assembly-opening-list">
          {layout.openings.map((opening, index) => (
            <button
              key={opening.id}
              type="button"
              className={`assembly-opening-card ${opening.id === activeLeaf.id ? "is-active" : ""}`}
              onClick={() => selectOpening(opening.id)}
            >
              <span className="assembly-opening-mark">OP-{index + 1}</span>
              <span className="assembly-opening-copy">
                <strong>{opening.label}</strong>
                <small>
                  {ELEVATION_CONTENT_SHORT_LABELS[opening.contentType]} · {Math.round(opening.widthMm)} × {Math.round(opening.heightMm)} mm
                </small>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="assembly-section">
        <header className="assembly-section-heading">
          <h2>{activeLeaf.label}</h2>
          <span>
            {activeRect
              ? `${Math.round(activeRect.widthMm)} × ${Math.round(activeRect.heightMm)} mm`
              : "Selected opening"}
          </span>
        </header>

        <label className="assembly-field">
          <span>Name</span>
          <input
            type="text"
            value={activeLeaf.label}
            onChange={(event) => applyField("openingLabel", event.currentTarget.value)}
          />
        </label>

        <label className="assembly-field">
          <span>Component</span>
          <select
            value={activeLeaf.contentType}
            onChange={(event) => applyField("openingContentType", event.currentTarget.value)}
          >
            {state.allowedContentTypes.map((contentType) => (
              <option key={contentType} value={contentType}>
                {ELEVATION_CONTENT_SHORT_LABELS[contentType]}
              </option>
            ))}
          </select>
        </label>

        {leaves.length > 1 ? (
          <label className="assembly-field">
            <span>Opening share</span>
            <span className="assembly-range-control">
              <input
                type="range"
                min="5"
                max="95"
                step="1"
                value={Math.round((activeLeaf.ratio ?? 1) * 100)}
                onChange={(event) => applyField("openingRatio", Number(event.currentTarget.value))}
              />
              <strong>{Math.round((activeLeaf.ratio ?? 1) * 100)}%</strong>
            </span>
          </label>
        ) : null}

        {activeLeaf.contentType === "door" ? (
          <>
            <label className="assembly-field">
              <span>Door arrangement</span>
              <select
                value={activeLeaf.doorStyle ?? "single"}
                onChange={(event) => applyField("openingLeafDoorStyle", event.currentTarget.value)}
              >
                <option value="single">Single door</option>
                <option value="double">Double door</option>
                <option value="bi-fold">Bi-fold</option>
              </select>
            </label>
            {activeLeaf.doorStyle === "single" ? (
              <label className="assembly-field">
                <span>Hinge side</span>
                <select
                  value={activeLeaf.doorHinge ?? "left"}
                  onChange={(event) => applyField("openingLeafDoorHinge", event.currentTarget.value)}
                >
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </label>
            ) : null}
          </>
        ) : null}

        {activeLeaf.contentType === "drawer-stack" ? (
          <>
            <label className="assembly-field">
              <span>Drawer quantity</span>
              <input
                type="number"
                min="1"
                max="8"
                step="1"
                value={activeLeaf.drawerCount ?? 3}
                onChange={(event) => applyField("openingLeafDrawerCount", Number(event.currentTarget.value))}
              />
            </label>
            <label className="assembly-toggle">
              <input
                type="checkbox"
                checked={!activeLeaf.drawerRatios}
                onChange={(event) => {
                  if (event.currentTarget.checked) {
                    applyDrawerRatios(undefined);
                    return;
                  }
                  const count = Math.max(1, activeLeaf.drawerCount ?? 3);
                  const ratios = Array.from({ length: count }, (_, index) =>
                    count > 1 && index === 0 ? 0.2 : 0.8 / (count - 1),
                  );
                  applyDrawerRatios(ratios);
                }}
              />
              <span>Equal fronts</span>
              <small>{activeLeaf.drawerRatios ? "Custom proportions" : "Equal heights"}</small>
            </label>
            {activeLeaf.drawerRatios ? (
              <div className="assembly-drawer-ratios">
                {activeLeaf.drawerRatios.map((ratio, index) => (
                  <label key={index} className="assembly-field">
                    <span>Drawer {index + 1}</span>
                    <span className="assembly-range-control">
                      <input
                        type="range"
                        min="8"
                        max="80"
                        step="1"
                        value={Math.round(ratio * 100)}
                        onChange={(event) => {
                          const next = [...activeLeaf.drawerRatios!];
                          next[index] = Number(event.currentTarget.value) / 100;
                          applyDrawerRatios(next);
                        }}
                      />
                      <strong>{Math.round(ratio * 100)}%</strong>
                    </span>
                  </label>
                ))}
              </div>
            ) : null}
          </>
        ) : null}

        {activeLeaf.contentType === "door" || activeLeaf.contentType === "open-shelf" ? (
          <>
            <label className="assembly-field">
              <span>Shelf quantity</span>
              <input
                type="number"
                min="0"
                max="6"
                step="1"
                value={activeLeaf.shelfCount ?? 0}
                onChange={(event) => applyField("openingLeafShelfCount", Number(event.currentTarget.value))}
              />
            </label>
            <label className="assembly-toggle">
              <input
                type="checkbox"
                checked={activeLeaf.shelvesAdjustable !== false}
                onChange={(event) => applyField("openingLeafShelvesAdjustable", event.currentTarget.checked)}
              />
              <span>Adjustable shelves</span>
              <small>{activeLeaf.shelvesAdjustable === false ? "Fixed construction" : "Shelf-pin construction"}</small>
            </label>
          </>
        ) : null}
      </section>

      <section className="assembly-section">
        <header className="assembly-section-heading"><h2>Structure</h2></header>
        <div className="assembly-action-grid">
          <button type="button" disabled={!state.canSplitVertical} onClick={() => applyCommand({ kind: "split-vertical" })}>Split vertical</button>
          <button type="button" disabled={!state.canSplitHorizontal} onClick={() => applyCommand({ kind: "split-horizontal" })}>Split horizontal</button>
          <button type="button" disabled={!state.canMerge} onClick={() => applyCommand({ kind: "merge" })}>Merge siblings</button>
          <button type="button" disabled={!state.canDelete} onClick={() => applyCommand({ kind: "delete" })}>Delete opening</button>
          <button type="button" className="assembly-reset" onClick={() => applyCommand({ kind: "reset" })}>Reset family assembly</button>
        </div>
      </section>

      <section className="assembly-section">
        <header className="assembly-section-heading">
          <h2>Build check</h2>
          <span>{activeIssues.length === 0 ? "Selected ready" : `${activeIssues.length} notice${activeIssues.length === 1 ? "" : "s"}`}</span>
        </header>
        {activeIssues.length === 0 ? (
          <p className="assembly-ready">Selected opening passes the current shop rules.</p>
        ) : (
          <div className="assembly-issues">
            {activeIssues.map((issue) => (
              <p key={`${issue.code}-${issue.openingId ?? "cabinet"}`} className={`is-${issue.severity}`}>
                {issue.message}
              </p>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
