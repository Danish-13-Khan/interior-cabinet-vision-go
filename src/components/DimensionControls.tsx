import { useEffect, useState } from "react";
import { CutlistPanel } from "./CutlistPanel"; void CutlistPanel;
import { ProjectBrowser } from "./ProjectBrowser"; void ProjectBrowser;
import { CabinetPropertyGrid } from "./CabinetPropertyGrid";
import {
  cabinetTypeLabels,
  clampCabinetDepth,
  clampCabinetHeight,
  clampCabinetWidth,
  clampDrawerCount,
  clampShelfCount,
  clampToeKickHeight,
  clampToeKickInset,
  normalizeRotationAngle,
  supportsWallPlacement,
  type CabinetConfig,
  type CabinetInstance,
  type CabinetPlacement,
} from "../domain/cabinetDimensions";
import type { CabinetPart } from "../domain/cabinetConstruction";
import type {
  CabinetCutlistItem,
  CabinetDerivedMetrics,
  PanelName,
} from "../domain/cabinetGeometry";
import {
  BACK_PANEL_RULES,
  EDGE_BANDING_OPTIONS,
  FINISHES,
  GRAIN_LABELS,
  MATERIAL_PRESETS,
  THICKNESS_PRESETS,
} from "../domain/materialSystem";
import type {
  CabinetGroup,
  CabinetLayer,
  ProjectPreferences,
} from "../domain/cabinetDimensions";
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
  selectedCabinetIds: string[];
  activeCabinetId: string | null;
  selectedPanelName: PanelName | null;
  selectedPlacement: CabinetPlacement | null;
  selectedLayerId: string;
  selectedGroupId: string | null;
  layers: CabinetLayer[];
  groups: CabinetGroup[];
  preferences: ProjectPreferences;
  selectionLabel: string;
  validationMessages: string[];
  constructionParts: CabinetPart[];
  onAttachmentChange: (attachment: CabinetPlacement["attachment"]) => void;
  onAlignSelection: (
    mode:
      | "align-left"
      | "align-center-x"
      | "align-right"
      | "align-top"
      | "align-center-z"
      | "align-bottom"
      | "distribute-x"
      | "distribute-z",
  ) => void;
  onAssignLayer: (layerId: string) => void;
  onConfigChange: (config: Partial<CabinetConfig>) => void;
  onCopySelection: () => void;
  onCreateGroup: () => void;
  onCreateLayer: () => void;
  onClearGroup: () => void;
  onDeleteSavedProject: (projectId: string) => void;
  onDuplicateCabinet: () => void;
  onDuplicateSavedProject: (projectId: string) => void;
  onExportCutlistCsv: () => Promise<void>;
  onExportProjectJson: () => Promise<void>;
  onExportPdf: () => Promise<void>;
  onLayerChange: (layerId: string, patch: Partial<CabinetLayer>) => void;
  onLoadProject: () => Promise<void>;
  onLoadSavedProject: (projectId: string) => void;
  onPasteSelection: () => void;
  onPlacementChange: (axis: "x" | "y" | "z", value: number) => void;
  onPreferenceChange: (patch: Partial<ProjectPreferences>) => void;
  onRemoveCabinet: () => void;
  onRenameCabinet: (cabinetId: string, name: string) => void;
  onRenameSavedProject: (projectId: string, name: string) => void;
  onReset: () => void;
  onRotationChange: (rotation: number) => void;
  onSaveProject: () => Promise<void>;
  onSaveToProjectBrowser: () => void | Promise<void>;
  onSelectCabinet: (cabinetId: string, additive?: boolean) => void;
  onSelectAll: () => void;
  onUndo: () => void;
  onRedo: () => void;
};

type NumericInputKey =
  | "width"
  | "height"
  | "depth"
  | "shelfCount"
  | "drawerCount"
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
  selectedCabinetIds,
  activeCabinetId,
  selectedPanelName,
  selectedPlacement,
  selectedLayerId,
  selectedGroupId,
  layers,
  groups,
  preferences,
  selectionLabel,
  validationMessages,
  constructionParts,
  onAttachmentChange,
  onAlignSelection,
  onAssignLayer,
  onConfigChange,
  onCopySelection,
  onCreateGroup,
  onCreateLayer,
  onClearGroup,
  onDeleteSavedProject,
  onDuplicateCabinet,
  onDuplicateSavedProject,
  onExportCutlistCsv,
  onExportProjectJson,
  onExportPdf,
  onLayerChange,
  onLoadProject,
  onLoadSavedProject,
  onPasteSelection,
  onPlacementChange,
  onPreferenceChange,
  onRemoveCabinet,
  onRenameCabinet,
  onRenameSavedProject,
  onReset,
  onRotationChange,
  onSaveProject,
  onSaveToProjectBrowser,
  onSelectCabinet,
  onSelectAll,
  onUndo,
  onRedo,
}: DimensionControlsProps) {
  void (savedProjects);
  void (derivedMetrics); void (selectedPanelName); void (selectionLabel); void (validationMessages); void (projectFilePath); void (projectStatus);
  void (onDeleteSavedProject); void (onDuplicateSavedProject);
  void (onLoadSavedProject); void (onRenameSavedProject);
  void (onSaveToProjectBrowser); void (onExportCutlistCsv);
  void (onExportProjectJson); void (onExportPdf);
  void (onLoadProject); void (onSaveProject); void (onReset);
  void (cabinetCutlistItems); void (cutlistItems);
  const [inputs, setInputs] = useState<Record<NumericInputKey, string>>({
    width: String(config.dimensions.width),
    height: String(config.dimensions.height),
    depth: String(config.dimensions.depth),
    shelfCount: String(config.shelfCount),
    drawerCount: String(config.drawerCount ?? 0),
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
      drawerCount: String(config.drawerCount ?? 0),
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
    config.drawerCount,
    config.toeKickHeight,
    config.toeKickInset,
    selectedPlacement?.x,
    selectedPlacement?.y,
    selectedPlacement?.z,
  ]);

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
      case "drawerCount":
        onConfigChange({ drawerCount: clampDrawerCount(parsedValue) });
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
      drawerCount: config.drawerCount ?? 0,
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

  const buildRules = config.buildRules;
  const showWallTools = supportsWallPlacement(config.type);
  const attachment = selectedPlacement?.attachment ?? "floor";
  const rotation = normalizeRotationAngle(selectedPlacement?.rotation ?? 0);

  return (
    <div className="controls-card">
      <div className="controls-header">
        <h1>Inspector</h1>
        <p>Cabinet specification, placement, and materials.</p>
      </div>

      <div className="controls-form">
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
                  className={`cabinet-list-item ${selectedCabinetIds.includes(cabinet.id) ? "active" : ""}`}
                  onClick={(event) =>
                    onSelectCabinet(
                      cabinet.id,
                      event.metaKey || event.ctrlKey || event.shiftKey,
                    )}
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
                  {cabinet.groupId ? <span className="cabinet-list-type">Grouped</span> : null}
                </div>
              );
            })}
          </div>

          <div className="project-actions">
            <button type="button" onClick={onUndo}>
              Undo
            </button>
            <button type="button" onClick={onRedo}>
              Redo
            </button>
          </div>

          <div className="project-actions">
            <button type="button" onClick={onCopySelection} disabled={selectedCabinetIds.length === 0}>
              Copy
            </button>
            <button type="button" onClick={onPasteSelection}>
              Paste
            </button>
            <button type="button" onClick={onSelectAll}>
              Select All
            </button>
          </div>

          <div className="project-actions">
            <button type="button" onClick={onDuplicateCabinet} disabled={selectedCabinetIds.length === 0}>
              Duplicate
            </button>
            <button
              type="button"
              onClick={onRemoveCabinet}
              disabled={selectedCabinetIds.length === 0 || cabinets.length <= 1}
            >
              Remove
            </button>
          </div>
        </div>

        <div className="control-section">
          <div className="section-heading">
            <h2>Workflow</h2>
            <span>{selectedCabinetIds.length} selected</span>
          </div>

          <div className="field-grid">
            <div className="field-group">
              <label htmlFor="layer-select">Layer</label>
              <select
                id="layer-select"
                value={selectedLayerId}
                onChange={(event) => onAssignLayer(event.currentTarget.value)}
              >
                {layers.map((layer) => (
                  <option key={layer.id} value={layer.id}>
                    {layer.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label htmlFor="group-status">Group</label>
              <input
                id="group-status"
                type="text"
                value={selectedGroupId ? groups.find((group) => group.id === selectedGroupId)?.name ?? "Grouped" : "None"}
                readOnly
              />
            </div>
          </div>

          <div className="project-actions">
            <button type="button" onClick={onCreateLayer}>
              New Layer
            </button>
            <button type="button" onClick={onCreateGroup} disabled={selectedCabinetIds.length < 2}>
              Group
            </button>
            <button type="button" onClick={onClearGroup} disabled={selectedCabinetIds.length === 0}>
              Ungroup
            </button>
          </div>

          <div className="project-actions">
            <button type="button" onClick={() => onAlignSelection("align-left")} disabled={selectedCabinetIds.length < 2}>
              Align Left
            </button>
            <button type="button" onClick={() => onAlignSelection("align-center-x")} disabled={selectedCabinetIds.length < 2}>
              Center X
            </button>
            <button type="button" onClick={() => onAlignSelection("align-top")} disabled={selectedCabinetIds.length < 2}>
              Align Top
            </button>
            <button type="button" onClick={() => onAlignSelection("distribute-x")} disabled={selectedCabinetIds.length < 3}>
              Distribute X
            </button>
          </div>
        </div>

        <div className="control-section">
          <div className="section-heading">
            <h2>Preferences</h2>
          </div>

          <div className="field-grid">
            <div className="field-group">
              <label htmlFor="snap-size">Snap Grid (mm)</label>
              <select
                id="snap-size"
                value={preferences.snapSizeMm}
                onChange={(event) => onPreferenceChange({ snapSizeMm: Number(event.currentTarget.value) })}
              >
                {[10, 25, 50, 100, 200].map((size) => (
                  <option key={size} value={size}>
                    {size} mm
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field-grid">
            <div className="field-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={preferences.showGrid}
                  onChange={(event) => onPreferenceChange({ showGrid: event.currentTarget.checked })}
                />
                Show grid
              </label>
            </div>
            <div className="field-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={preferences.autoSaveToBrowser}
                  onChange={(event) => onPreferenceChange({ autoSaveToBrowser: event.currentTarget.checked })}
                />
                Auto save browser snapshots
              </label>
            </div>
          </div>

          <div className="parts-list">
            {layers.map((layer) => (
              <div key={layer.id} className="parts-list-item">
                <strong>{layer.name}</strong>
                <span>{layer.visible ? "Visible" : "Hidden"} · {layer.locked ? "Locked" : "Editable"}</span>
                <span className="button-row">
                  <button type="button" onClick={() => onLayerChange(layer.id, { visible: !layer.visible })}>
                    {layer.visible ? "Hide" : "Show"}
                  </button>
                  <button type="button" onClick={() => onLayerChange(layer.id, { locked: !layer.locked })}>
                    {layer.locked ? "Unlock" : "Lock"}
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>

        {activeCabinetId ? (
          <>
            <CabinetPropertyGrid config={config} onConfigChange={onConfigChange} />

            <div className="control-section">
              <div className="section-heading">
                <h2>Placement</h2>
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

            {buildRules ? (
              <div className="control-section">
                <div className="section-heading">
                  <h2>Material & Build</h2>
                </div>

                <div className="field-grid">
                  <div className="field-group">
                    <label htmlFor="material-preset">Material Preset</label>
                    <select
                      id="material-preset"
                      value={buildRules.materialPresetId}
                      onChange={(event) =>
                        onConfigChange({
                          buildRules: {
                            ...buildRules,
                            materialPresetId: event.currentTarget.value as typeof buildRules.materialPresetId,
                          },
                        })}
                    >
                      {MATERIAL_PRESETS.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field-group">
                    <label htmlFor="finish-id">Finish</label>
                    <select
                      id="finish-id"
                      value={buildRules.finishId}
                      onChange={(event) =>
                        onConfigChange({
                          buildRules: {
                            ...buildRules,
                            finishId: event.currentTarget.value as typeof buildRules.finishId,
                          },
                        })}
                    >
                      {FINISHES.map((finish) => (
                        <option key={finish.id} value={finish.id}>
                          {finish.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field-group">
                    <label htmlFor="edge-banding">Edge Banding</label>
                    <select
                      id="edge-banding"
                      value={buildRules.edgeBandingId}
                      onChange={(event) =>
                        onConfigChange({
                          buildRules: {
                            ...buildRules,
                            edgeBandingId: event.currentTarget.value as typeof buildRules.edgeBandingId,
                          },
                        })}
                    >
                      {EDGE_BANDING_OPTIONS.map((edge) => (
                        <option key={edge.id} value={edge.id}>
                          {edge.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field-group">
                    <label htmlFor="grain-direction">Grain</label>
                    <select
                      id="grain-direction"
                      value={buildRules.grainDirection}
                      onChange={(event) =>
                        onConfigChange({
                          buildRules: {
                            ...buildRules,
                            grainDirection: event.currentTarget.value as typeof buildRules.grainDirection,
                          },
                        })}
                    >
                      {(Object.keys(GRAIN_LABELS) as Array<keyof typeof GRAIN_LABELS>).map((grain) => (
                        <option key={grain} value={grain}>
                          {GRAIN_LABELS[grain]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field-group">
                    <label htmlFor="back-rule">Back Panel Rule</label>
                    <select
                      id="back-rule"
                      value={buildRules.backPanelType}
                      onChange={(event) =>
                        onConfigChange({
                          buildRules: {
                            ...buildRules,
                            backPanelType: event.currentTarget.value as typeof buildRules.backPanelType,
                          },
                        })}
                    >
                      {(Object.keys(BACK_PANEL_RULES) as Array<keyof typeof BACK_PANEL_RULES>).map((rule) => (
                        <option key={rule} value={rule}>
                          {rule}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="field-grid">
                  <div className="field-group">
                    <label htmlFor="carcass-thickness">Carcass Thickness</label>
                    <select
                      id="carcass-thickness"
                      value={buildRules.carcassThicknessMm}
                      onChange={(event) =>
                        onConfigChange({
                          buildRules: {
                            ...buildRules,
                            carcassThicknessMm: Number(event.currentTarget.value),
                          },
                        })}
                    >
                      {THICKNESS_PRESETS.filter((preset) => preset.usage === "carcass").map((preset) => (
                        <option key={preset.label} value={preset.valueMm}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field-group">
                    <label htmlFor="back-thickness">Back Thickness</label>
                    <select
                      id="back-thickness"
                      value={buildRules.backPanelThicknessMm}
                      onChange={(event) =>
                        onConfigChange({
                          buildRules: {
                            ...buildRules,
                            backPanelThicknessMm: Number(event.currentTarget.value),
                          },
                        })}
                    >
                      {THICKNESS_PRESETS.filter((preset) => preset.usage === "back").map((preset) => (
                        <option key={preset.label} value={preset.valueMm}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field-group">
                    <label htmlFor="shelf-thickness">Shelf Thickness</label>
                    <select
                      id="shelf-thickness"
                      value={buildRules.shelfThicknessMm}
                      onChange={(event) =>
                        onConfigChange({
                          buildRules: {
                            ...buildRules,
                            shelfThicknessMm: Number(event.currentTarget.value),
                          },
                        })}
                    >
                      {THICKNESS_PRESETS.filter((preset) => preset.usage === "shelf").map((preset) => (
                        <option key={preset.label} value={preset.valueMm}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field-group">
                    <label htmlFor="drawer-thickness">Drawer Box Thickness</label>
                    <select
                      id="drawer-thickness"
                      value={buildRules.drawerBoxThicknessMm}
                      onChange={(event) =>
                        onConfigChange({
                          buildRules: {
                            ...buildRules,
                            drawerBoxThicknessMm: Number(event.currentTarget.value),
                          },
                        })}
                    >
                      {THICKNESS_PRESETS.filter((preset) => preset.usage === "drawer").map((preset) => (
                        <option key={preset.label} value={preset.valueMm}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ) : null}

            {constructionParts.length > 0 ? (
              <div className="control-section">
                <div className="section-heading">
                  <h2>Parts</h2>
                  <span>{constructionParts.length} lines</span>
                </div>
                <div className="parts-list">
                  {constructionParts.map((part) => (
                    <div key={part.id} className="parts-list-item">
                      <strong>{part.label}</strong>
                      <span>
                        {part.quantity}x · {part.lengthMm} × {part.widthMm} × {part.thicknessMm} mm
                      </span>
                      <span>
                        {part.materialLabel} · {part.finishLabel} · {part.edgeBandingLabel}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
