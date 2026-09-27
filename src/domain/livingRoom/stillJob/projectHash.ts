import type { InteriorProject } from "../../interiorProject";
import { compileLivingRoomScene } from "../sceneCompiler";
import { hashString, stableStringify } from "../sceneCompilerBounds";

/**
 * Stable visual-content hash for StillJob binding.
 *
 * This intentionally hashes compiled visual state instead of the project
 * document. Commercial status, proposal releases, approval records, handoff
 * records, active-camera selection, and package bookmark names are workflow
 * metadata and must not invalidate accepted imagery.
 */
export function stillJobProjectContentHash(project: InteriorProject): string {
  const scene = compileLivingRoomScene(project);
  const {
    activeCameraId: _activeCameraId,
    packageCameraBookmarks: _packageCameraBookmarks,
    ...renderSettings
  } = project.renderSettings;
  return `sj-proj-${hashString(stableStringify({
    sceneFingerprint: scene.fingerprint,
    renderSettings,
  }))}`;
}
