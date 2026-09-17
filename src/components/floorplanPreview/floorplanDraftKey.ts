import type { ExtractionResult } from "../../domain/floorplanExtract";
import { hashFingerprintSeed } from "../../domain/floorplanExtract/glbExportFingerprint";

/** Short content key — hash so React deps stay cheap (stringify once). */
export function floorplanDraftContentKey(
  draft: ExtractionResult,
  appliedAt: unknown,
  projectId: string,
): string {
  return `${projectId}:${String(appliedAt ?? "")}:${hashFingerprintSeed(JSON.stringify(draft))}`;
}

export function floorplanDraftHash(draft: ExtractionResult): string {
  return hashFingerprintSeed(JSON.stringify(draft));
}
