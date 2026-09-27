import type { InteriorProject } from "../../interiorProject";
import { hashString } from "../sceneCompilerBounds";

function withoutProposalRelease(
  extensions: InteriorProject["extensions"],
): InteriorProject["extensions"] {
  const proposalSurface = extensions?.proposalSurface;
  if (!proposalSurface || typeof proposalSurface !== "object" || Array.isArray(proposalSurface)) {
    return extensions;
  }
  const { proposalRelease: _proposalRelease, ...surface } = proposalSurface as Record<string, unknown>;
  return {
    ...extensions,
    proposalSurface: surface,
  };
}

/**
 * Stable visual-content hash for StillJob binding.
 *
 * `activeCameraId` is transient UI selection. Each still already records its own
 * camera id, so including the active selection would invalidate previously
 * accepted camera captures whenever the user moves to the next package view.
 *
 * `proposalRelease` is export/audit metadata written only after the PDF is
 * saved. It does not change the rendered scene and must not make the captures
 * used by that PDF immediately stale.
 */
export function stillJobProjectContentHash(project: InteriorProject): string {
  const { updatedAt: _updatedAt, ...rest } = project;
  const { activeCameraId: _activeCameraId, ...renderSettings } = rest.renderSettings;
  return `sj-proj-${hashString(JSON.stringify({
    ...rest,
    renderSettings,
    extensions: withoutProposalRelease(rest.extensions),
  }))}`;
}
