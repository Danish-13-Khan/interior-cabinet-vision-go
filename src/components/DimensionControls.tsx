import { CutlistPanel } from "./CutlistPanel"; void CutlistPanel;
import { ProjectBrowser } from "./ProjectBrowser"; void ProjectBrowser;
import { CabinetPropertyGrid } from "./CabinetPropertyGrid";
import {
  normalizeRotationAngle,
  supportsWallPlacement,
} from "../domain/cabinetDimensions";
import { ManufacturingRulesSection } from "./dimensionControls/ManufacturingRulesSection";
import { SceneItemsSection } from "./dimensionControls/SceneItemsSection";
import { WorkflowSection } from "./dimensionControls/WorkflowSection";
import { PreferencesSection } from "./dimensionControls/PreferencesSection";
import { ProjectStandardsSection } from "./dimensionControls/ProjectStandardsSection";
import { TemplatesSection } from "./dimensionControls/TemplatesSection";
import { PlacementSection } from "./dimensionControls/PlacementSection";
import { MaterialBuildSection } from "./dimensionControls/MaterialBuildSection";
import { PartsSection } from "./dimensionControls/PartsSection";
import { useNumericInputs } from "./dimensionControls/useNumericInputs";
import type { DimensionControlsProps } from "./dimensionControls/types";

export type { DimensionControlsProps } from "./dimensionControls/types";

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
  manufacturingIssues,
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
  onSaveCabinetTemplate,
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
  void savedProjects;
  void derivedMetrics;
  void selectedPanelName;
  void selectionLabel;
  void projectFilePath;
  void projectStatus;
  void onDeleteSavedProject;
  void onDuplicateSavedProject;
  void onLoadSavedProject;
  void onRenameSavedProject;
  void onSaveToProjectBrowser;
  void onExportCutlistCsv;
  void onExportProjectJson;
  void onExportPdf;
  void onLoadProject;
  void onSaveProject;
  void onReset;
  void cabinetCutlistItems;
  void cutlistItems;
  void validationMessages;

  const { inputs, handleNumericInputChange, handleBlur } = useNumericInputs(
    config,
    selectedPlacement,
    onConfigChange,
    onPlacementChange,
  );

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
        <ManufacturingRulesSection manufacturingIssues={manufacturingIssues} />

        <SceneItemsSection
          cabinetCount={cabinetCount}
          cabinets={cabinets}
          selectedCabinetIds={selectedCabinetIds}
          onSelectCabinet={onSelectCabinet}
          onRenameCabinet={onRenameCabinet}
          onUndo={onUndo}
          onRedo={onRedo}
          onCopySelection={onCopySelection}
          onPasteSelection={onPasteSelection}
          onSelectAll={onSelectAll}
          onDuplicateCabinet={onDuplicateCabinet}
          onRemoveCabinet={onRemoveCabinet}
        />

        <WorkflowSection
          selectedCabinetIds={selectedCabinetIds}
          selectedLayerId={selectedLayerId}
          selectedGroupId={selectedGroupId}
          layers={layers}
          groups={groups}
          onAssignLayer={onAssignLayer}
          onCreateLayer={onCreateLayer}
          onCreateGroup={onCreateGroup}
          onClearGroup={onClearGroup}
          onAlignSelection={onAlignSelection}
        />

        <PreferencesSection
          preferences={preferences}
          layers={layers}
          onPreferenceChange={onPreferenceChange}
          onLayerChange={onLayerChange}
        />

        <ProjectStandardsSection
          preferences={preferences}
          onPreferenceChange={onPreferenceChange}
        />

        {activeCabinetId ? (
          <>
            <TemplatesSection onSaveCabinetTemplate={onSaveCabinetTemplate} />

            <CabinetPropertyGrid config={config} onConfigChange={onConfigChange} />

            <PlacementSection
              showWallTools={showWallTools}
              attachment={attachment}
              rotation={rotation}
              snapSizeMm={snapSizeMm}
              inputs={inputs}
              onRotationChange={onRotationChange}
              onAttachmentChange={onAttachmentChange}
              handleNumericInputChange={handleNumericInputChange}
              handleBlur={handleBlur}
            />

            {buildRules ? (
              <MaterialBuildSection buildRules={buildRules} onConfigChange={onConfigChange} />
            ) : null}

            <PartsSection constructionParts={constructionParts} />
          </>
        ) : null}
      </div>
    </div>
  );
}
