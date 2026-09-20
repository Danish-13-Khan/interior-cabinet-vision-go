import { useEffect, useRef, useState } from "react";
import {
  assertExtractionShape,
  extractFloorplan,
  type ExtractionResult,
  type LiveSchemaStatus,
} from "../domain/floorplanExtract";
import type { InteriorProject } from "../domain/interiorProject";
import type { LivingRoomPlanUnderlay } from "../domain/livingRoom/planUnderlay";
import { imageFileToUnderlay, isDwgFile, isPdfFile } from "../domain/livingRoom/planUnderlayImport";
import type { BuildTool, StudioPanel } from "../components/livingRoomPlan/workspaceProps";

export type ExtractStatus = { loading: boolean; message: string };

type PlanImportArgs = {
  project: InteriorProject | null;
  roomWidthMm: number;
  onImportError: (message: string) => void;
  onSetPlanUnderlay: (underlay: LivingRoomPlanUnderlay) => void;
  onStudioPanel: (panel: StudioPanel) => void;
  onBuildTool: (tool: BuildTool) => void;
  onCommitDraft: () => void;
  onPatchDocument: (
    update: (current: InteriorProject) => InteriorProject,
    status: string,
    cabinetIds?: string[],
  ) => void;
};

export function useWorkspacePlanImport(args: PlanImportArgs) {
  const [extractDraft, setExtractDraft] = useState<ExtractionResult | null>(null);
  const [extractStatus, setExtractStatus] = useState<ExtractStatus | null>(null);
  const [extractDraftKey, setExtractDraftKey] = useState(0);
  const [extractLiveSchema, setExtractLiveSchema] = useState<LiveSchemaStatus | null>(null);
  const [lastAppliedExtract, setLastAppliedExtract] = useState<ExtractionResult | null>(null);
  const extractRequestIdRef = useRef(0);
  const [dwgImportFile, setDwgImportFile] = useState<File | null>(null);
  const [pdfImportFile, setPdfImportFile] = useState<File | null>(null);

  useEffect(() => {
    const raw = args.project?.extensions?.floorplanExtractDraft;
    if (!raw) {
      setLastAppliedExtract(null);
      return;
    }
    try {
      setLastAppliedExtract(assertExtractionShape(raw));
    } catch {
      setLastAppliedExtract(null);
    }
  }, [args.project?.id, args.project?.extensions?.floorplanExtractAppliedAt, args.project?.extensions?.floorplanExtractDraft]);

  async function onImportUnderlay(file: File | null) {
    if (!file) return;
    const requestId = extractRequestIdRef.current + 1;
    extractRequestIdRef.current = requestId;
    setExtractDraft(null);
    setExtractLiveSchema(null);
    setExtractStatus(null);
    args.onImportError("");
    setDwgImportFile(null);
    setPdfImportFile(null);
    if (isDwgFile(file)) {
      setDwgImportFile(file);
      return;
    }
    if (isPdfFile(file)) {
      setPdfImportFile(file);
      return;
    }
    await importImageOrExtract(file, requestId);
  }

  async function importImageOrExtract(file: File, requestId: number) {
    const lower = file.name.toLowerCase();
    const vectorOrRaster = /\.(png|jpe?g|gif|webp|svg|dxf)$/.test(lower)
      || file.type.startsWith("image/")
      || file.type.includes("svg")
      || file.type.includes("dxf");
    const stillCurrent = () => requestId === extractRequestIdRef.current;
    if (vectorOrRaster) {
      setExtractStatus({
        loading: true,
        message: `Generating editable rooms and walls from ${file.name}… This can take up to two minutes. Keep this page open.`,
      });
    }
    try {
      if (!lower.endsWith(".svg") && !lower.endsWith(".dxf") && file.type.startsWith("image/")) {
        const underlay = await imageFileToUnderlay(file, args.roomWidthMm);
        if (!stillCurrent()) return;
        args.onSetPlanUnderlay(underlay);
      }
      if (vectorOrRaster) {
        const pixel_scale = lower.endsWith(".svg") || lower.endsWith(".dxf") ? 0.001 : undefined;
        const ingest = await extractFloorplan(file, pixel_scale != null ? { pixel_scale } : {});
        if (!stillCurrent()) return;
        setExtractDraft(ingest.draft);
        setExtractLiveSchema(ingest.liveSchema);
        setExtractDraftKey(requestId);
        setExtractStatus(null);
      }
      if (!stillCurrent()) return;
      args.onStudioPanel("build");
      args.onCommitDraft();
    } catch (error) {
      if (!stillCurrent()) return;
      const message = error instanceof Error ? error.message : "Plan import failed.";
      args.onImportError(message);
      setExtractStatus({ loading: false, message });
    }
  }

  function confirmDwg(underlay: LivingRoomPlanUnderlay) {
    setDwgImportFile(null);
    args.onSetPlanUnderlay(underlay);
    args.onStudioPanel("build");
    args.onBuildTool("calibrate-underlay");
  }

  function confirmPdf(underlay: LivingRoomPlanUnderlay) {
    setPdfImportFile(null);
    args.onSetPlanUnderlay(underlay);
    args.onStudioPanel("build");
    args.onCommitDraft();
  }

  return {
    dwgImportFile,
    pdfImportFile,
    extractDraft,
    extractStatus,
    extractDraftKey,
    extractLiveSchema,
    lastAppliedExtract,
    onImportUnderlay,
    cancelDwg: () => setDwgImportFile(null),
    confirmDwg,
    cancelPdf: () => setPdfImportFile(null),
    confirmPdf,
    failPdf: (message: string) => {
      setPdfImportFile(null);
      args.onImportError(message);
    },
    reopenExtract: () => {
      if (!lastAppliedExtract) return;
      setExtractDraft(lastAppliedExtract);
      setExtractLiveSchema({
        state: "structural-fallback",
        message: "Re-opened saved extract — re-run patch/extract to refresh live schema",
      });
      setExtractDraftKey((key) => key + 1);
    },
    dismissExtractStatus: () => setExtractStatus(null),
    closeExtract: () => {
      setExtractDraft(null);
      setExtractLiveSchema(null);
    },
    applyExtract: (next: InteriorProject, appliedDraft: ExtractionResult, status: string) => {
      args.onPatchDocument(() => next, status);
      setLastAppliedExtract(appliedDraft);
      setExtractDraft(null);
      setExtractLiveSchema(null);
    },
  };
}
