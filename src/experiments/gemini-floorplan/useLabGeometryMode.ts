import { useState } from "react";
import { buildClassicalCvHybrid } from "./classicalCvHybrid";
import { proposalForGeometryMode } from "./cleanProposalGeometry";
import type { GeometryViewMode } from "./geometryMode";
import type { GeminiFloorProposal } from "./proposalTypes";

/** Vision/fixture source + Raw / 6A cleaned / 6B classical CV views. */
export function useLabGeometryMode(initialMode: GeometryViewMode = "cleaned") {
  const [sourceProposal, setSourceProposal] = useState<GeminiFloorProposal | null>(null);
  const [proposal, setProposal] = useState<GeminiFloorProposal | null>(null);
  const [geometryMode, setGeometryModeState] = useState<GeometryViewMode>(initialMode);
  const [cvNote, setCvNote] = useState<string | null>(null);

  function clearGeometry() {
    setSourceProposal(null);
    setProposal(null);
    setCvNote(null);
  }

  function commitSource(next: GeminiFloorProposal, mode: GeometryViewMode = geometryMode) {
    setSourceProposal(next);
    if (mode === "cv") {
      const cleaned = proposalForGeometryMode(next, "cleaned");
      setProposal(cleaned);
      setCvNote("Running classical CV when image is available…");
      return cleaned;
    }
    setCvNote(null);
    const view = proposalForGeometryMode(next, mode);
    setProposal(view);
    return view;
  }

  async function setGeometryMode(
    mode: GeometryViewMode,
    imageFile: File | null,
  ): Promise<GeminiFloorProposal | null> {
    setGeometryModeState(mode);
    if (!sourceProposal) return null;
    if (mode !== "cv") {
      setCvNote(null);
      const view = proposalForGeometryMode(sourceProposal, mode);
      setProposal(view);
      return view;
    }
    const result = await buildClassicalCvHybrid(sourceProposal, imageFile);
    setProposal(result.proposal);
    setCvNote(result.usedCv ? "Classical CV walls applied." : result.reason ?? "CV fallback.");
    return result.proposal;
  }

  return {
    sourceProposal,
    proposal,
    setProposal,
    geometryMode,
    setGeometryMode,
    commitSource,
    clearGeometry,
    cvNote,
  };
}
