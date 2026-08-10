import type { CSSProperties } from "react";
import type { CabinetTemplate } from "../domain/cabinetTemplates";
import type { CabinetFamilyLibraryEntry } from "../domain/workshopLibrary";
import type { CabinetType } from "../domain/cabinetDimensions";
import type { CabinetRun } from "../domain/cabinetLibrary";
import type { ProjectRoom, RoomTemplateId } from "../domain/projectRooms";
import type { RoomPresetId } from "../domain/roomPresets";
import { LibraryRail } from "./LibraryRail";
import { SceneTreePanel } from "./SceneTreePanel";
import { RoomNavigator } from "./RoomNavigator";
import { RoomPresetRail } from "./RoomPresetRail";
import { ProjectBrowser } from "./ProjectBrowser";

import type { ProjectJobMeta } from "../domain/jobMeta";
import type { WorkbenchMode } from "../domain/desktopUx";
import type { WallLayoutSide, WallLayoutSummary } from "../domain/wallLayout";
import { WallLayoutPanel } from "./WallLayoutPanel";

type SavedProjectCard = {
  id: string;
  name: string;
  updatedAt: string;
  thumbnail: string;
  job?: ProjectJobMeta;
  cabinetCount?: number;
};

type AppToolRailProps = {
  workbenchMode: WorkbenchMode;
  activeWall: WallLayoutSide;
  wallLayout: WallLayoutSummary;
  onActiveWallChange: (side: WallLayoutSide) => void;
  onSelectWallCabinets: () => void;
  onAutoPackWallRuns: () => void;
  onFinishWallRunEnds: () => void;
  templates: CabinetTemplate[];
  userCabinetPresets: CabinetFamilyLibraryEntry[];
  rooms: ProjectRoom[];
  activeRoomId: string | null;
  runs: CabinetRun[];
  activeCabinetId: string | null;
  selectedCabinetIds: string[];
  activeOpeningId: string | null;
  isolatedCabinetIds: string[] | null;
  savedProjects: SavedProjectCard[];
  onAddFamily: (type: CabinetType) => void;
  onAddLibraryItem: (itemId: string) => void;
  onAddTemplate: (templateId: string) => void;
  onDeleteTemplate: (templateId: string) => void;
  onApplyStarter: (starterId: string) => void;
  onOpenLibraryManager: () => void;
  onSelectCabinet: (cabinetId: string, additive: boolean) => void;
  onSelectRoom: (roomId: string) => void;
  onSelectRun: (run: CabinetRun) => void;
  onSelectOpening: (cabinetId: string, openingId: string) => void;
  onSelectCabinets: (
    roomId: string,
    cabinetIds: string[],
    activeId: string | null,
    additive: boolean,
  ) => void;
  onRenameCabinet: (cabinetId: string, name: string) => void;
  onRenameRoomTo: (roomId: string, name: string) => void;
  onIsolate: (cabinetIds: string[]) => void;
  onFocus: (cabinetIds: string[], activeId: string | null) => void;
  onReorderCabinet: (runId: string, cabinetId: string, direction: -1 | 1) => void;
  onAddRoom: () => void;
  onDuplicateRoom: (roomId: string) => void;
  onRenameRoom: (roomId: string) => void;
  onRemoveRoom: (roomId: string) => void;
  onAddFromTemplate: (templateId: RoomTemplateId) => void;
  onLoadRoomPreset: (presetId: RoomPresetId) => void;
  onDeleteSavedProject: (projectId: string) => void;
  onDuplicateSavedProject: (projectId: string) => void;
  onLoadSavedProject: (projectId: string) => void;
  onRenameSavedProject: (projectId: string, name: string) => void;
  onSaveCurrentProject: () => void;
  onProjectContextMenu?: (
    projectId: string,
    point: { x: number; y: number },
  ) => void;
  style?: CSSProperties;
};

export function AppToolRail({
  workbenchMode,
  activeWall,
  wallLayout,
  onActiveWallChange,
  onSelectWallCabinets,
  onAutoPackWallRuns,
  onFinishWallRunEnds,
  templates,
  userCabinetPresets,
  rooms,
  activeRoomId,
  runs,
  activeCabinetId,
  selectedCabinetIds,
  activeOpeningId,
  isolatedCabinetIds,
  savedProjects,
  onAddFamily,
  onAddLibraryItem,
  onAddTemplate,
  onDeleteTemplate,
  onApplyStarter,
  onOpenLibraryManager,
  onSelectCabinet,
  onSelectRoom,
  onSelectRun,
  onSelectOpening,
  onSelectCabinets,
  onRenameCabinet,
  onRenameRoomTo,
  onIsolate,
  onFocus,
  onReorderCabinet,
  onAddRoom,
  onDuplicateRoom,
  onRenameRoom,
  onRemoveRoom,
  onAddFromTemplate,
  onLoadRoomPreset,
  onDeleteSavedProject,
  onDuplicateSavedProject,
  onLoadSavedProject,
  onRenameSavedProject,
  onSaveCurrentProject,
  onProjectContextMenu,
  style,
}: AppToolRailProps) {
  return (
    <aside className="tool-rail" aria-label="Tool rail" style={style}>
      <div className="context-panel-heading">
        <strong>{workbenchMode === "job" ? "Job Browser" : workbenchMode === "room" ? "Room Tools" : workbenchMode === "drawings" ? "Drawing Objects" : "Cabinet Catalog"}</strong>
        <span>Context tools</span>
      </div>

      {workbenchMode === "cabinets" ? <WallLayoutPanel
        activeWall={activeWall}
        summary={wallLayout}
        onWallChange={onActiveWallChange}
        onSelectWallCabinets={onSelectWallCabinets}
        onAutoPack={onAutoPackWallRuns}
        onFinishEnds={onFinishWallRunEnds}
      /> : null}

      {workbenchMode === "cabinets" ? <LibraryRail
        templates={templates}
        userCabinetPresets={userCabinetPresets}
        onAddFamily={onAddFamily}
        onAddLibraryItem={onAddLibraryItem}
        onAddTemplate={onAddTemplate}
        onDeleteTemplate={onDeleteTemplate}
        onApplyStarter={onApplyStarter}
        onOpenLibraryManager={onOpenLibraryManager}
      /> : null}

      {workbenchMode === "room" || workbenchMode === "cabinets" || workbenchMode === "drawings" ? <SceneTreePanel
        rooms={rooms}
        activeRoomId={activeRoomId}
        runs={runs}
        activeCabinetId={activeCabinetId}
        selectedCabinetIds={selectedCabinetIds}
        activeOpeningId={activeOpeningId}
        isolatedCabinetIds={isolatedCabinetIds}
        onSelectRoom={onSelectRoom}
        onSelectCabinet={onSelectCabinet}
        onSelectRun={onSelectRun}
        onSelectOpening={onSelectOpening}
        onSelectCabinets={onSelectCabinets}
        onRenameCabinet={onRenameCabinet}
        onRenameRoom={onRenameRoomTo}
        onIsolate={onIsolate}
        onFocus={onFocus}
        onReorderCabinet={onReorderCabinet}
      /> : null}

      {workbenchMode === "job" || workbenchMode === "room" ? <RoomNavigator
        rooms={rooms}
        activeRoomId={activeRoomId}
        onSelectRoom={onSelectRoom}
        onAddRoom={onAddRoom}
        onDuplicateRoom={onDuplicateRoom}
        onRenameRoom={onRenameRoom}
        onRemoveRoom={onRemoveRoom}
        onAddFromTemplate={onAddFromTemplate}
      /> : null}

      {workbenchMode === "room" ? <RoomPresetRail onLoadPreset={onLoadRoomPreset} /> : null}

      {workbenchMode === "job" ? <div className="rail-section">
        <ProjectBrowser
          projects={savedProjects}
          onDeleteProject={onDeleteSavedProject}
          onDuplicateProject={onDuplicateSavedProject}
          onLoadProject={onLoadSavedProject}
          onRenameProject={onRenameSavedProject}
          onSaveCurrent={onSaveCurrentProject}
          onProjectContextMenu={onProjectContextMenu}
        />
      </div> : null}
    </aside>
  );
}
