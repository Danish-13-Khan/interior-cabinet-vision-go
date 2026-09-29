import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { registerModelViewScene } from "../../rendering/sceneExport";

export function ModelViewSceneExportBridge() {
  const scene = useThree((state) => state.scene);
  useEffect(() => registerModelViewScene(scene), [scene]);
  return null;
}
