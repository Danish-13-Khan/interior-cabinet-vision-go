import type { Size3Mm } from "../interiorProject";
import { assetIdForImport } from "../../workers/modelImport/identity";
import type { ImportRequest, ImportResult, ImportSettings, LengthUnit } from "../../workers/modelImport/protocol";
import { OPTIMIZER_VERSION } from "../../workers/modelImport/optimizerVersion";
import { decideImportRuntime, probeImportRuntime } from "../../workers/modelImport/spike";

/** Saved 1000 mm placements stay as they are. Measured size is only for a new import. */
export function dimensionsForPlacement(existing: Size3Mm | null | undefined, measured: Size3Mm): Size3Mm {
  return existing ?? measured;
}

function cancelled(): Error {
  return new DOMException("Import cancelled", "AbortError");
}

function importWithWorker(request: ImportRequest, signal?: AbortSignal): Promise<ImportResult> {
  const worker = new Worker(new URL("../../workers/modelImport/modelImport.worker.ts", import.meta.url), { type: "module" });
  return new Promise((resolve, reject) => {
    const stop = (error: Error) => { worker.terminate(); reject(error); };
    const onAbort = () => stop(cancelled());
    if (signal?.aborted) { onAbort(); return; }
    signal?.addEventListener("abort", onAbort, { once: true });
    worker.onmessage = (event: MessageEvent<{ result?: ImportResult; error?: string }>) => {
      signal?.removeEventListener("abort", onAbort);
      worker.terminate();
      if (event.data.error || !event.data.result) reject(new Error(event.data.error || "Import failed"));
      else resolve(event.data.result);
    };
    worker.onerror = () => { signal?.removeEventListener("abort", onAbort); worker.terminate(); reject(new Error("Import worker failed")); };
    const { signal: _signal, ...payload } = request;
    worker.postMessage({ id: 1, request: payload });
  });
}

async function importOnMainThread(request: ImportRequest): Promise<ImportResult> {
  const pipeline = await import("../../workers/modelImport/runImport");
  return pipeline.runImport(request);
}

export async function importModel(request: ImportRequest, signal?: AbortSignal): Promise<ImportResult> {
  if (signal?.aborted) throw cancelled();
  const runtime = decideImportRuntime(await probeImportRuntime());
  const next = { ...(runtime === "split" ? { ...request, texturesOnMain: true } : request), signal };
  if (typeof Worker !== "undefined") {
    try { return await importWithWorker(next, signal); } catch (error) {
      if (signal?.aborted) throw error;
    }
  }
  return importOnMainThread(next);
}

export async function measureGlbImport(
  files: { name: string; bytes: ArrayBuffer }[],
  settings: ImportSettings,
  honorFileUnits = true,
  signal?: AbortSignal,
): Promise<ImportResult> {
  return importModel({ files, settings, honorFileUnits, signal }, signal);
}

export function defaultGlbSettings(unit: LengthUnit = "m"): ImportSettings {
  return { unit, upAxis: "y", optimizerVersion: OPTIMIZER_VERSION };
}

export { assetIdForImport };
