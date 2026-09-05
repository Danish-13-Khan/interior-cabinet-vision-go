import { useEffect, useState } from "react";
import { extractFloorPlanFromImage } from "./extractFloorPlan";
import { guardFloorplanImage } from "./imageGuards";
import { hasGeminiApiKeyConfigured } from "./labFlags";
import { buildLabStatus } from "./labStatus";
import { normalizeProposalToMm } from "./normalizeProposal";
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

  const hasKey = hasGeminiApiKeyConfigured();
  const status = buildLabStatus({
    hasKey,
    fileName,
    busy,
    hasProposal: Boolean(proposal),
    extractError,
  });

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function clearExtract() {
    setExtractError(null);
    setValidationErrors([]);
    setMetrics(null);
    setProposal(null);
    setRawText(null);
    setSelectedWallId(null);
    setSelectedRoomId(null);
    setCalibrateError(null);
  }

  function onFile(next: File | null) {
    clearExtract();
    if (!next) {
      setFile(null);
      setFileName(null);
      setUploadError(null);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    const guard = guardFloorplanImage(next);
    if (!guard.ok) {
      setUploadError(guard.error);
      setFile(null);
      setFileName(null);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    setUploadError(null);
    setFile(next);
    setFileName(next.name);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(next);
    });
  }

  async function onRunVision() {
    if (!hasKey) {
      setExtractError("API key not loaded. Put VITE_GEMINI_API_KEY in .env and restart npm run dev.");
      return;
    }
    if (!file) {
      setExtractError("Upload a floor-plan image first (or click “Use sample image”). Offline JSON alone is not enough.");
      return;
    }
    const guard = guardFloorplanImage(file);
    if (!guard.ok) {
      setUploadError(guard.error);
      return;
    }
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
      const blob = await res.blob();
      const sample = new File([blob], "rect-kitchen.png", { type: "image/png" });
      onFile(sample);
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
    hasKey,
    status,
    file,
    fileName,
    previewUrl,
    uploadError,
    busy,
    proposal,
    setProposal,
    rawText,
    extractError,
    validationErrors,
    metrics,
    selectedWallId,
    setSelectedWallId,
    selectedRoomId,
    setSelectedRoomId,
    calibrateError,
    setCalibrateError,
    onFile,
    onRunVision,
    onUseSampleImage,
    onLoadFixture,
  };
}
