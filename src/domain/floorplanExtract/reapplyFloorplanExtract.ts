import type { InteriorProject } from "../interiorProject/types";
import type { ExtractionResult } from "./types";
import { applyFloorplanToInterior } from "./applyToInterior";
import { normalizeExtraction } from "./normalize";

/** Re-run Apply from a saved extract (clears objects/surfaces; replaces shell). */
export function reapplyFloorplanExtract(
  project: InteriorProject,
  draft: ExtractionResult,
  acceptThinWalls = true,
): InteriorProject {
  const normalized = normalizeExtraction(draft, { acceptThinWalls });
  if (!normalized.canApply) {
    const block = normalized.issues.find((i) => i.blocksApply);
    throw new Error(block?.message ?? "Saved extract cannot Apply (gates blocked).");
  }
  return applyFloorplanToInterior(project, normalized);
}
