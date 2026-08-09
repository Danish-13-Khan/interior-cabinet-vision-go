import type { CabinetRun } from "../domain/cabinetLibrary";
import type { ProjectRoom } from "../domain/projectRooms";
import { CabinetTreeBrowser } from "./sceneTree/CabinetTreeBrowser";

type WorkspaceSceneBrowserProps = {
  rooms: ProjectRoom[];
  activeRoomId: string | null;
  runs: CabinetRun[];
  activeCabinetId: string | null;
  selectedCabinetIds: string[];
  activeOpeningId: string | null;
  isolatedCabinetIds: string[] | null;
  onSelectRoom: (roomId: string) => void;
  onSelectCabinet: (cabinetId: string, additive: boolean) => void;
  onSelectRun: (run: CabinetRun) => void;
  onSelectOpening: (cabinetId: string, openingId: string) => void;
  onSelectCabinets: (
    roomId: string,
    cabinetIds: string[],
    activeId: string | null,
    additive: boolean,
  ) => void;
  onRenameCabinet: (cabinetId: string, name: string) => void;
  onRenameRoom: (roomId: string, name: string) => void;
  onIsolate: (cabinetIds: string[]) => void;
  onFocus: (cabinetIds: string[], activeId: string | null) => void;
  onReorderCabinet: (runId: string, cabinetId: string, direction: -1 | 1) => void;
};

export function WorkspaceSceneBrowser({
  rooms,
  activeRoomId,
  runs,
  activeCabinetId,
  selectedCabinetIds,
  activeOpeningId,
  isolatedCabinetIds,
  onSelectRoom,
  onSelectCabinet,
  onSelectRun,
  onSelectOpening,
  onSelectCabinets,
  onRenameCabinet,
  onRenameRoom,
  onIsolate,
  onFocus,
  onReorderCabinet,
}: WorkspaceSceneBrowserProps) {
  return (
    <aside className="workspace-scene-browser" aria-label="Cabinet tree">
      <div className="workspace-scene-browser-header">Cabinet tree</div>
      <CabinetTreeBrowser
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
        onRenameRoom={onRenameRoom}
        onIsolate={onIsolate}
        onFocus={onFocus}
        onReorderCabinet={onReorderCabinet}
      />
    </aside>
  );
}
