import type { ImportFile, ImportSettings, LengthUnit } from "./protocol";

export type ImportUnitDecision = {
  honorFileUnits?: boolean;
  appliedUnit?: LengthUnit;
  scaleToMm?: number;
};

export async function sha256Hex(bytes: BufferSource): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Stable id from every selected file plus the unit decision that changed the geometry. */
export async function assetIdForImport(
  files: readonly ImportFile[],
  settings: ImportSettings,
  decision: ImportUnitDecision = {},
): Promise<string> {
  const sorted = [...files].sort((a, b) => a.name.localeCompare(b.name));
  const parts: string[] = [];
  for (const file of sorted) parts.push(`${file.name}:${await sha256Hex(file.bytes)}`);
  const honorFileUnits = decision.honorFileUnits === true;
  const unit = honorFileUnits && decision.appliedUnit ? decision.appliedUnit : settings.unit;
  parts.push(JSON.stringify({
    unit,
    upAxis: settings.upAxis,
    optimizerVersion: settings.optimizerVersion,
    honorFileUnits,
    ...(typeof decision.scaleToMm === "number" ? { scaleToMm: decision.scaleToMm } : {}),
  }));
  return `file:${await sha256Hex(new TextEncoder().encode(parts.join("\n")))}`;
}
