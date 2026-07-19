import { useEffect, useState } from "react";
import { CutlistPanel } from "./CutlistPanel";
import { ProjectBrowser } from "./ProjectBrowser";
import {
  CABINET_DEPTH_MAX_MM,
  CABINET_DEPTH_MIN_MM,
  CABINET_DEPTH_STEP_MM,
  CABINET_HEIGHT_MAX_MM,
  CABINET_HEIGHT_MIN_MM,
  CABINET_HEIGHT_STEP_MM,
  CABINET_WIDTH_MAX_MM,
  CABINET_WIDTH_MIN_MM,
  CABINET_WIDTH_STEP_MM,
  cabinetTypeLabels,
  clampCabinetDepth,
  clampCabinetHeight,
  clampCabinetWidth,
  clampShelfCount,
  clampToeKickHeight,
  clampToeKickInset,
  getDefaultCabinetConfig,
  normalizeRotationAngle,
  supportsDoors,
  supportsShelves,
  supportsToeKick,
  supportsWallPlacement,
  type CabinetConfig,
  type CabinetInstance,
  type CabinetPlacement,
  type CabinetType,
} from "../domain/cabinetDimensions";
import type {
  CabinetCutlistItem,
  CabinetDerivedMetrics,
  PanelName,
} from "../domain/cabinetGeometry";
type SavedProjectSummary = {
  id: string;
  name: string;
  thumbnail: string;
  updatedAt: string;
};

type DimensionControlsProps = {
  cabinetCount: number;
  cabinetCutlistItems: CabinetCutlistItem[];
  cabinets: CabinetInstance[];
  config: CabinetConfig;
  derivedMetrics: CabinetDerivedMetrics;
  cutlistItems: CabinetCutlistItem[];
  projectFilePath: string | null;
  projectStatus: string;
  savedProjects: SavedProjectSummary[];
  snapSizeMm: number;
  selectedCabinetId: string | null;
  selectedPanelName: PanelName | null;
  selectedPlacement: CabinetPlacement | null;
  selectionLabel: string;
  validationMessages: string[];
  onAttachmentChange: (attachment: CabinetPlacement["attachment"]) => void;
  onConfigChange: (config: Partial<CabinetConfig>) => void;
  onDeleteSavedProject: (projectId: string) => void;
  onDuplicateCabinet: () => void;
  onDuplicateSavedProject: (projectId: string) => void;
  onExportCutlistCsv: () => Promise<void>;
  onExportProjectJson: () => Promise<void>;
  onLoadProject: () => Promise<void>;
  onLoadSavedProject: (projectId: string) => void;
  onPlacementChange: (axis: "x" | "y" | "z", value: number) => void;
  onRemoveCabinet: () => void;
  onRenameCabinet: (cabinetId: string, name: string) => void;
  onRenameSavedProject: (projectId: string, name: string) => void;
  onReset: () => void;
  onRotationChange: (rotation: number) => void;
  onSaveProject: () => Promise<void>;
  onSaveToProjectBrowser: () => void | Promise<void>;
  onSelectCabinet: (cabinetId: string) => void;
};

type NumericInputKey =
  | "width"
  | "height"
  | "depth"
  | "shelfCount"
  | "toeKickHeight"
  | "toeKickInset"
  | "placementX"
  | "placementY"
  | "placementZ";

export function DimensionControls({
  cabinetCount,
  cabinetCutlistItems,
  cabinets,
  config,
  derivedMetrics,
  cutlistItems,
  projectFilePath,
  projectStatus,
  savedProjects,
  snapSizeMm,
  selectedCabinetId,
  selectedPanelName,
  selectedPlacement,
  selectionLabel,
  validationMessages,
  onAttachmentChange,
  onConfigChange,
  onDeleteSavedProject,
  onDuplicateCabinet,
  onDuplicateSavedProject,
  onExportCutlistCsv,
  onExportProjectJson,
  onLoadProject,
  onLoadSavedProject,
  onPlacementChange,
  onRemoveCabinet,
  onRenameCabinet,
  onRenameSavedProject,
  onReset,
  onRotationChange,
  onSaveProject,
  onSaveToProjectBrowser,
  onSelectCabinet,
}: DimensionControlsProps) {
  const [inputs, setInputs] = useState<Record<NumericInputKey, string>>({
    width: String(config.dimensions.width),
    height: String(config.dimensions.height),
    depth: String(config.dimensions.depth),
    shelfCount: String(config.shelfCount),
    toeKickHeight: String(config.toeKickHeight),
    toeKickInset: String(config.toeKickInset),
    placementX: String(selectedPlacement?.x ?? 0),
    placementY: String(selectedPlacement?.y ?? 0),
    placementZ: String(selectedPlacement?.z ?? 0),
  });

  const [editCabinetNameId, setEditCabinetNameId] = useState<string | null>(null);
  const [editCabinetNameValue, setEditCabinetNameValue] = useState("");

  useEffect(() => {
    setInputs({
      width: String(config.dimensions.width),
      height: String(config.dimensions.height),
      depth: String(config.dimensions.depth),
      shelfCount: String(config.shelfCount),
      toeKickHeight: String(config.toeKickHeight),
      toeKickInset: String(config.toeKickInset),
      placementX: String(selectedPlacement?.x ?? 0),
      placementY: String(selectedPlacement?.y ?? 0),
      placementZ: String(selectedPlacement?.z ?? 0),
    });
  }, [
    config.dimensions.depth,
    config.dimensions.height,
    config.dimensions.width,
    config.shelfCount,
    config.toeKickHeight,
    config.toeKickInset,
    selectedPlacement?.x,
    selectedPlacement?.y,
    selectedPlacement?.z,
  ]);

  function handleTypeChange(type: CabinetType) {
    onConfigChange(getDefaultCabinetConfig(type));
  }

  function handleNumericInputChange(key: NumericInputKey, value: string) {
    setInputs((currentInputs) => ({
      ...currentInputs,
      [key]: value,
    }));

    if (value.trim() === "") {
      return;
    }

    const parsedValue = Number(value);

    if (!Number.isFinite(parsedValue)) {
      return;
    }

    switch (key) {
      case "width":
        onConfigChange({
          dimensions: {
            ...config.dimensions,
            width: clampCabinetWidth(parsedValue),
          },
        });
        return;
      case "height":
        onConfigChange({
          dimensions: {
            ...config.dimensions,
            height: clampCabinetHeight(parsedValue),
          },
        });
        return;
      case "depth":
        onConfigChange({
          dimensions: {
            ...config.dimensions,
            depth: clampCabinetDepth(parsedValue),
          },
        });
        return;
      case "shelfCount":
        onConfigChange({ shelfCount: clampShelfCount(parsedValue) });
        return;
      case "toeKickHeight":
        onConfigChange({ toeKickHeight: clampToeKickHeight(parsedValue) });
        return;
      case "toeKickInset":
        onConfigChange({ toeKickInset: clampToeKickInset(parsedValue) });
        return;
      case "placementX":
        onPlacementChange("x", parsedValue);
        return;
      case "placementY":
        onPlacementChange("y", parsedValue);
        return;
      case "placementZ":
        onPlacementChange("z", parsedValue);
        return;
    }
  }

  function handleBlur(key: NumericInputKey) {
    const currentValueMap: Record<NumericInputKey, number> = {
      width: config.dimensions.width,
      height: config.dimensions.height,
      depth: config.dimensions.depth,
      shelfCount: config.shelfCount,
      toeKickHeight: config.toeKickHeight,
      toeKickInset: config.toeKickInset,
      placementX: selectedPlacement?.x ?? 0,
      placementY: selectedPlacement?.y ?? 0,
      placementZ: selectedPlacement?.z ?? 0,
    };

    setInputs((currentInputs) => ({
      ...currentInputs,
      [key]: String(currentValueMap[key]),
    }));
  }

  function handleStartRenameCabinet(cabinetId: string) {
    const cabinet = cabinets.find((c) => c.id === cabinetId);
    if (cabinet) {
      setEditCabinetNameId(cabinetId);
      setEditCabinetNameValue(cabinet.name);
    }
  }

  function handleFinishRenameCabinet(cabinetId: string) {
    if (editCabinetNameValue.trim()) {
      onRenameCabinet(cabinetId, editCabinetNameValue.trim());
    }
    setEditCabinetNameId(null);
    setEditCabinetNameValue("");
  }

  const showStructureSection =
    supportsShelves(config.type) || supportsDoors(config.type) || supportsToeKick(config.type);
  const showWallTools = supportsWallPlacement(config.type);
  const attachment = selectedPlacement?.attachment ?? "floor";
  const rotation = normalizeRotationAngle(selectedPlacement?.rotation ?? 0);

  return (
    <div className="controls-card">
      <div className="controls-header">
        <h1>Room Designer</h1>
        <p>Design rooms by adding furniture, rotating items, and mounting on walls.</p>
      </div>

      <div className="controls-form">
        <ProjectBrowser
          projects={savedProjects}
          onDeleteProject={onDeleteSavedProject}
          onDuplicateProject={onDuplicateSavedProject}
          onLoadProject={onLoadSavedProject}
          onRenameProject={onRenameSavedProject}
          onSaveCurrent={onSaveToProjectBrowser}
        />

        <div className="control-section">
          <div className="section-heading">
            <h2>Scene Items</h2>
            <span>{cabinetCount} items</span>
          </div>

          <div className="cabinet-list">
            {cabinets.map((cabinet) => {
              const isEditing = editCabinetNameId === cabinet.id;
              return (
                <div
                  key={cabinet.id}
                  className={`cabinet-list-item ${cabinet.id === selectedCabinetId ? "active" : ""}`}
                  onClick={() => onSelectCabinet(cabinet.id)}
                >
                  <span className="cabinet-list-icon">
                    {cabinetTypeLabels[cabinet.config.type].charAt(0)}
                  </span>
                  {isEditing ? (
                    <input
                      className="cabinet-name-edit"
                      value={editCabinetNameValue}
                      onChange={(e) => setEditCabinetNameValue(e.target.value)}
                      onBlur={() => handleFinishRenameCabinet(cabinet.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleFinishRenameCabinet(cabinet.id);
                        if (e.key === "Escape") {
                          setEditCabinetNameId(null);
                          setEditCabinetNameValue("");
                        }
                      }}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      className="cabinet-list-name"
                      onDoubleClick={() => handleStartRenameCabinet(cabinet.id)}
                      title="Double-click to rename"
                    >
                      {cabinet.name}
                    </span>
                  )}
                  <span className="cabinet-list-type">
                    {cabinetTypeLabels[cabinet.config.type]}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="project-actions">
            <button type="button" onClick={onDuplicateCabinet} disabled={!selectedCabinetId}>
              Duplicate
            </button>
            <button
              type="button"
              onClick={onRemoveCabinet}
              disabled={!selectedCabinetId || cabinets.length <= 1}
            >
              Remove
            </button>
          </div>
        </div>

        {selectedCabinetId ? (
          <>
            <div className="control-section">
              <div className="section-heading">
                <h2>Dimensions</h2>
              </div>

              <div className="field-grid">
                <div className="field-group">
                  <label htmlFor="dim-width">Width (mm)</label>
                  <input
                    id="dim-width"
                    type="number"
                    min={CABINET_WIDTH_MIN_MM}
                    max={CABINET_WIDTH_MAX_MM}
                    step={CABINET_WIDTH_STEP_MM}
                    value={inputs.width}
                    onChange={(event) => handleNumericInputChange("width", event.currentTarget.value)}
                    onBlur={() => handleBlur("width")}
                  />
                </div>
                <div className="field-group">
                  <label htmlFor="dim-height">Height (mm)</label>
                  <input
                    id="dim-height"
                    type="number"
                    min={CABINET_HEIGHT_MIN_MM}
                    max={CABINET_HEIGHT_MAX_MM}
                    step={CABINET_HEIGHT_STEP_MM}
                    value={inputs.height}
                    onChange={(event) => handleNumericInputChange("height", event.currentTarget.value)}
                    onBlur={() => handleBlur("height")}
                  />
                </div>
                <div className="field-group">
                  <label htmlFor="dim-depth">Depth (mm)</label>
                  <input
                    id="dim-depth"
                    type="number"
                    min={CABINET_DEPTH_MIN_MM}
                    max={CABINET_DEPTH_MAX_MM}
                    step={CABINET_DEPTH_STEP_MM}
                    value={inputs.depth}
                    onChange={(event) => handleNumericInputChange("depth", event.currentTarget.value)}
                    onBlur={() => handleBlur("depth")}
                  />
                </div>
              </div>

              <div className="field-grid">
                <div className="field-group">
                  <label htmlFor="rot-slider">Rotation</label>
                  <select
                    id="rot-slider"
                    value={rotation}
                    onChange={(event) => onRotationChange(Number(event.target.value))}
                  >
                    <option value={0}>0°</option>
                    <option value={90}>90°</option>
                    <option value={180}>180°</option>
                    <option value={270}>270°</option>
                  </select>
                </div>

                <div className="field-group">
                  <label htmlFor="type-select">Type</label>
                  <select
                    id="type-select"
                    value={config.type}
                    onChange={(event) => handleTypeChange(event.target.value as CabinetType)}
                  >
                    {(Object.keys(cabinetTypeLabels) as CabinetType[]).map((type) => (
                      <option key={type} value={type}>
                        {cabinetTypeLabels[type]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="control-section">
              <div className="section-heading">
                <h2>Placement</h2>
              </div>

              {showWallTools ? (
                <div className="wall-tools">
                  <label>Attachment</label>
                  <div className="button-row">
                    <button
                      type="button"
                      className={attachment === "floor" ? "active" : ""}
                      onClick={() => onAttachmentChange("floor")}
                    >
                      Floor
                    </button>
                    <button
                      type="button"
                      className={attachment === "back-wall" ? "active" : ""}
                      onClick={() => onAttachmentChange("back-wall")}
                    >
                      Back Wall
                    </button>
                    <button
                      type="button"
                      className={attachment === "left-wall" ? "active" : ""}
                      onClick={() => onAttachmentChange("left-wall")}
                    >
                      Left Wall
                    </button>
                    <button
                      type="button"
                      className={attachment === "right-wall" ? "active" : ""}
                      onClick={() => onAttachmentChange("right-wall")}
                    >
                      Right Wall
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="field-grid">
                <div className="field-group">
                  <label htmlFor="placement-x">X</label>
                  <input
                    id="placement-x"
                    type="number"
                    step={snapSizeMm}
                    value={inputs.placementX}
                    onChange={(event) => handleNumericInputChange("placementX", event.currentTarget.value)}
                    onBlur={() => handleBlur("placementX")}
                  />
                </div>
                <div className="field-group">
                  <label htmlFor="placement-y">Y</label>
                  <input
                    id="placement-y"
                    type="number"
                    step={snapSizeMm}
                    value={inputs.placementY}
                    onChange={(event) => handleNumericInputChange("placementY", event.currentTarget.value)}
                    onBlur={() => handleBlur("placementY")}
                  />
                </div>
                <div className="field-group">
                  <label htmlFor="placement-z">Z</label>
                  <input
                    id="placement-z"
                    type="number"
                    step={snapSizeMm}
                    value={inputs.placementZ}
                    onChange={(event) => handleNumericInputChange("placementZ", event.currentTarget.value)}
                    onBlur={() => handleBlur("placementZ")}
                  />
                </div>
              </div>
            </div>

            {showStructureSection ? (
              <div className="control-section">
                <div className="section-heading">
                  <h2>Structure</h2>
                </div>

                {supportsShelves(config.type) ? (
                  <div className="field-group">
                    <label htmlFor="shelf-count">Shelves</label>
                    <input
                      id="shelf-count"
                      type="number"
                      min={0}
                      max={6}
                      step={1}
                      value={inputs.shelfCount}
                      onChange={(event) => handleNumericInputChange("shelfCount", event.currentTarget.value)}
                      onBlur={() => handleBlur("shelfCount")}
                    />
                  </div>
                ) : null}

                {supportsDoors(config.type) ? (
                  <div className="field-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={config.hasDoors}
                        onChange={(event) => onConfigChange({ hasDoors: event.currentTarget.checked })}
                      />
                      Doors
                    </label>
                  </div>
                ) : null}

                {supportsToeKick(config.type) ? (
                  <div className="field-grid">
                    <div className="field-group">
                      <label htmlFor="toe-kick-height">Toe Kick Height</label>
                      <input
                        id="toe-kick-height"
                        type="number"
                        min={80}
                        max={180}
                        step={10}
                        value={inputs.toeKickHeight}
                        onChange={(event) => handleNumericInputChange("toeKickHeight", event.currentTarget.value)}
                        onBlur={() => handleBlur("toeKickHeight")}
                      />
                    </div>
                    <div className="field-group">
                      <label htmlFor="toe-kick-inset">Toe Kick Inset</label>
                      <input
                        id="toe-kick-inset"
                        type="number"
                        min={20}
                        max={120}
                        step={10}
                        value={inputs.toeKickInset}
                        onChange={(event) => handleNumericInputChange("toeKickInset", event.currentTarget.value)}
                        onBlur={() => handleBlur("toeKickInset")}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}

        <div className="stats-panel">
          <div className="section-heading">
            <h2>Selected Item</h2>
          </div>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Width</span>
              <strong>{config.dimensions.width} mm</strong>
            </div>
            <div className="stat-item">
              <span className="stat-label">Height</span>
              <strong>{config.dimensions.height} mm</strong>
            </div>
            <div className="stat-item">
              <span className="stat-label">Depth</span>
              <strong>{config.dimensions.depth} mm</strong>
            </div>
            <div className="stat-item">
              <span className="stat-label">3D Parts</span>
              <strong>{derivedMetrics.estimatedPanelCount}</strong>
            </div>
          </div>
          <p className="selection-readout">
            Selected panel: {selectedPanelName ? selectionLabel : "None"}
          </p>
          <p className="selection-readout">
            Placement: {attachment} · {rotation}°
          </p>
        </div>

        {validationMessages.length > 0 ? (
          <div className="warning-panel">
            <div className="section-heading">
              <h2>Checks</h2>
            </div>
            {validationMessages.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        ) : null}

        <div className="project-actions">
          <button type="button" onClick={onSaveProject}>
            Save JSON
          </button>
          <button type="button" onClick={onLoadProject}>
            Open JSON
          </button>
          <button type="button" onClick={onReset}>
            Reset
          </button>
        </div>

        <div className="project-actions">
          <button type="button" onClick={onExportProjectJson}>
            Export Project JSON
          </button>
          <button type="button" onClick={onExportCutlistCsv}>
            Export Parts CSV
          </button>
        </div>

        {projectStatus ? <p className="project-status">{projectStatus}</p> : null}
        {projectFilePath ? (
          <p className="helper-note">Current file: {projectFilePath}</p>
        ) : (
          <p className="helper-note">No project file selected yet.</p>
        )}

        <CutlistPanel items={cabinetCutlistItems} title="Selected Item Parts" />
        <CutlistPanel items={cutlistItems} title="Project Parts" />

        <div className="helper-note">
          Drag the move handle in 3D to reposition items, drag the W, H, and D handles to resize,
          drag the rotation ring to rotate, and mount supported items on walls.
        </div>
      </div>
    </div>
  );
}
