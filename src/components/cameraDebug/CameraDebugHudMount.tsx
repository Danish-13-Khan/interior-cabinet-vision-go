import { Html } from "@react-three/drei";
import type { RefObject } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { CameraDebugSnapshot } from "../../domain/orbit/cameraDebug";
import { usePerfHudSession } from "../../hooks/usePerfHudSession";
import { CameraDebugOverlay } from "./CameraDebugOverlay";
import { OrbitDebugProbe } from "./OrbitDebugProbe";

type CameraDebugHudMountProps = {
  canvas: CameraDebugSnapshot["canvas"];
  controlsRef: RefObject<OrbitControlsImpl | null>;
  snapshot: CameraDebugSnapshot | null;
  exposure?: number | null;
  wireframe: boolean;
  showGridOverride: boolean | null;
  punctualLights: boolean;
  gridToggleEnabled?: boolean;
  onSnapshot: (snapshot: CameraDebugSnapshot) => void;
  onWireframeChange: (value: boolean) => void;
  onShowGridOverrideChange: (value: boolean | null) => void;
  onPunctualLightsChange: (value: boolean) => void;
  onPointerActive?: (active: boolean) => void;
};

/** Probe plus the card. Model View portals the card over the canvas. */
export function CameraDebugHudMount(props: CameraDebugHudMountProps) {
  const hud = usePerfHudSession();
  const card = (
    <CameraDebugOverlay
      snapshot={props.snapshot}
      wireframe={props.wireframe}
      showGridOverride={props.showGridOverride}
      punctualLights={props.punctualLights}
      onWireframeChange={props.onWireframeChange}
      onShowGridOverrideChange={props.onShowGridOverrideChange}
      onPunctualLightsChange={props.onPunctualLightsChange}
      onClose={hud.close}
      onPointerActive={props.onPointerActive}
      gridToggleEnabled={props.gridToggleEnabled}
    />
  );
  if (props.canvas === "cabinet") return card;
  return (
    <>
      <OrbitDebugProbe
        canvas="model-view"
        controlsRef={props.controlsRef}
        exposure={props.exposure}
        wireframe={props.wireframe}
        punctualLights={props.punctualLights}
        onSnapshot={props.onSnapshot}
      />
      <Html fullscreen style={{ pointerEvents: "none" }} zIndexRange={[100, 0]}>
        <div style={{ pointerEvents: "none", position: "relative", width: "100%", height: "100%" }}>{card}</div>
      </Html>
    </>
  );
}
