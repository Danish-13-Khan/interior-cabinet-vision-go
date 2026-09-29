import type { ImportRequest, ImportResult } from "./protocol";
import { runImport } from "./runImport";

type RequestMessage = { id: number; request: ImportRequest };
type ResponseMessage = { id: number; result?: ImportResult; error?: string };

self.onmessage = (event: MessageEvent<RequestMessage>) => {
  const { id, request } = event.data;
  void runImport(request).then(
    (result) => {
      const message: ResponseMessage = { id, result };
      self.postMessage(message);
    },
    (error: unknown) => {
      const message: ResponseMessage = { id, error: error instanceof Error ? error.message : "Import failed" };
      self.postMessage(message);
    },
  );
};
