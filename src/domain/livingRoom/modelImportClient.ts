import type { Size3Mm } from "../interiorProject";
import { assetIdForImport } from "../../workers/modelImport/identity";
import type { ImportRequest, ImportResult, ImportSettings, LengthUnit, UpAxis, WorkerResponse } from "../../workers/modelImport/protocol";
import { OPTIMIZER_VERSION } from "../../workers/modelImport/optimizerVersion";
import { decideImportRuntime, probeImportRuntime } from "../../workers/modelImport/spike";

/** Saved 1000 mm placements stay as they are. Measured size is only for a new import. */
export function dimensionsForPlacement(existing: Size3Mm | null | undefined, measured: Size3Mm): Size3Mm {
  return existing ?? measured;
}

function cancelled(): Error {
  return new DOMException("Import cancelled", "AbortError");
}

/** The worker itself failed (load, crash, clone, timeout, missing canvas). The main thread may retry. */
class WorkerUnavailable extends Error {}

const MIN_WORKER_TIMEOUT_MS = 60_000;
const WORKER_MS_PER_MB = 2_000;

function workerTimeoutMs(request: ImportRequest): number {
  const megabytes = request.files.reduce((sum, file) => sum + file.bytes.byteLength, 0) / (1024 * 1024);
  return Math.max(MIN_WORKER_TIMEOUT_MS, Math.ceil(megabytes * WORKER_MS_PER_MB));
}

function importWithWorker(request: ImportRequest, signal?: AbortSignal): Promise<ImportResult> {
  let worker: Worker;
  try {
    worker = new Worker(new URL("../../workers/modelImport/modelImport.worker.ts", import.meta.url), { type: "module" });
  } catch {
    return Promise.reject(new WorkerUnavailable("Import worker could not start"));
  }
  return new Promise((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = (settle: () => void) => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      worker.terminate();
      settle();
    };
    const onAbort = () => finish(() => reject(cancelled()));
    if (signal?.aborted) { onAbort(); return; }
    signal?.addEventListener("abort", onAbort, { once: true });
    timer = setTimeout(() => finish(() => reject(new WorkerUnavailable("Import worker timed out"))), workerTimeoutMs(request));
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => finish(() => {
      const data = event.data;
      if (data.ok) resolve(data.result);
      else reject(data.unsupported ? new WorkerUnavailable(data.error) : new Error(data.error || "Import failed"));
    });
    worker.onerror = () => finish(() => reject(new WorkerUnavailable("Import worker failed")));
    worker.onmessageerror = () => finish(() => reject(new WorkerUnavailable("Import worker reply could not be read")));
    const { signal: _signal, ...payload } = request;
    // Input is copied, not transferred, so a main-thread retry still has the bytes.
    try { worker.postMessage({ id: 1, request: payload }); } catch {
      finish(() => reject(new WorkerUnavailable("Import request could not be sent to the worker")));
    }
  });
}

async function importOnMainThread(request: ImportRequest): Promise<ImportResult> {
  const pipeline = await import("../../workers/modelImport/runImport");
  return pipeline.runImport(request);
}

/** Model errors from the worker are final. Only a worker that could not run falls back to the main thread. */
export async function importModel(request: ImportRequest, signal?: AbortSignal): Promise<ImportResult> {
  if (signal?.aborted) throw cancelled();
  const next = { ...request, signal };
  if (decideImportRuntime(await probeImportRuntime()) === "worker") {
    try { return await importWithWorker(next, signal); } catch (error) {
      if (signal?.aborted || !(error instanceof WorkerUnavailable)) throw error;
    }
  }
  if (signal?.aborted) throw cancelled();
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

export function defaultGlbSettings(unit: LengthUnit = "m", upAxis: UpAxis = "y"): ImportSettings {
  return { unit, upAxis, optimizerVersion: OPTIMIZER_VERSION };
}

export { assetIdForImport };
