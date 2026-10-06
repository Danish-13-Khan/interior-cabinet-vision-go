import { useThree } from "@react-three/fiber";
import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { createRoot, type Root } from "react-dom/client";
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

/** Screen-fixed host. A scene HTML layer would translate with the camera. */
function ScreenFixedCard({ children }: { children: ReactNode }) {
  const gl = useThree((state) => state.gl);
  const rootRef = useRef<Root | null>(null);

  useEffect(() => {
    const parent = gl.domElement.parentElement;
    if (!parent) return;
    const host = document.createElement("div");
    host.dataset.performanceHudHost = "";
    host.style.cssText = "position:absolute;inset:0;pointer-events:none;z-index:30;";
    parent.appendChild(host);
    const root = createRoot(host);
    rootRef.current = root;
    return () => {
      rootRef.current = null;
      root.unmount();
      host.remove();
    };
  }, [gl]);

  useEffect(() => {
    rootRef.current?.render(children);
  });

  return null;
}

/** Probe plus the card. The card stays pinned to the canvas corner. */
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
      <ScreenFixedCard>{card}</ScreenFixedCard>
    </>
  );
}
