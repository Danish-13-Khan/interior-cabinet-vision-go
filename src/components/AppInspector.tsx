import type { CSSProperties } from "react";
import {
  DimensionControls,
} from "./DimensionControls";
import { RoomSettings } from "./RoomSettings";
import { WallEditor } from "./WallEditor";
import { DoorWindowEditor } from "./DoorWindowEditor";
import { JobWorkflowPanel } from "./JobWorkflowPanel";
import { DraftingPanel } from "./DraftingPanel";
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
  onSelectAll: () => void;
  onUndo: () => void;
  onRedo: () => void;
  style?: CSSProperties;
};

export function AppInspector({
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
  cabinetCutlistItems,
  selectedConfig,
  constructionParts,
  derivedMetrics,
  cutlistItems,
  projectFilePath,
  projectStatus,
  savedProjects,
  snapSizeMm,
  activeCabinetId,
  selectedPanelName,
  selectedPlacement,
  selectedLayerId,
  selectedGroupId,
  layers,
  groups,
  preferences,
  validationMessages,
  manufacturingIssues,
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
  style,
}: AppInspectorProps) {
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
      <div className="inspector-scroll">
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
        <DimensionControls
          cabinetCount={project.cabinets.length}
          cabinetCutlistItems={cabinetCutlistItems}
          cabinets={project.cabinets}
          config={selectedConfig}
          constructionParts={constructionParts}
          derivedMetrics={derivedMetrics}
          cutlistItems={cutlistItems}
          projectFilePath={projectFilePath}
          projectStatus={projectStatus}
          savedProjects={savedProjects}
          snapSizeMm={snapSizeMm}
          selectedCabinetIds={selectedCabinetIds}
          activeCabinetId={activeCabinetId}
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
          validationMessages={validationMessages}
          manufacturingIssues={manufacturingIssues}
          onAttachmentChange={onAttachmentChange}
          onAlignSelection={onAlignSelection}
          onAssignLayer={onAssignLayer}
          onConfigChange={onConfigChange}
          onCopySelection={onCopySelection}
          onCreateGroup={onCreateGroup}
          onCreateLayer={onCreateLayer}
          onClearGroup={onClearGroup}
          onDeleteSavedProject={onDeleteSavedProject}
          onDuplicateCabinet={onDuplicateCabinet}
          onDuplicateSavedProject={onDuplicateSavedProject}
          onExportCutlistCsv={onExportCutlistCsv}
          onExportProjectJson={onExportProjectJson}
          onExportPdf={onExportPdf}
          onLayerChange={onLayerChange}
          onLoadProject={onLoadProject}
          onLoadSavedProject={onLoadSavedProject}
          onPasteSelection={onPasteSelection}
          onPlacementChange={onPlacementChange}
          onPreferenceChange={onPreferenceChange}
          onSaveCabinetTemplate={onSaveCabinetTemplate}
          onRemoveCabinet={onRemoveCabinet}
          onRenameCabinet={onRenameCabinet}
          onRenameSavedProject={onRenameSavedProject}
          onReset={onReset}
          onRotationChange={onRotationChange}
          onSaveProject={onSaveProject}
          onSaveToProjectBrowser={onSaveToProjectBrowser}
          onSelectCabinet={onSelectCabinet}
          onSelectAll={onSelectAll}
          onUndo={onUndo}
          onRedo={onRedo}
        />
      </div>
    </aside>
  );
}
