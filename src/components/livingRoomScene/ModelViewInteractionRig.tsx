import { ContactShadows, OrbitControls } from "@react-three/drei";
import { MOUSE } from "three";
import { useRef, type RefObject } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { RenderComposition, RenderQuality } from "../../domain/interiorProject";
import type { CompiledLivingRoomScene, ModelViewPresetId } from "../../domain/livingRoom";
import type { EnvironmentLightingQuality } from "../../domain/livingRoom/environmentLightingQuality";
import type { ModelViewFitMode, ModelViewFitSelection } from "../../domain/livingRoom/modelViewFit";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import {
  MODEL_VIEW_ZOOM_TO_CURSOR,
  resolveModelViewMaxPolarAngle,
  resolveModelViewMinPolarAngle,
  resolveModelViewOrbitMaxDistance,
  resolveModelViewOrbitMinDistance,
} from "../../domain/livingRoom/modelViewCameraEase";
import {
  modelViewOrbitOverrides,
  resolveOrbitControlsSharedCommons,
} from "../../domain/orbit/orbitControlsPreset";
import { CameraRig } from "./CameraRig";
import { WalkthroughNavigation } from "./WalkthroughNavigation";
import { ModelPickHarness } from "./ModelPickHarness";
import { CursorDollyPastMin } from "./CursorDollyPastMin";

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
  inspectionSpanMeters?: number;
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
  inspectionSpanMeters,
  onExitWalkthrough,
}: ModelViewInteractionRigProps) {
  const orbitNavigatingRef = useRef(false);
  const orbitEaseCancelGenerationRef = useRef(0);
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
          {...resolveOrbitControlsSharedCommons()}
          dampingFactor={modelViewOrbitOverrides.dampingFactor}
          panSpeed={modelViewOrbitOverrides.panSpeed}
          zoomSpeed={modelViewOrbitOverrides.zoomSpeed}
          rotateSpeed={modelViewOrbitOverrides.rotateSpeed}
          enablePan={viewPreset !== "walkthrough"}
          enableZoom
          zoomToCursor={MODEL_VIEW_ZOOM_TO_CURSOR}
          minDistance={resolveModelViewOrbitMinDistance(inspectionSpanMeters)}
          maxDistance={resolveModelViewOrbitMaxDistance(roomSpan)}
          minPolarAngle={resolveModelViewMinPolarAngle(viewPreset)}
          maxPolarAngle={resolveModelViewMaxPolarAngle()}
          onStart={() => {
            orbitNavigatingRef.current = true;
            orbitEaseCancelGenerationRef.current += 1;
          }}
          onEnd={() => { orbitNavigatingRef.current = false; }}
          mouseButtons={{
            LEFT: MOUSE.ROTATE,
            MIDDLE: viewPreset === "walkthrough" ? MOUSE.ROTATE : MOUSE.PAN,
            RIGHT: viewPreset === "walkthrough" ? MOUSE.ROTATE : MOUSE.PAN,
          }}
        />
      ) : null}
      {interactive ? <CursorDollyPastMin controlsRef={controlsRef} /> : null}
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
        dragging={dragging}
        orbitNavigatingRef={orbitNavigatingRef}
        orbitEaseCancelGenerationRef={orbitEaseCancelGenerationRef}
      />
      <WalkthroughNavigation
        enabled={interactive && viewPreset === "walkthrough"}
        controlsRef={controlsRef}
        onExit={onExitWalkthrough}
      />
      {interactive && import.meta.env.DEV ? <ModelPickHarness /> : null}
    </>
  );
}
