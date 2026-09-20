import { useCallback, useState } from "react";
import type { LivingRoomPlanUnderlay } from "../domain/livingRoom/planUnderlay";
import {
  imageFileToUnderlay,
  PLAN_UNDERLAY_UNSUPPORTED_MESSAGE,
  planUnderlayFileKind,
} from "../domain/livingRoom/planUnderlayImport";

export function usePlanUnderlayImport(opts: {
  roomWidthMm: number;
  onSetPlanUnderlay: (underlay: LivingRoomPlanUnderlay) => void;
  onImportError: (message: string) => void;
  onImported: () => void;
}) {
  const [pdfImportFile, setPdfImportFile] = useState<File | null>(null);

  const { roomWidthMm, onSetPlanUnderlay, onImportError, onImported } = opts;
  const importUnderlay = useCallback(async (file: File | null) => {
    if (!file) return;
    onImportError("");
    const kind = planUnderlayFileKind(file);
    if (kind === "unsupported") {
      onImportError(PLAN_UNDERLAY_UNSUPPORTED_MESSAGE);
      return;
    }
    if (kind === "pdf") {
      setPdfImportFile(file);
      return;
    }
    try {
      const underlay = await imageFileToUnderlay(file, roomWidthMm);
      onSetPlanUnderlay(underlay);
      onImported();
    } catch (error) {
      onImportError(error instanceof Error ? error.message : "Plan import failed.");
    }
  }, [roomWidthMm, onSetPlanUnderlay, onImportError, onImported]);

  return { pdfImportFile, setPdfImportFile, importUnderlay };
}
