import type { CameraDebugSnapshot } from "../../domain/orbit/cameraDebug";
import { formatCameraDebugNumber } from "../../domain/orbit/cameraDebug";
import { CameraDebugProfilerRows } from "./CameraDebugProfilerRows";

export type CameraDebugOverlayProps = {
  snapshot: CameraDebugSnapshot | null;
  wireframe: boolean;
  showGridOverride: boolean | null;
  punctualLights: boolean;
  onWireframeChange: (value: boolean) => void;
  onShowGridOverrideChange: (value: boolean | null) => void;
  onPunctualLightsChange: (value: boolean) => void;
  onClose: () => void;
  onPointerActive?: (active: boolean) => void;
  /** When true, grid toggle is available (CabinetScene). */
  gridToggleEnabled?: boolean;
};

/**
 * Opt-in performance card. Pointer events stay on the card so the canvas does not orbit.
 */
export function CameraDebugOverlay({
  snapshot,
  wireframe,
  showGridOverride,
  punctualLights,
  onWireframeChange,
  onShowGridOverrideChange,
  onPunctualLightsChange,
  onClose,
  onPointerActive,
  gridToggleEnabled = false,
}: CameraDebugOverlayProps) {
  const canvasLabel = snapshot?.canvas === "model-view" ? "Model View" : "CabinetScene";
  const hold = (event: { stopPropagation: () => void }) => event.stopPropagation();
  return (
    <div
      className="camera-debug-overlay"
      data-testid="performance-hud"
      onPointerDown={hold}
      onPointerMove={hold}
      onWheel={hold}
      onPointerEnter={() => onPointerActive?.(true)}
      onPointerLeave={() => onPointerActive?.(false)}
      style={{
        position: "absolute",
        top: 8,
        right: 8,
        zIndex: 40,
        minWidth: 240,
        maxWidth: 340,
        padding: "10px 12px",
        borderRadius: 8,
        background: "rgba(18, 22, 28, 0.88)",
        color: "#e8eef5",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 12,
        lineHeight: 1.45,
        pointerEvents: "auto",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
        <strong>Performance · {canvasLabel}</strong>
        <button type="button" aria-label="Close performance" onClick={onClose} style={{ border: 0, background: "transparent", color: "inherit", cursor: "pointer" }}>×</button>
      </div>
      <CameraDebugProfilerRows snapshot={snapshot} />
      <div>polar: {formatCameraDebugNumber(snapshot?.polar, 3)} · frameloop: {snapshot?.frameloop ?? "—"}</div>
      <div>exposure: {formatCameraDebugNumber(snapshot?.exposure, 2)}</div>
      <div style={{ marginTop: 8, borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 8 }}>
        <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
          <input type="checkbox" checked={wireframe} onChange={(e) => onWireframeChange(e.target.checked)} />
          Wireframe (session)
        </label>
        {gridToggleEnabled ? (
          <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
            <input type="checkbox" checked={showGridOverride ?? true} onChange={(e) => onShowGridOverrideChange(e.target.checked)} />
            Grid (session)
          </label>
        ) : null}
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" checked={punctualLights} onChange={(e) => onPunctualLightsChange(e.target.checked)} />
          Punctual lights (session)
        </label>
      </div>
    </div>
  );
}
