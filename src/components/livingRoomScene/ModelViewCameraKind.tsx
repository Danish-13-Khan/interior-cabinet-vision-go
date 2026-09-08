import { OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import { modelViewUsesOrthographic, type ModelViewPresetId } from "../../domain/livingRoom";

/** Switches the R3F default camera between perspective and true orthographic (Isometric). */
export function ModelViewCameraKind({ viewPreset }: { viewPreset: ModelViewPresetId }) {
  if (modelViewUsesOrthographic(viewPreset)) {
    return (
      <OrthographicCamera
        makeDefault
        near={0.05}
        far={200}
        position={[0, 1.5, 2]}
        zoom={40}
      />
    );
  }
  return (
    <PerspectiveCamera
      makeDefault
      near={0.05}
      far={100}
      fov={42}
      position={[0, 1.5, 2]}
    />
  );
}
