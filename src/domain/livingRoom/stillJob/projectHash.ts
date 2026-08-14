import type { InteriorProject } from "../../interiorProject";
import { hashString } from "../sceneCompilerBounds";

/** Stable content hash for StillJob binding (ignores updatedAt). */
export function stillJobProjectContentHash(project: InteriorProject): string {
  const { updatedAt: _updatedAt, ...rest } = project;
  return `sj-proj-${hashString(JSON.stringify(rest))}`;
}
