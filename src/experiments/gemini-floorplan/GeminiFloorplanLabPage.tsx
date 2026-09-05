import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../../../styles/gemini-floorplan-lab.css";
import "../../../styles/gemini-floorplan-lab-panels.css";
import { extractFloorPlanFromImage } from "./extractFloorPlan";
import { guardFloorplanImage } from "./imageGuards";
import { LabStatusBar } from "./LabStatusBar";
import { hasGeminiApiKeyConfigured } from "./labFlags";
import { buildLabStatus } from "./labStatus";
import { normalizeProposalToMm } from "./normalizeProposal";
import { Placeholder3dPane } from "./Placeholder3dPane";
import { ProposalJsonPanel } from "./ProposalJsonPanel";
import type { GeminiFloorProposal, VisionUsageMetrics } from "./proposalTypes";
import {
  SAMPLE_L_ROOM_CM,
  SAMPLE_RECT_KITCHEN_MM,
} from "./sampleProposals";
import { UploadZone } from "./UploadZone";

export function GeminiFloorplanLabPage() {
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

  function onFile(next: File | null) {
    setExtractError(null);
    setValidationErrors([]);
    setMetrics(null);
    setProposal(null);
    setRawText(null);
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
    if (!file) return;
    const guard = guardFloorplanImage(file);
    if (!guard.ok) {
      setUploadError(guard.error);
      return;
    }
    setBusy(true);
    setExtractError(null);
    setValidationErrors([]);
    const result = await extractFloorPlanFromImage(file, guard.mimeType);
    setBusy(false);
    setMetrics(result.metrics ?? null);
    setRawText(result.rawText ?? null);
    if (result.ok) {
      setProposal(result.proposal);
      setExtractError(null);
      setValidationErrors([]);
    } else {
      setProposal(null);
      setExtractError(result.error);
      setValidationErrors(result.validationErrors ?? []);
    }
  }

  function onLoadFixture(id: string) {
    const sample = id === "l-cm" ? SAMPLE_L_ROOM_CM : SAMPLE_RECT_KITCHEN_MM;
    setProposal(normalizeProposalToMm(sample));
    setRawText(null);
    setExtractError(null);
    setValidationErrors([]);
    setMetrics({ latencyMs: 0, model: "offline-fixture", totalTokens: 0 });
  }

  return (
    <div className="gfl-page">
      <header className="gfl-top">
        <div>
          <p className="gfl-eyebrow">Lab · Phase 1</p>
          <h1>Gemini floor-plan Vision</h1>
        </div>
        <Link className="gfl-back" to="/">
          Back to site
        </Link>
      </header>
      <LabStatusBar status={status} />
      <div className="gfl-grid gfl-grid--3">
        <UploadZone
          fileName={fileName}
          previewUrl={previewUrl}
          uploadError={uploadError}
          onFile={onFile}
        />
        <ProposalJsonPanel
          proposal={proposal}
          rawText={rawText}
          error={extractError}
          validationErrors={validationErrors}
          metrics={metrics}
          busy={busy}
          hasKey={hasKey}
          canRunVision={Boolean(file) && hasKey}
          onRunVision={onRunVision}
          onLoadFixture={onLoadFixture}
        />
        <Placeholder3dPane />
      </div>
    </div>
  );
}
