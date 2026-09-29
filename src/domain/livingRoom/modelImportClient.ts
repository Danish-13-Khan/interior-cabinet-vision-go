import type { Size3Mm } from "../interiorProject";
import { assetIdForImport } from "../../workers/modelImport/identity";
import type { ImportRequest, ImportResult, ImportSettings, LengthUnit } from "../../workers/modelImport/protocol";
import { runImport } from "../../workers/modelImport/runImport";
import { decideImportRuntime, probeImportRuntime } from "../../workers/modelImport/spike";

/** Saved 1000 mm placements stay as they are. Measured size is only for a new import. */
export function dimensionsForPlacement(existing: Size3Mm | null | undefined, measured: Size3Mm): Size3Mm {
  return existing ?? measured;
}

async function importWithWorker(request: ImportRequest): Promise<ImportResult> {
  const worker = new Worker(new URL("../../workers/modelImport/modelImport.worker.ts", import.meta.url), { type: "module" });
  return new Promise((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<{ result?: ImportResult; error?: string }>) => {
      worker.terminate();
      if (event.data.error || !event.data.result) reject(new Error(event.data.error || "Import failed"));
      else resolve(event.data.result);
    };
    worker.onerror = () => { worker.terminate(); reject(new Error("Import worker failed")); };
    worker.postMessage({ id: 1, request });
  });
}

export async function importModel(request: ImportRequest): Promise<ImportResult> {
  const runtime = decideImportRuntime(probeImportRuntime());
  const next = runtime === "split" ? { ...request, texturesOnMain: true } : request;
  if (typeof Worker !== "undefined") {
    try { return await importWithWorker(next); } catch { /* main-thread fallback */ }
  }
  return runImport(next);
}

export async function measureGlbImport(
  files: { name: string; bytes: ArrayBuffer }[],
  settings: ImportSettings,
  honorFileUnits = true,
): Promise<ImportResult> {
  return importModel({ files, settings, honorFileUnits });
}

export function defaultGlbSettings(unit: LengthUnit = "m"): ImportSettings {
  return { unit, upAxis: "y", optimizerVersion: 0 };
}

export { assetIdForImport };
