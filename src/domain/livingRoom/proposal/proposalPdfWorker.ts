import { GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";

type NodeCreateRequire = (url: string) => { resolve: (id: string) => string };

/**
 * PDF.js worker for Node (tests, proof scripts), resolved through
 * `createRequire`. A browser never gets here: the plan importer sets the
 * bundled worker first, and the variable module name keeps Vite from
 * resolving `node:module`.
 */
export async function ensurePdfWorker() {
  if (GlobalWorkerOptions.workerSrc) return;
  const nodeModule = "node:module";
  const { createRequire } = (await import(/* @vite-ignore */ nodeModule)) as { createRequire: NodeCreateRequire };
  GlobalWorkerOptions.workerSrc = createRequire(import.meta.url).resolve(
    "pdfjs-dist/legacy/build/pdf.worker.mjs",
  );
}
