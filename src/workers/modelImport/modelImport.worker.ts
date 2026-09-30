import type { ImportRequest, WorkerResponse } from "./protocol";
import { runImport } from "./runImport";

type RequestMessage = { id: number; request: ImportRequest };

self.onmessage = (event: MessageEvent<RequestMessage>) => {
  const { id, request } = event.data;
  void runImport(request).then(
    (result) => {
      // Without OffscreenCanvas the exporter cannot draw textures here; the main thread can.
      if (!result.glb && typeof OffscreenCanvas === "undefined") {
        const message: WorkerResponse = { id, ok: false, error: "No canvas in the import worker", unsupported: true };
        self.postMessage(message);
        return;
      }
      const message: WorkerResponse = { id, ok: true, result };
      const transfer = [result.glb, result.thumbnail].filter((buffer): buffer is ArrayBuffer => buffer instanceof ArrayBuffer);
      self.postMessage(message, { transfer });
    },
    (error: unknown) => {
      const message: WorkerResponse = { id, ok: false, error: error instanceof Error ? error.message : "Import failed" };
      self.postMessage(message);
    },
  );
};
