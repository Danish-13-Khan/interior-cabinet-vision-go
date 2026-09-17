import type { ExtractionResult } from "../../domain/floorplanExtract";
import { assertExtractionShape } from "../../domain/floorplanExtract";

/** Parse persisted InteriorProject.extensions.floorplanExtractDraft; null if corrupt. */
export function readSavedFloorplanDraft(raw: unknown): ExtractionResult | null {
  if (raw == null) return null;
  try {
    return assertExtractionShape(raw);
  } catch {
    return null;
  }
}
