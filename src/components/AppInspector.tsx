import { useState, type CSSProperties } from "react";
import { DimensionControls } from "./DimensionControls";
import { RoomSettings } from "./RoomSettings";
import { WallEditor } from "./WallEditor";
import { DoorWindowEditor } from "./DoorWindowEditor";
import { JobWorkflowPanel } from "./JobWorkflowPanel";
import { DraftingPanel } from "./DraftingPanel";
import { SceneItemsSection } from "./dimensionControls/SceneItemsSection";
import { WorkflowSection } from "./dimensionControls/WorkflowSection";
import { PreferencesSection } from "./dimensionControls/PreferencesSection";
import { ProjectStandardsSection } from "./dimensionControls/ProjectStandardsSection";
import { getPanelDisplayName, type PanelName } from "../domain/cabinetGeometry";
import {
  type CabinetConfig,
  type CabinetGroup,
  type CabinetInstance,
  type CabinetLayer,
  type CabinetPlacement,
  type CabinetProject,
  type ProjectPreferences,
} from "../domain/cabinetDimensions";
import type { CabinetPart } from "../domain/cabinetConstruction";
import type { CabinetDerivedMetrics } from "../domain/cabinetGeometry";
import type { ProductionCutlistLine } from "../domain/productionCutlist";
import type { ManufacturingIssue } from "../domain/manufacturingRules";
import type { ProjectJobMeta } from "../domain/jobMeta";
import type { RoomConfig } from "../domain/roomModel";
import {
  clampDraftingDisplay,
  type DraftingDisplayPreferences,
  type ProjectDrafting,
} from "../domain/draftingAnnotations";
import type { AlignmentMode } from "../domain/cabinetAlignment";

type SavedProjectSummary = {
  id: string;
  name: string;
  thumbnail: string;
  updatedAt: string;
};

type InspectorTab = "cabinet" | "room" | "project";

type AppInspectorProps = {
  selectedCabinet: CabinetInstance | null;
  selectedCabinetIds: string[];
  job: ProjectJobMeta;
  onJobChange: (patch: Partial<ProjectJobMeta>) => void;
  projectDrafting: ProjectDrafting;
  draftingDisplay: DraftingDisplayPreferences;
  onDraftingDisplayChange: (display: DraftingDisplayPreferences) => void;
  onDraftingChange: (drafting: ProjectDrafting) => void;
  room: RoomConfig;
  onRoomConfigChange: (room: RoomConfig) => void;
  project: CabinetProject;
  cabinetCutlistItems: ProductionCutlistLine[];
  selectedConfig: CabinetConfig;
  constructionParts: CabinetPart[];
  derivedMetrics: CabinetDerivedMetrics;
  cutlistItems: ProductionCutlistLine[];
  projectFilePath: string | null;
  projectStatus: string;
  savedProjects: SavedProjectSummary[];
  snapSizeMm: number;
  activeCabinetId: string | null;
  activeOpeningId?: string | null;
  selectedPanelName: PanelName | null;
  selectedPlacement: CabinetPlacement;
  selectedLayerId: string;
  selectedGroupId: string | null;
  layers: CabinetLayer[];
  groups: CabinetGroup[];
  preferences: ProjectPreferences;
  validationMessages: string[];
  manufacturingIssues: ManufacturingIssue[];
  onAttachmentChange: (attachment: CabinetPlacement["attachment"]) => void;
  onAlignSelection: (mode: AlignmentMode) => void;
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
  onSaveCabinetTemplate: (name?: string) => void;
  onRemoveCabinet: () => void;
  onRenameCabinet: (cabinetId: string, name: string) => void;
  onRenameSavedProject: (projectId: string, name: string) => void;
  onReset: () => void;
  onRotationChange: (rotation: number) => void;
  onSaveProject: () => Promise<void>;
  onSaveToProjectBrowser: () => void;
  onSelectCabinet: (cabinetId: string, additive?: boolean) => void;
  onSelectOpening?: (cabinetId: string, openingId: string) => void;
  onSelectAll: () => void;
  onUndo: () => void;
  onRedo: () => void;
  style?: CSSProperties;
};

export function AppInspector(props: AppInspectorProps) {
  const {
    selectedCabinet,
    selectedCabinetIds,
    job,
    onJobChange,
    projectDrafting,
    draftingDisplay,
    onDraftingDisplayChange,
    onDraftingChange,
    room,
    onRoomConfigChange,
    project,
    selectedConfig,
    constructionParts,
    snapSizeMm,
    activeCabinetId,
    activeOpeningId,
    selectedPanelName,
    selectedPlacement,
    selectedLayerId,
    selectedGroupId,
    layers,
    groups,
    preferences,
    manufacturingIssues,
    onAttachmentChange,
    onAlignSelection,
    onAssignLayer,
    onConfigChange,
    onCopySelection,
    onCreateGroup,
    onCreateLayer,
    onClearGroup,
    onDuplicateCabinet,
    onLayerChange,
    onPasteSelection,
    onPlacementChange,
    onPreferenceChange,
    onSaveCabinetTemplate,
    onRemoveCabinet,
    onRenameCabinet,
    onRotationChange,
    onSelectCabinet,
    onSelectOpening,
    onSelectAll,
    onUndo,
    onRedo,
    style,
  } = props;

  const [tab, setTab] = useState<InspectorTab>("cabinet");

  return (
    <aside className="inspector-panel" aria-label="Properties inspector" style={style}>
      <div className="inspector-header">
        <strong>Properties</strong>
        <span>
          {selectedCabinet
            ? selectedCabinet.name
            : selectedCabinetIds.length > 1
              ? `${selectedCabinetIds.length} items`
              : "No selection"}
        </span>
      </div>

      <div className="inspector-scope-nav" role="tablist" aria-label="Inspector scope">
        {(
          [
            ["cabinet", "Cabinet"],
            ["room", "Room"],
            ["project", "Project"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`inspector-scope-tab ${tab === id ? "is-active" : ""}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="inspector-scroll">
        {tab === "cabinet" ? (
          <DimensionControls
            cabinetCount={project.cabinets.length}
            cabinetCutlistItems={props.cabinetCutlistItems}
            cabinets={project.cabinets}
            config={selectedConfig}
            constructionParts={constructionParts}
            derivedMetrics={props.derivedMetrics}
            cutlistItems={props.cutlistItems}
            projectFilePath={props.projectFilePath}
            projectStatus={props.projectStatus}
            savedProjects={props.savedProjects}
            snapSizeMm={snapSizeMm}
            selectedCabinetIds={selectedCabinetIds}
            activeCabinetId={activeCabinetId}
            activeOpeningId={activeOpeningId}
            selectedPanelName={selectedPanelName}
            selectedPlacement={selectedPlacement}
            selectedLayerId={selectedLayerId}
            selectedGroupId={selectedGroupId}
            layers={layers}
            groups={groups}
            preferences={preferences}
            selectionLabel={
              selectedPanelName ? getPanelDisplayName(selectedPanelName) : "None"
            }
            validationMessages={props.validationMessages}
            manufacturingIssues={manufacturingIssues}
            onAttachmentChange={onAttachmentChange}
            onAlignSelection={onAlignSelection}
            onAssignLayer={onAssignLayer}
            onConfigChange={onConfigChange}
            onCopySelection={onCopySelection}
            onCreateGroup={onCreateGroup}
            onCreateLayer={onCreateLayer}
            onClearGroup={onClearGroup}
            onDeleteSavedProject={props.onDeleteSavedProject}
            onDuplicateCabinet={onDuplicateCabinet}
            onDuplicateSavedProject={props.onDuplicateSavedProject}
            onExportCutlistCsv={props.onExportCutlistCsv}
            onExportProjectJson={props.onExportProjectJson}
            onExportPdf={props.onExportPdf}
            onLayerChange={onLayerChange}
            onLoadProject={props.onLoadProject}
            onLoadSavedProject={props.onLoadSavedProject}
            onPasteSelection={onPasteSelection}
            onPlacementChange={onPlacementChange}
            onPreferenceChange={onPreferenceChange}
            onSaveCabinetTemplate={onSaveCabinetTemplate}
            onRemoveCabinet={onRemoveCabinet}
            onRenameCabinet={onRenameCabinet}
            onRenameSavedProject={props.onRenameSavedProject}
            onReset={props.onReset}
            onRotationChange={onRotationChange}
            onSaveProject={props.onSaveProject}
            onSaveToProjectBrowser={props.onSaveToProjectBrowser}
            onSelectCabinet={onSelectCabinet}
            onSelectOpening={onSelectOpening}
            onSelectAll={onSelectAll}
            onUndo={onUndo}
            onRedo={onRedo}
          />
        ) : null}

        {tab === "room" ? (
          <>
            <RoomSettings
              dimensions={room.dimensions}
              onChange={(dims) => onRoomConfigChange({ ...room, dimensions: dims })}
            />
            <WallEditor
              showBackWall={room.dimensions.showBackWall}
              showLeftWall={room.dimensions.showLeftWall}
              showRightWall={room.dimensions.showRightWall}
              onChange={(walls) =>
                onRoomConfigChange({
                  ...room,
                  dimensions: { ...room.dimensions, ...walls },
                })
              }
            />
            <DoorWindowEditor
              doors={room.doors}
              windows={room.windows}
              onChangeDoors={(doors) => onRoomConfigChange({ ...room, doors })}
              onChangeWindows={(windows) =>
                onRoomConfigChange({ ...room, windows })
              }
            />
          </>
        ) : null}

        {tab === "project" ? (
          <>
            <JobWorkflowPanel job={job} onChange={onJobChange} />
            <DraftingPanel
              drafting={projectDrafting}
              display={draftingDisplay}
              onDisplayChange={(patch) =>
                onDraftingDisplayChange(
                  clampDraftingDisplay({ ...draftingDisplay, ...patch }),
                )
              }
              onDeleteNote={(id) =>
                onDraftingChange({
                  ...projectDrafting,
                  notes: projectDrafting.notes.filter((note) => note.id !== id),
                })
              }
              onDeleteLeader={(id) =>
                onDraftingChange({
                  ...projectDrafting,
                  leaders: projectDrafting.leaders.filter((leader) => leader.id !== id),
                })
              }
            />
            <SceneItemsSection
              cabinetCount={project.cabinets.length}
              cabinets={project.cabinets}
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
          </>
        ) : null}
      </div>
    </aside>
  );
}
