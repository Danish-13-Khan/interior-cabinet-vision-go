import { GizmoHelper, GizmoViewcube } from "@react-three/drei";

/** Phase 5 — in-canvas 3D view cube (game-engine style). */
export function SceneViewGizmo() {
  return (
    <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
      <GizmoViewcube
        color="#f8fafc"
        hoverColor="#94a3b8"
        textColor="#0f172a"
        strokeColor="#64748b"
        faces={["Right", "Left", "Top", "Bottom", "Front", "Back"]}
      />
    </GizmoHelper>
  );
}
