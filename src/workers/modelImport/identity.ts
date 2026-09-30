import type { ImportFile, ImportSettings, LengthUnit } from "./protocol";

export type ImportUnitDecision = {
  honorFileUnits?: boolean;
  appliedUnit?: LengthUnit | null;
  scaleToMm?: number;
};

function decidedUnit(settings: ImportSettings, decision: ImportUnitDecision): string {
  if (decision.honorFileUnits !== true) return settings.unit;
  if (decision.appliedUnit) return decision.appliedUnit;
  if (typeof decision.scaleToMm === "number") return `mm-per-unit:${decision.scaleToMm}`;
  return settings.unit;
}

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
  const sorted = [...files].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  const parts: string[] = [];
  for (const file of sorted) parts.push(`${file.name}:${await sha256Hex(file.bytes)}`);
  const honorFileUnits = decision.honorFileUnits === true;
  const unit = decidedUnit(settings, decision);
  parts.push(JSON.stringify({
    unit,
    upAxis: settings.upAxis,
    optimizerVersion: settings.optimizerVersion,
    honorFileUnits,
    ...(typeof decision.scaleToMm === "number" ? { scaleToMm: decision.scaleToMm } : {}),
  }));
  return `file:${await sha256Hex(new TextEncoder().encode(parts.join("\n")))}`;
}
