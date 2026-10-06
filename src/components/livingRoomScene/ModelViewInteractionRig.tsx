import { ContactShadows, OrbitControls } from "@react-three/drei";
import { MOUSE } from "three";
import { useRef, useState, type RefObject } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { RenderComposition, RenderQuality } from "../../domain/interiorProject";
import type { CompiledLivingRoomScene, ModelViewPresetId } from "../../domain/livingRoom";
import type { EnvironmentLightingQuality } from "../../domain/livingRoom/environmentLightingQuality";
import type { ModelViewFitMode, ModelViewFitSelection } from "../../domain/livingRoom/modelViewFit";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import type { CabinetRunAudience } from "../../domain/livingRoom/cabinetRunFrame";
import { resolveContactShadowLook } from "../../domain/livingRoom/clientGrounding";
import { EXCLUDE_FROM_EXPORT } from "../../rendering/sceneExport/sceneExportFilter";
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
import { OrbitPivotFocus } from "./OrbitPivotFocus";
import { CameraDebugHudMount } from "../cameraDebug/CameraDebugHudMount";
import { useCameraDebugSession } from "../cameraDebug/useCameraDebugSession";

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
  frameRun?: CabinetRunAudience;
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
  frameRun,
}: ModelViewInteractionRigProps) {
  const orbitNavigatingRef = useRef(false);
  const orbitEaseCancelGenerationRef = useRef(0);
  const cameraDebug = useCameraDebugSession();
  const [hudHot, setHudHot] = useState(false);
  const exposureReadout = scene.style?.colorManagement?.exposure ?? null;
  const contactShadow = resolveContactShadowLook({
    opacity: environment.contactShadowOpacity * lightingQuality.contactShadowOpacityScale,
    blur: environment.contactShadowBlur * lightingQuality.contactShadowBlurScale,
  }, frameRun);
  return (
    <>
      <group userData={{ [EXCLUDE_FROM_EXPORT]: true }}>
        <ContactShadows
          key={`${renderQuality}-${renderMode}`}
          position={[
            scene.bounds.center.x / 1000,
            lightingQuality.contactShadowHeightOffsetMeters,
            scene.bounds.center.z / 1000,
          ]}
          scale={Math.max(8, roomSpan + 1)}
          opacity={contactShadow.opacity}
          blur={contactShadow.blur}
          far={lightingQuality.contactShadowFarMeters}
          resolution={lightingQuality.contactShadowResolution}
          frames={lightingQuality.contactShadowFrames}
        />
      </group>
      {interactive ? (
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enabled={!dragging && !(cameraDebug.enabled && hudHot)}
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
          minPolarAngle={resolveModelViewMinPolarAngle(
            activeCameraId?.startsWith("apartment-overview-") ? "top" : viewPreset,
          )}
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
      <OrbitPivotFocus
        controlsRef={controlsRef}
        navigatingRef={orbitNavigatingRef}
        cancelGenerationRef={orbitEaseCancelGenerationRef}
        enabled={interactive && viewPreset !== "walkthrough"}
      />
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
        frameRun={frameRun}
      />
      <WalkthroughNavigation
        enabled={interactive && viewPreset === "walkthrough"}
        controlsRef={controlsRef}
        onExit={onExitWalkthrough}
      />
      {interactive && import.meta.env.DEV ? <ModelPickHarness /> : null}

      {cameraDebug.enabled ? (
        <CameraDebugHudMount
          canvas="model-view"
          controlsRef={controlsRef}
          exposure={exposureReadout}
          snapshot={cameraDebug.snapshot}
          wireframe={cameraDebug.wireframe}
          showGridOverride={cameraDebug.showGridOverride}
          punctualLights={cameraDebug.punctualLights}
          onSnapshot={cameraDebug.onSnapshot}
          onWireframeChange={cameraDebug.setWireframe}
          onShowGridOverrideChange={cameraDebug.setShowGridOverride}
          onPunctualLightsChange={cameraDebug.setPunctualLights}
          onPointerActive={setHudHot}
        />
      ) : null}
    </>
  );
}
