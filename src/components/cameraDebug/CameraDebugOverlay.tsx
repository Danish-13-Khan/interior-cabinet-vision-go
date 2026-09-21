import type { CameraDebugSnapshot } from "../../domain/orbit/cameraDebug";
import { formatCameraDebugNumber } from "../../domain/orbit/cameraDebug";

export type CameraDebugOverlayProps = {
  snapshot: CameraDebugSnapshot | null;
  wireframe: boolean;
  showGridOverride: boolean | null;
  punctualLights: boolean;
  onWireframeChange: (value: boolean) => void;
  onShowGridOverrideChange: (value: boolean | null) => void;
  onPunctualLightsChange: (value: boolean) => void;
  /** When true, grid toggle is available (CabinetScene). */
  gridToggleEnabled?: boolean;
};

/**
 * Phase 4 — DOM overlay. Readouts only for lighting/exposure; toggles are
 * session-local and must not write product lighting state.
 */
export function CameraDebugOverlay({
  snapshot,
  wireframe,
  showGridOverride,
  punctualLights,
  onWireframeChange,
  onShowGridOverrideChange,
  onPunctualLightsChange,
  gridToggleEnabled = false,
}: CameraDebugOverlayProps) {
  const canvasLabel = snapshot?.canvas === "model-view" ? "Model View" : "CabinetScene";
  return (
    <div
      className="camera-debug-overlay"
      style={{
        position: "absolute",
        top: 8,
        right: 8,
        zIndex: 40,
        minWidth: 220,
        maxWidth: 280,
        padding: "10px 12px",
        borderRadius: 8,
        background: "rgba(18, 22, 28, 0.88)",
        color: "#e8eef5",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 11,
        lineHeight: 1.45,
        pointerEvents: "auto",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6, letterSpacing: 0.3 }}>
        Camera debug · {canvasLabel}
      </div>
      <div>screenSpacePanning: {String(snapshot?.screenSpacePanning ?? "—")}</div>
      <div>damping: {String(snapshot?.enableDamping ?? "—")} / {formatCameraDebugNumber(snapshot?.dampingFactor, 3)}</div>
      <div>distance: {formatCameraDebugNumber(snapshot?.distance, 2)}</div>
      <div>
        target:{" "}
        {snapshot?.target
          ? snapshot.target.map((n) => formatCameraDebugNumber(n, 2)).join(", ")
          : "—"}
      </div>
      <div>polar: {formatCameraDebugNumber(snapshot?.polar, 3)}</div>
      <div>fps: {formatCameraDebugNumber(snapshot?.fps, 0)} · frame {formatCameraDebugNumber(snapshot?.frameMs, 1)} ms</div>
      <div>
        tris: {snapshot?.triangles ?? "—"} · draws: {snapshot?.drawCalls ?? "—"}
      </div>
      <div>exposure (readout): {formatCameraDebugNumber(snapshot?.exposure, 2)}</div>
      <div>frameloop: {snapshot?.frameloop ?? "—"}</div>

      <div style={{ marginTop: 8, borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 8 }}>
        <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
          <input
            type="checkbox"
            checked={wireframe}
            onChange={(e) => onWireframeChange(e.target.checked)}
          />
          Wireframe (session)
        </label>
        {gridToggleEnabled ? (
          <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
            <input
              type="checkbox"
              checked={showGridOverride ?? true}
              onChange={(e) => onShowGridOverrideChange(e.target.checked)}
            />
            Grid (session)
          </label>
        ) : null}
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={punctualLights}
            onChange={(e) => onPunctualLightsChange(e.target.checked)}
          />
          Punctual lights (session)
        </label>
      </div>
      <div style={{ marginTop: 8, opacity: 0.7 }}>
        Opt-in only · does not write product lighting
      </div>
    </div>
  );
}
