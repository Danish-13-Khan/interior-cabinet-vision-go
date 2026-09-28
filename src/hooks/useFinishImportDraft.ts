import { useState } from "react";
import {
  stageFinishImportFile,
  stageFinishImportUrl,
  stageManufacturerFinish,
  type FinishImportDraft,
} from "../domain/livingRoom";

/** Staged (not yet applied) finish import from a file, URL or manufacturer catalogue. */
export function useFinishImportDraft() {
  const [draft, setDraft] = useState<FinishImportDraft | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [urlBusy, setUrlBusy] = useState(false);

  function failImport(error: unknown) {
    setDraft(null);
    setImportError(error instanceof Error ? error.message : "Could not import finish.");
  }

  function stageImport(file: File) {
    if (urlBusy) return;
    setImportError(null);
    void stageFinishImportFile(file).then(setDraft).catch(failImport);
  }

  function stageImportUrl(url: string) {
    setImportError(null);
    setDraft(null);
    setUrlBusy(true);
    void stageFinishImportUrl(url).then(setDraft).catch(failImport).finally(() => setUrlBusy(false));
  }

  function stageCatalogue(finishId: string) {
    if (urlBusy) return;
    setImportError(null);
    try { setDraft(stageManufacturerFinish(finishId)); }
    catch (error) { failImport(error); }
  }

  function patchDraft(patch: Partial<FinishImportDraft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }

  function clear() {
    setDraft(null);
    setImportError(null);
  }

  return { draft, importError, urlBusy, stageImport, stageImportUrl, stageCatalogue, patchDraft, clear };
}
