import { ContextMenu } from "../ContextMenu";
import type { InteriorProject } from "../../domain/interiorProject";
import { setLivingRoomWallMaterial, setWallVisible, showAllWalls } from "../../domain/livingRoom";
import { ModelWallVisibilityPanel } from "./ModelWallVisibilityPanel";
import { wallContextMenuItems } from "./wallContextMenuItems";

export type WallContextMenuState = {
  wallId: string;
  x: number;
  y: number;
};

type ModelWallVisibilityHostProps = {
  project: InteriorProject;
  activeWallId: string | null;
  wallMenu: WallContextMenuState | null;
  onCloseWallMenu: () => void;
  onPatchDocument: (
    update: (current: InteriorProject) => InteriorProject,
    status: string,
  ) => void;
  onSelectWall: (wallId: string) => void;
  onClearSelection: () => void;
  /** When true, Hide Wall renders in the left chrome stack (not absolute overlay). */
  stackedHideBar?: boolean;
};

export function ModelWallHideBar(props: {
  wallId: string;
  onHide: () => void;
}) {
  return (
    <div className="lr-wall-visibility-selected" data-testid="model-wall-hide-bar">
      <button type="button" data-testid="model-hide-wall" title="Hide wall (Alt+H)" onClick={props.onHide}>
        Hide Wall
      </button>
    </div>
  );
}

/** M2 — Hide Wall (selection + context menu) and Show / Show All Walls panel. */
export function ModelWallVisibilityHost({
  project,
  activeWallId,
  wallMenu,
  onCloseWallMenu,
  onPatchDocument,
  onSelectWall,
  onClearSelection,
  stackedHideBar = false,
}: ModelWallVisibilityHostProps) {
  function hideWall(wallId: string) {
    onPatchDocument((current) => setWallVisible(current, wallId, false), "Hide wall");
    onClearSelection();
    onCloseWallMenu();
  }

  function showWall(wallId: string) {
    onPatchDocument((current) => setWallVisible(current, wallId, true), "Show wall");
    onSelectWall(wallId);
  }

  function showAll() {
    onPatchDocument((current) => showAllWalls(current), "Show all walls");
  }

  function applyWallMaterial(wallId: string, materialId: string) {
    onPatchDocument(
      (current) => setLivingRoomWallMaterial(current, wallId, materialId),
      "Painted wall surface.",
    );
  }

  function clearWallMaterial(wallId: string) {
    onPatchDocument(
      (current) => setLivingRoomWallMaterial(current, wallId, null),
      "Cleared wall material.",
    );
  }

  return (
    <>
      {!stackedHideBar && activeWallId ? (
        <ModelWallHideBar wallId={activeWallId} onHide={() => hideWall(activeWallId)} />
      ) : null}
      <ModelWallVisibilityPanel
        project={project}
        onShowWall={showWall}
        onShowAllWalls={showAll}
      />
      {wallMenu ? (
        <ContextMenu
          testId="wall-context-menu"
          x={wallMenu.x}
          y={wallMenu.y}
          onClose={onCloseWallMenu}
          items={wallContextMenuItems({
            materials: project.materials,
            onHide: () => hideWall(wallMenu.wallId),
            onApply: (materialId) => applyWallMaterial(wallMenu.wallId, materialId),
            onClear: () => clearWallMaterial(wallMenu.wallId),
          })}
        />
      ) : null}
    </>
  );
}
