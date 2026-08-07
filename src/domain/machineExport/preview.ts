import type { MachinePartMetadata, MachiningPreviewSummary } from "./types";

export function summarizeMachiningPreview(
  parts: MachinePartMetadata[],
): MachiningPreviewSummary {
  let operationCount = 0;
  let drillIntentCount = 0;
  let grooveIntentCount = 0;
  let cutIntentCount = 0;
  let unverifiedCount = 0;

  for (const part of parts) {
    for (const op of part.operations) {
      operationCount += 1;
      if (op.kind === "drill" || op.kind === "hardware-intent") drillIntentCount += 1;
      if (op.kind === "groove" || op.kind === "rebate" || op.kind === "pocket") {
        grooveIntentCount += 1;
      }
      if (op.kind === "cut-outline") cutIntentCount += 1;
      if (op.status === "intent" || op.status === "unverified") unverifiedCount += 1;
    }
  }

  return {
    partCount: parts.length,
    operationCount,
    drillIntentCount,
    grooveIntentCount,
    cutIntentCount,
    unverifiedCount,
  };
}

export function listPreviewOperations(parts: MachinePartMetadata[]) {
  return parts.flatMap((part) =>
    part.operations.map((operation) => ({
      shopRef: part.shopRef,
      partLabel: part.label,
      cabinetName: part.cabinetName,
      category: part.category,
      orientation: part.orientation,
      blank: part.blank,
      operation,
    })),
  );
}
