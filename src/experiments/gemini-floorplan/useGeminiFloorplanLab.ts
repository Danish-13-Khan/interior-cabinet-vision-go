import { useEffect, useState } from "react";
import type { GeometryViewMode } from "./cleanProposalGeometry";
import { extractFloorPlanFromImage } from "./extractFloorPlan";
import { guardFloorplanImage } from "./imageGuards";
import { hasGeminiVisionConfigured } from "./labFlags";
import { buildLabStatus } from "./labStatus";
import { resolveLabUpload } from "./labUpload";
import { normalizeProposalToMm } from "./normalizeProposal";
import { rasterizePdfPageToPng, type PdfInfo } from "./pdfPageRaster";
import type { GeminiFloorProposal, VisionUsageMetrics } from "./proposalTypes";
import { SAMPLE_L_ROOM_CM, SAMPLE_RECT_KITCHEN_MM } from "./sampleProposals";
import { useLabGeometryMode } from "./useLabGeometryMode";

export function useGeminiFloorplanLab() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cvBusy, setCvBusy] = useState(false);
  const [rawText, setRawText] = useState<string | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<VisionUsageMetrics | null>(null);
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [calibrateError, setCalibrateError] = useState<string | null>(null);
  const [pdfInfo, setPdfInfo] = useState<PdfInfo | null>(null);
  const [pdfPage, setPdfPage] = useState(1);
  const geom = useLabGeometryMode("cleaned");
  const visionReady = hasGeminiVisionConfigured();
  const status = buildLabStatus({
    hasKey: visionReady, fileName, busy: busy || cvBusy,
    hasProposal: Boolean(geom.proposal), extractError,
  });

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  function setImageFile(next: File) {
    setPdfInfo(null);
    setUploadError(null);
    setFile(next);
    setFileName(next.name);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(next);
    });
  }

  function resetExtract() {
    setExtractError(null);
    setValidationErrors([]);
    setMetrics(null);
    geom.clearGeometry();
    setRawText(null);
    setSelectedWallId(null);
    setSelectedRoomId(null);
    setCalibrateError(null);
  }

  function selectFrom(next: GeminiFloorProposal) {
    setSelectedWallId(next.walls[0]?.id ?? null);
    setSelectedRoomId(next.rooms[0]?.id ?? null);
  }

  async function applyProposal(next: GeminiFloorProposal) {
    if (geom.geometryMode === "cv" || geom.geometryMode === "model") {
      geom.commitSource(next, "cleaned");
      setCvBusy(true);
      const view = await geom.setGeometryMode(geom.geometryMode, file, fileName);
      setCvBusy(false);
      if (view) selectFrom(view);
      return;
    }
    selectFrom(geom.commitSource(next));
  }

  async function setGeometryMode(mode: GeometryViewMode) {
    if (mode === "cv" || mode === "model") setCvBusy(true);
    const view = await geom.setGeometryMode(mode, file, fileName);
    setCvBusy(false);
    if (view) selectFrom(view);
  }

  async function onFile(next: File | null) {
    resetExtract();
    setPdfInfo(null);
    if (!next) {
      setFile(null);
      setFileName(null);
      setUploadError(null);
      setPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
      return;
    }
    const resolved = await resolveLabUpload(next);
    if (resolved.kind === "error") {
      setUploadError(resolved.error);
      setFile(null);
      setFileName(null);
      setPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
      return;
    }
    if (resolved.kind === "pdf") {
      setPdfInfo(resolved.info);
      setPdfPage(1);
      setFile(null);
      setFileName(next.name);
      setUploadError(null);
      setPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
      return;
    }
    setImageFile(resolved.file);
  }

  async function onSelectPdfPage(page: number) {
    if (!pdfInfo) return;
    setBusy(true);
    setUploadError(null);
    try {
      setPdfPage(page);
      setImageFile(await rasterizePdfPageToPng(pdfInfo.bytes, page, pdfInfo.fileName));
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "PDF page raster failed");
    } finally {
      setBusy(false);
    }
  }

  async function onRunVision() {
    if (!visionReady) {
      setExtractError("Vision unavailable. Add GEMINI_API_KEY to .env and restart Vite (proxy).");
      return;
    }
    if (!file) {
      setExtractError("Upload an image or rasterize a PDF page first.");
      return;
    }
    const guard = guardFloorplanImage(file);
    if (!guard.ok) { setUploadError(guard.error); return; }
    setBusy(true);
    setExtractError(null);
    setValidationErrors([]);
    setCalibrateError(null);
    const result = await extractFloorPlanFromImage(file, guard.mimeType);
    setBusy(false);
    setMetrics(result.metrics ?? null);
    setRawText(result.rawText ?? null);
    if (result.ok) {
      await applyProposal(result.proposal);
      setExtractError(null);
      setValidationErrors([]);
    } else {
      geom.clearGeometry();
      setExtractError(result.error);
      setValidationErrors(result.validationErrors ?? []);
    }
  }

  async function onUseSampleImage() {
    setExtractError(null);
    setUploadError(null);
    try {
      const res = await fetch("/experiments/gemini-floorplan/fixtures/rect-kitchen.png");
      if (!res.ok) throw new Error(`Could not load sample image (${res.status})`);
      setImageFile(new File([await res.blob()], "rect-kitchen.png", { type: "image/png" }));
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Could not load sample image");
    }
  }

  function onLoadFixture(id: string) {
    void applyProposal(normalizeProposalToMm(id === "l-cm" ? SAMPLE_L_ROOM_CM : SAMPLE_RECT_KITCHEN_MM));
    setRawText(null);
    setExtractError(null);
    setValidationErrors([]);
    setCalibrateError(null);
    setMetrics({ latencyMs: 0, model: "offline-fixture", totalTokens: 0 });
  }

  return {
    hasKey: visionReady, status, file, fileName, previewUrl, uploadError, busy: busy || cvBusy,
    cvBusy, proposal: geom.proposal, setProposal: geom.setProposal,
    geometryMode: geom.geometryMode, setGeometryMode, cvNote: geom.cvNote,
    hasSourceProposal: Boolean(geom.sourceProposal),
    rawText, extractError, validationErrors, metrics,
    selectedWallId, setSelectedWallId, selectedRoomId, setSelectedRoomId,
    calibrateError, setCalibrateError, pdfInfo, pdfPage,
    onFile, onSelectPdfPage, onRunVision, onUseSampleImage, onLoadFixture,
  };
}
