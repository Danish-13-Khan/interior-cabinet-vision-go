import { useThree } from "@react-three/fiber";
import { useLayoutEffect } from "react";

/**
 * Force a demand-frameloop redraw when Model View inputs change.
 * OrbitControls / CameraRig / Walkthrough also call invalidate on their own.
 */
export function ModelViewCanvasInvalidator({
  revision,
}: {
  revision: string;
}) {
  const invalidate = useThree((state) => state.invalidate);
  useLayoutEffect(() => {
    invalidate();
  }, [invalidate, revision]);
  return null;
}
