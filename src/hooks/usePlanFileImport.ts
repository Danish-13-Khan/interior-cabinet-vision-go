import { useEffect, useRef, useState } from "react";
import { imageFileToUnderlay, isPdfFile } from "../domain/livingRoom/planUnderlayImport";
import {
  assertExtractionShape,
  classifyPlanUpload,
  extractFloorplan,
  planImportMismatchMessage,
  stampImportWallsScale,
  type ExtractionResult,
  type LiveSchemaStatus,
} from "../domain/floorplanExtract";
import type { InteriorProject } from "../domain/interiorProject";
import type { LivingRoomPlanUnderlay } from "../domain/livingRoom/planUnderlay";

type Args = {
  project: InteriorProject | null | undefined;
  roomWidthMm: number;
  onSetPlanUnderlay: (underlay: LivingRoomPlanUnderlay) => void;
  onImportError: (message: string) => void;
  onStudioPanel: (panel: "build") => void;
  commitDraft: () => void;
};

export function usePlanFileImport(args: Args) {
  const { project, roomWidthMm, onSetPlanUnderlay, onImportError, onStudioPanel, commitDraft } = args;
  const [extractDraft, setExtractDraft] = useState<ExtractionResult | null>(null);
  const [extractStatus, setExtractStatus] = useState<{ loading: boolean; message: string } | null>(null);
  const [extractDraftKey, setExtractDraftKey] = useState(0);
  const [extractLiveSchema, setExtractLiveSchema] = useState<LiveSchemaStatus | null>(null);
  const [lastAppliedExtract, setLastAppliedExtract] = useState<ExtractionResult | null>(null);
  const extractRequestIdRef = useRef(0);
  const [pdfImportFile, setPdfImportFile] = useState<File | null>(null);

  useEffect(() => {
    const raw = project?.extensions?.floorplanExtractDraft;
    if (!raw) {
      setLastAppliedExtract(null);
      return;
    }
    try {
      setLastAppliedExtract(assertExtractionShape(raw));
    } catch {
      setLastAppliedExtract(null);
    }
  }, [project?.id, project?.extensions?.floorplanExtractAppliedAt, project?.extensions?.floorplanExtractDraft]);

  function beginRequest() {
    const requestId = extractRequestIdRef.current + 1;
    extractRequestIdRef.current = requestId;
    setExtractDraft(null);
    setExtractLiveSchema(null);
    setExtractStatus(null);
    onImportError("");
    return requestId;
  }

  async function importUnderlay(file: File | null) {
    if (!file) return;
    const requestId = beginRequest();
    const kind = classifyPlanUpload(file);
    const mismatch = planImportMismatchMessage(kind, "underlay");
    if (mismatch) {
      onImportError(mismatch);
      return;
    }
    if (isPdfFile(file) || kind === "underlay-pdf") {
      setPdfImportFile(file);
      return;
    }
    try {
      const underlay = await imageFileToUnderlay(file, roomWidthMm);
      if (requestId !== extractRequestIdRef.current) return;
      onSetPlanUnderlay(underlay);
      onStudioPanel("build");
      commitDraft();
    } catch (error) {
      if (requestId !== extractRequestIdRef.current) return;
      const message = error instanceof Error ? error.message : "Plan underlay import failed.";
      onImportError(message);
    }
  }

  async function importWalls(file: File | null) {
    if (!file) return;
    const requestId = beginRequest();
    const kind = classifyPlanUpload(file);
    const mismatch = planImportMismatchMessage(kind, "import-walls");
    if (mismatch) {
      onImportError(mismatch);
      setExtractStatus({ loading: false, message: mismatch });
      return;
    }
    const stillCurrent = () => requestId === extractRequestIdRef.current;
    setExtractStatus({
      loading: true,
      message: `Reading ${file.name} into a review draft… This can take up to two minutes. Keep this page open.`,
    });
    try {
      const lower = file.name.toLowerCase();
      // 0.001 is a sidecar parse hint (mm drawing units), not trusted millwork scale.
      const pixel_scale = lower.endsWith(".svg") || lower.endsWith(".dxf") ? 0.001 : undefined;
      const ingest = await extractFloorplan(file, pixel_scale != null ? { pixel_scale } : {});
      if (!stillCurrent()) return;
      setExtractDraft(stampImportWallsScale(ingest.draft, pixel_scale != null)); // fresh upload, not reopen
      setExtractLiveSchema(ingest.liveSchema);
      setExtractDraftKey(requestId);
      setExtractStatus(null);
      onStudioPanel("build");
      commitDraft();
    } catch (error) {
      if (!stillCurrent()) return;
      const message = error instanceof Error ? error.message : "Wall import failed.";
      onImportError(message);
      setExtractStatus({ loading: false, message });
    }
  }

  return {
    extractDraft,
    extractStatus,
    extractDraftKey,
    extractLiveSchema,
    lastAppliedExtract,
    pdfImportFile,
    importUnderlay,
    importWalls,
    setPdfImportFile,
    setExtractDraft,
    setExtractLiveSchema,
    setExtractStatus,
    setExtractDraftKey,
    setLastAppliedExtract,
  };
}

export type PlanFileImportApi = ReturnType<typeof usePlanFileImport>;
