import { ContactShadows, OrbitControls } from "@react-three/drei";
import { MOUSE } from "three";
import type { RefObject } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { RenderComposition, RenderQuality } from "../../domain/interiorProject";
import type { CompiledLivingRoomScene, ModelViewPresetId } from "../../domain/livingRoom";
import type { EnvironmentLightingQuality } from "../../domain/livingRoom/environmentLightingQuality";
import type { ModelViewFitMode, ModelViewFitSelection } from "../../domain/livingRoom/modelViewFit";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import { CameraRig } from "./CameraRig";
import { WalkthroughNavigation } from "./WalkthroughNavigation";
import { ModelPickHarness } from "./ModelPickHarness";

type ModelViewInteractionRigProps = {
  scene: CompiledLivingRoomScene;
  controlsRef: RefObject<OrbitControlsImpl | null>;
  activeCameraId: string | null;
  viewPreset?: ModelViewPresetId;
  cameraHeightMm?: number;
  fieldOfViewDegrees?: number;
  assetRevision: number;
  interactive: boolean;
  dragging: boolean;
  roomSpan: number;
  renderQuality: RenderQuality;
  renderComposition: RenderComposition;
  renderMode: RenderMode;
  lightingQuality: EnvironmentLightingQuality;
  environment: CompiledLivingRoomScene["style"]["environment"];
  fitVersion: number;
  fitMode: ModelViewFitMode;
  fitSelection?: ModelViewFitSelection;
  onExitWalkthrough?: () => void;
};

/** Orbit / pan / zoom controls plus camera rig for the model viewport. */
export function ModelViewInteractionRig({
  scene,
  controlsRef,
  activeCameraId,
  viewPreset,
  cameraHeightMm,
  fieldOfViewDegrees,
  assetRevision,
  interactive,
  dragging,
  roomSpan,
  renderQuality,
  renderComposition,
  renderMode,
  lightingQuality,
  environment,
  fitVersion,
  fitMode,
  fitSelection,
  onExitWalkthrough,
}: ModelViewInteractionRigProps) {
  return (
    <>
      <ContactShadows
        key={`${renderQuality}-${renderMode}`}
        position={[0, lightingQuality.contactShadowHeightOffsetMeters, 0]}
        scale={Math.max(8, roomSpan + 1)}
        opacity={environment.contactShadowOpacity * lightingQuality.contactShadowOpacityScale}
        blur={environment.contactShadowBlur * lightingQuality.contactShadowBlurScale}
        far={lightingQuality.contactShadowFarMeters}
        resolution={lightingQuality.contactShadowResolution}
        frames={lightingQuality.contactShadowFrames}
      />
      {interactive ? (
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enabled={!dragging}
          enableDamping
          dampingFactor={0.06}
          panSpeed={1.05}
          zoomSpeed={1.05}
          rotateSpeed={0.92}
          enablePan={viewPreset !== "walkthrough"}
          enableZoom={viewPreset !== "walkthrough"}
          minDistance={1.2}
          maxDistance={16}
          maxPolarAngle={Math.PI / 2 - 0.02}
          mouseButtons={{
            LEFT: MOUSE.ROTATE,
            MIDDLE: viewPreset === "walkthrough" ? MOUSE.ROTATE : MOUSE.PAN,
            RIGHT: viewPreset === "walkthrough" ? MOUSE.ROTATE : MOUSE.PAN,
          }}
        />
      ) : null}
      <CameraRig
        scene={scene}
        activeCameraId={activeCameraId}
        controlsRef={controlsRef}
        composition={renderComposition}
        renderMode={renderMode}
        viewPreset={viewPreset}
        cameraHeightMm={cameraHeightMm}
        fieldOfViewDegrees={fieldOfViewDegrees}
        assetRevision={assetRevision}
        fitVersion={fitVersion}
        fitMode={fitMode}
        fitSelection={fitSelection}
      />
      <WalkthroughNavigation
        enabled={interactive && viewPreset === "walkthrough"}
        onExit={onExitWalkthrough}
      />
      {interactive && import.meta.env.DEV ? <ModelPickHarness /> : null}
    </>
  );
}
