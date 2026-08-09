import type { Ref } from "react";
import {
  CabinetScene,
  type CabinetSceneHandle,
} from "./CabinetScene";
import { WorkspaceViewPane } from "./WorkspaceViewPane";
import { WorkspacePaneNavTools } from "./WorkspacePaneNavTools";
import { SceneCameraButtons } from "./WorkspacePaneTools";
import type { CabinetProject } from "../domain/cabinetDimensions";
import type { CabinetDimensions, CabinetPlacement } from "../domain/cabinetDimensions";
import type { PanelName } from "../domain/cabinetGeometry";
import type { RoomConfig } from "../domain/roomModel";
import type { CountertopSegment, RunFiller } from "../domain/cabinetLibrary";
import { DEFAULT_PANE_VIEW } from "../domain/desktopUx/paneViewNav";
import type { ViewPreset } from "./cabinetScene/types";

type WorkspaceScenePaneProps = {
  sceneRef: Ref<CabinetSceneHandle>;
  focused: boolean;
  maximized: boolean;
  project: CabinetProject;
  room: RoomConfig;
  countertops: CountertopSegment[];
  fillers: RunFiller[];
  snapSizeMm: number;
  showGrid: boolean;
  selectedCabinetIds: string[];
  activeCabinetId: string | null;
  selectedPanelName: PanelName | null;
  onFocus: () => void;
  onToggleMaximize: () => void;
  onCabinetMove: (cabinetId: string, placement: CabinetPlacement) => boolean;
  onCabinetRotate: (cabinetId: string, rotation: number) => boolean;
  onCabinetResize: (cabinetId: string, dimensions: CabinetDimensions) => void;
  onReplaceSelection: (
    ids: string[],
    activeId?: string | null,
    panelName?: PanelName | null,
  ) => void;
  onToggleCabinetSelection: (cabinetId: string) => void;
};

export function WorkspaceScenePane({
  sceneRef,
  focused,
  maximized,
  project,
  room,
  countertops,
  fillers,
  snapSizeMm,
  showGrid,
  selectedCabinetIds,
  activeCabinetId,
  selectedPanelName,
  onFocus,
  onToggleMaximize,
  onCabinetMove,
  onCabinetRotate,
  onCabinetResize,
  onReplaceSelection,
  onToggleCabinetSelection,
}: WorkspaceScenePaneProps) {
  function sceneHandle() {
    return sceneRef && typeof sceneRef === "object" ? sceneRef.current : null;
  }

  function setCameraPreset(preset: ViewPreset) {
    sceneHandle()?.setViewPreset(preset);
  }

  function fitScene() {
    sceneHandle()?.fitView();
  }

  return (
    <WorkspaceViewPane
      paneId="3d"
      title="3D"
      subtitle="Support"
      focused={focused}
      maximized={maximized}
      onFocus={onFocus}
      onToggleMaximize={onToggleMaximize}
      toolbar={
        <>
          <WorkspacePaneNavTools
            transform={DEFAULT_PANE_VIEW}
            sheetScaleText="Perspective"
            displayMode="working"
            panActive={false}
            showDisplayMode={false}
            showZoomPan={false}
            onFit={fitScene}
            onZoomIn={() => undefined}
            onZoomOut={() => undefined}
            onTogglePan={() => undefined}
            onDisplayModeChange={() => undefined}
          />
          <SceneCameraButtons onSetViewPreset={setCameraPreset} />
        </>
      }
      status={
        <span className="workspace-pane-status-line">
          <strong>3D</strong>
          <span>Support view · orbit / pan / zoom</span>
          <span className="workspace-pane-status-ready">
            {project.cabinets.length} cab
          </span>
        </span>
      }
    >
      <div
        className="viewport-panel viewport-panel-embedded"
        aria-label="3D room viewport"
      >
        <div className="drawing-viewport-hud scene-pane-hud" aria-hidden>
          <span>3D</span>
          <span>Support</span>
        </div>
        <CabinetScene
          ref={sceneRef}
          project={project}
          room={room}
          countertops={countertops}
          fillers={fillers}
          snapSizeMm={snapSizeMm}
          showGrid={showGrid}
          onCabinetMove={onCabinetMove}
          onCabinetRotate={onCabinetRotate}
          selectedCabinetIds={selectedCabinetIds}
          activeCabinetId={activeCabinetId}
          selectedPanelName={selectedPanelName}
          onCabinetResize={onCabinetResize}
          onSelectedCabinetChange={(cabinetId, additive) => {
            if (!cabinetId) {
              onReplaceSelection([], null, null);
              return;
            }
            if (additive) {
              onToggleCabinetSelection(cabinetId);
              return;
            }
            onReplaceSelection([cabinetId], cabinetId, null);
          }}
          onSelectedPanelChange={(cabinetId, name, additive) => {
            if (!cabinetId) {
              onReplaceSelection([], null, null);
              return;
            }
            if (additive) {
              const nextIds = selectedCabinetIds.includes(cabinetId)
                ? selectedCabinetIds
                : [...selectedCabinetIds, cabinetId];
              onReplaceSelection(nextIds, cabinetId, name);
              return;
            }
            onReplaceSelection([cabinetId], cabinetId, name);
          }}
          onMarqueeSelect={(cabinetIds, additive) => {
            if (additive) {
              onReplaceSelection(
                Array.from(new Set([...selectedCabinetIds, ...cabinetIds])),
                cabinetIds[0] ?? activeCabinetId,
                null,
              );
              return;
            }
            onReplaceSelection(cabinetIds, cabinetIds[0] ?? null, null);
          }}
        />
      </div>
    </WorkspaceViewPane>
  );
}
