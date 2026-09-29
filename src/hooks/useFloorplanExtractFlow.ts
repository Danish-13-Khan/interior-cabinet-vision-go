import { useState } from "react";
import {
  canExtractFromUnderlay,
  extractFloorplan,
  underlayToFile,
  type ExtractionResult,
  type LiveSchemaStatus,
} from "../domain/floorplanExtract";
import type { LivingRoomPlanUnderlay } from "../domain/livingRoom/planUnderlay";

export type FloorplanExtractDraft = {
  draft: ExtractionResult;
  draftKey: string;
  liveSchema: LiveSchemaStatus;
};

export type FloorplanExtractLauncherState = {
  available: boolean;
  busy: boolean;
  error: string;
  onStart: () => void;
};

/** Underlay image → floor-plan service → review dialog draft. */
export function useFloorplanExtractFlow(underlay: LivingRoomPlanUnderlay | null) {
  const [draft, setDraft] = useState<FloorplanExtractDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    if (!canExtractFromUnderlay(underlay) || busy) return;
    setBusy(true);
    setError("");
    try {
      const ingest = await extractFloorplan(await underlayToFile(underlay));
      setDraft({ draft: ingest.draft, draftKey: `${underlay.fileName}:${Date.now()}`, liveSchema: ingest.liveSchema });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Floor-plan extraction failed.");
    } finally {
      setBusy(false);
    }
  }

  const launcher: FloorplanExtractLauncherState = {
    available: canExtractFromUnderlay(underlay),
    busy,
    error,
    onStart: () => void start(),
  };

  return {
    draft,
    launcher,
    close: () => setDraft(null),
  };
}
