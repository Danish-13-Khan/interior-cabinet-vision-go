import { useEffect, useState } from "react";
import { extractFloorPlanFromImage } from "./extractFloorPlan";
import { guardFloorplanImage } from "./imageGuards";
import { hasGeminiVisionConfigured } from "./labFlags";
import { buildLabStatus } from "./labStatus";
import { resolveLabUpload } from "./labUpload";
import { normalizeProposalToMm } from "./normalizeProposal";
import { rasterizePdfPageToPng, type PdfInfo } from "./pdfPageRaster";
import type { GeminiFloorProposal, VisionUsageMetrics } from "./proposalTypes";
import { SAMPLE_L_ROOM_CM, SAMPLE_RECT_KITCHEN_MM } from "./sampleProposals";

export function useGeminiFloorplanLab() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [proposal, setProposal] = useState<GeminiFloorProposal | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<VisionUsageMetrics | null>(null);
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [calibrateError, setCalibrateError] = useState<string | null>(null);
  const [pdfInfo, setPdfInfo] = useState<PdfInfo | null>(null);
  const [pdfPage, setPdfPage] = useState(1);
  const visionReady = hasGeminiVisionConfigured();
  const status = buildLabStatus({
    hasKey: visionReady, fileName, busy, hasProposal: Boolean(proposal), extractError,
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
    setProposal(null);
    setRawText(null);
    setSelectedWallId(null);
    setSelectedRoomId(null);
    setCalibrateError(null);
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
      setProposal(result.proposal);
      setSelectedWallId(result.proposal.walls[0]?.id ?? null);
      setSelectedRoomId(result.proposal.rooms[0]?.id ?? null);
      setExtractError(null);
      setValidationErrors([]);
    } else {
      setProposal(null);
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
    const sample = id === "l-cm" ? SAMPLE_L_ROOM_CM : SAMPLE_RECT_KITCHEN_MM;
    const next = normalizeProposalToMm(sample);
    setProposal(next);
    setSelectedWallId(next.walls[0]?.id ?? null);
    setSelectedRoomId(next.rooms[0]?.id ?? null);
    setRawText(null);
    setExtractError(null);
    setValidationErrors([]);
    setCalibrateError(null);
    setMetrics({ latencyMs: 0, model: "offline-fixture", totalTokens: 0 });
  }

  return {
    hasKey: visionReady, status, file, fileName, previewUrl, uploadError, busy, proposal,
    setProposal, rawText, extractError, validationErrors, metrics, selectedWallId,
    setSelectedWallId, selectedRoomId, setSelectedRoomId, calibrateError, setCalibrateError,
    pdfInfo, pdfPage, onFile, onSelectPdfPage, onRunVision, onUseSampleImage, onLoadFixture,
  };
}
