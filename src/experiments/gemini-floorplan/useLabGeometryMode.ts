import { useState } from "react";
import {
  proposalForGeometryMode,
  type GeometryViewMode,
} from "./cleanProposalGeometry";
import type { GeminiFloorProposal } from "./proposalTypes";

/** Holds Vision/fixture source + Raw/CV-cleaned view for Phase 6A. */
export function useLabGeometryMode(initialMode: GeometryViewMode = "cleaned") {
  const [sourceProposal, setSourceProposal] = useState<GeminiFloorProposal | null>(null);
  const [proposal, setProposal] = useState<GeminiFloorProposal | null>(null);
  const [geometryMode, setGeometryModeState] = useState<GeometryViewMode>(initialMode);

  function clearGeometry() {
    setSourceProposal(null);
    setProposal(null);
  }

  function commitSource(next: GeminiFloorProposal, mode: GeometryViewMode = geometryMode) {
    setSourceProposal(next);
    setProposal(proposalForGeometryMode(next, mode));
  }

  function setGeometryMode(mode: GeometryViewMode) {
    setGeometryModeState(mode);
    if (sourceProposal) setProposal(proposalForGeometryMode(sourceProposal, mode));
  }

  return {
    sourceProposal,
    proposal,
    setProposal,
    geometryMode,
    setGeometryMode,
    commitSource,
    clearGeometry,
  };
}
