import { OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import {
  modelViewUsesOrthographic,
  type ModelViewPresetId,
} from "../../domain/livingRoom";
import { resolveModelViewCameraFarMeters } from "../../domain/livingRoom/modelViewCameraEase";

/** Switches the R3F default camera between perspective and true orthographic (Isometric). */
export function ModelViewCameraKind({
  viewPreset,
  roomSpanMeters = 8,
}: {
  viewPreset: ModelViewPresetId;
  roomSpanMeters?: number;
}) {
  const far = resolveModelViewCameraFarMeters(roomSpanMeters);
  if (modelViewUsesOrthographic(viewPreset)) {
    return (
      <OrthographicCamera
        makeDefault
        near={0.05}
        far={Math.max(far, 200)}
        position={[0, 1.5, 2]}
        zoom={40}
      />
    );
  }
  return (
    <PerspectiveCamera
      makeDefault
      near={0.05}
      far={far}
      fov={42}
      position={[0, 1.5, 2]}
    />
  );
}
