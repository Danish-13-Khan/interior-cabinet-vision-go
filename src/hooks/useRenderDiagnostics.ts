import { useMemo } from "react";
import type { CameraEntity } from "../domain/interiorProject";
import type { CompiledLivingRoomScene } from "../domain/livingRoom";
import {
  collectRenderDiagnostics,
  type RenderDiagnosticsReport,
} from "../rendering/qa";

const isDev = Boolean(import.meta.env?.DEV);

export function useRenderDiagnostics(
  scene: CompiledLivingRoomScene,
  activeCamera: CameraEntity | null | undefined,
): RenderDiagnosticsReport | null {
  return useMemo(() => {
    if (!isDev) return null;
    return collectRenderDiagnostics(scene, activeCamera);
  }, [activeCamera, scene]);
}

export function isRenderDiagnosticsEnabled() {
  return isDev;
}
