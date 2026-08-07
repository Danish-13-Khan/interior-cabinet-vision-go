import type { CabinetTemplate } from "../domain/cabinetTemplates";
import type { CabinetFamilyLibraryEntry } from "../domain/workshopLibrary";
import type { CabinetType } from "../domain/cabinetDimensions";
import type { CabinetInstance } from "../domain/cabinetDimensions";
import type { ProjectRoom, RoomTemplateId } from "../domain/projectRooms";
import type { RoomPresetId } from "../domain/roomPresets";
import { LibraryRail } from "./LibraryRail";
import { SceneTreePanel } from "./SceneTreePanel";
import { RoomNavigator } from "./RoomNavigator";
import { RoomPresetRail } from "./RoomPresetRail";
import { ProjectBrowser } from "./ProjectBrowser";

import type { ProjectJobMeta } from "../domain/jobMeta";

type SavedProjectCard = {
  id: string;
  name: string;
  updatedAt: string;
  thumbnail: string;
  job?: ProjectJobMeta;
  cabinetCount?: number;
};

type AppToolRailProps = {
  templates: CabinetTemplate[];
  userCabinetPresets: CabinetFamilyLibraryEntry[];
  cabinets: CabinetInstance[];
  activeCabinetId: string | null;
  selectedCabinetIds: string[];
  rooms: ProjectRoom[];
  activeRoomId: string | null;
  savedProjects: SavedProjectCard[];
  onAddFamily: (type: CabinetType) => void;
  onAddLibraryItem: (itemId: string) => void;
  onAddTemplate: (templateId: string) => void;
  onDeleteTemplate: (templateId: string) => void;
  onApplyStarter: (starterId: string) => void;
  onOpenLibraryManager: () => void;
  onSelectCabinet: (cabinetId: string, additive: boolean) => void;
  onSelectRoom: (roomId: string) => void;
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
};

export function AppToolRail({
  templates,
  userCabinetPresets,
  cabinets,
  activeCabinetId,
  selectedCabinetIds,
  rooms,
  activeRoomId,
  savedProjects,
  onAddFamily,
  onAddLibraryItem,
  onAddTemplate,
  onDeleteTemplate,
  onApplyStarter,
  onOpenLibraryManager,
  onSelectCabinet,
  onSelectRoom,
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
}: AppToolRailProps) {
  return (
    <aside className="tool-rail" aria-label="Tool rail">
      <LibraryRail
        templates={templates}
        userCabinetPresets={userCabinetPresets}
        onAddFamily={onAddFamily}
        onAddLibraryItem={onAddLibraryItem}
        onAddTemplate={onAddTemplate}
        onDeleteTemplate={onDeleteTemplate}
        onApplyStarter={onApplyStarter}
        onOpenLibraryManager={onOpenLibraryManager}
      />

      <SceneTreePanel
        cabinets={cabinets}
        activeCabinetId={activeCabinetId}
        selectedCabinetIds={selectedCabinetIds}
        onSelectCabinet={onSelectCabinet}
      />

      <RoomNavigator
        rooms={rooms}
        activeRoomId={activeRoomId}
        onSelectRoom={onSelectRoom}
        onAddRoom={onAddRoom}
        onDuplicateRoom={onDuplicateRoom}
        onRenameRoom={onRenameRoom}
        onRemoveRoom={onRemoveRoom}
        onAddFromTemplate={onAddFromTemplate}
      />

      <RoomPresetRail onLoadPreset={onLoadRoomPreset} />

      <div className="rail-section">
        <ProjectBrowser
          projects={savedProjects}
          onDeleteProject={onDeleteSavedProject}
          onDuplicateProject={onDuplicateSavedProject}
          onLoadProject={onLoadSavedProject}
          onRenameProject={onRenameSavedProject}
          onSaveCurrent={onSaveCurrentProject}
        />
      </div>
    </aside>
  );
}
