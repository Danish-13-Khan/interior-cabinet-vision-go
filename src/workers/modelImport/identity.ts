import type { ImportFile, ImportSettings } from "./protocol";

export async function sha256Hex(bytes: BufferSource): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Stable id from every selected file plus the import settings. Not the storage key. */
export async function assetIdForImport(files: readonly ImportFile[], settings: ImportSettings): Promise<string> {
  const sorted = [...files].sort((a, b) => a.name.localeCompare(b.name));
  const parts: string[] = [];
  for (const file of sorted) parts.push(`${file.name}:${await sha256Hex(file.bytes)}`);
  parts.push(JSON.stringify({
    unit: settings.unit,
    upAxis: settings.upAxis,
    optimizerVersion: settings.optimizerVersion,
  }));
  return `file:${await sha256Hex(new TextEncoder().encode(parts.join("\n")))}`;
}
