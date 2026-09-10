import type { CameraEntity, InteriorProject, RenderQuality } from "../../domain/interiorProject";
import {
  listModelViewRenderPresets,
  setWallVisible,
  type ModelViewPresetId,
  type PresetHonestyDescription,
} from "../../domain/livingRoom";
import {
  ModelWallHideBar,
  ModelWallVisibilityHost,
  type WallContextMenuState,
} from "./ModelWallVisibilityHost";
import { ModelViewLeftChrome } from "./ModelViewLeftChrome";
import { ModelViewToolbar } from "./ModelViewToolbar";

type ModelViewAuthoringOverlaysProps = {
  project: InteriorProject;
  activeWallId: string | null;
  wallMenu: WallContextMenuState | null;
  viewPreset: ModelViewPresetId;
  cameraHeightMm: number;
  fieldOfViewDegrees: number;
  activeCameraId: string | null;
  cameras: readonly CameraEntity[];
  cutawayWalls: boolean;
  activeRotation: number;
  hasActiveObject: boolean;
  viewportQuality: RenderQuality;
  honesty: PresetHonestyDescription;
  hasSelection: boolean;
  onViewPreset: (preset: ModelViewPresetId) => void;
  onCameraHeightMm: (value: number) => void;
  onFieldOfViewDegrees: (value: number) => void;
  onActiveCameraId: (cameraId: string | null) => void;
  onCutawayWalls: (value: boolean) => void;
  onSetRotation: (rotationY: number) => void;
  onViewportQuality: (quality: RenderQuality) => void;
  onOpenGuide: () => void;
  onClearSelection: () => void;
  onFitRoom: () => void;
  onFocusSelection: () => void;
  onCloseWallMenu: () => void;
  onSelectWall: (wallId: string) => void;
  onPatchDocument?: (
    update: (current: InteriorProject) => InteriorProject,
    status: string,
  ) => void;
};

/** Camera toolbar + Hide Wall stack, plus wall panel / context menu. */
export function ModelViewAuthoringOverlays(props: ModelViewAuthoringOverlaysProps) {
  const wallId = props.activeWallId;
  const canPatch = Boolean(props.onPatchDocument);
  return (
    <>
      <ModelViewLeftChrome
        toolbar={(
          <ModelViewToolbar
            viewPreset={props.viewPreset}
            cameraHeightMm={props.cameraHeightMm}
            fieldOfViewDegrees={props.fieldOfViewDegrees}
            activeCameraId={props.activeCameraId}
            cameras={props.cameras}
            cutawayWalls={props.cutawayWalls}
            activeRotation={props.activeRotation}
            hasActiveObject={props.hasActiveObject}
            viewportQuality={props.viewportQuality}
            modelPresets={listModelViewRenderPresets()}
            honesty={props.honesty}
            onViewPreset={props.onViewPreset}
            onCameraHeightMm={props.onCameraHeightMm}
            onFieldOfViewDegrees={props.onFieldOfViewDegrees}
            onActiveCameraId={props.onActiveCameraId}
            onCutawayWalls={props.onCutawayWalls}
            onSetRotation={props.onSetRotation}
            onViewportQuality={props.onViewportQuality}
            onOpenGuide={props.onOpenGuide}
            hasSelection={props.hasSelection}
            onClearSelection={props.onClearSelection}
            onFitRoom={props.onFitRoom}
            onFocusSelection={props.onFocusSelection}
          />
        )}
        wallAction={canPatch && wallId ? (
          <ModelWallHideBar
            wallId={wallId}
            onHide={() => {
              props.onPatchDocument?.((current) => setWallVisible(current, wallId, false), "Hide wall");
              props.onClearSelection();
            }}
          />
        ) : null}
      />
      {props.onPatchDocument ? (
        <ModelWallVisibilityHost
          project={props.project}
          activeWallId={props.activeWallId}
          wallMenu={props.wallMenu}
          stackedHideBar
          onCloseWallMenu={props.onCloseWallMenu}
          onPatchDocument={props.onPatchDocument}
          onSelectWall={props.onSelectWall}
          onClearSelection={props.onClearSelection}
        />
      ) : null}
    </>
  );
}
