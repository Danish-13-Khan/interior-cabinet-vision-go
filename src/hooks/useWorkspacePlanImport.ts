import { useState } from "react";
import type { LivingRoomPlanUnderlay } from "../domain/livingRoom/planUnderlay";
import {
  imageFileToUnderlay,
  PLAN_UNDERLAY_UNSUPPORTED_MESSAGE,
  planUnderlayFileKind,
} from "../domain/livingRoom/planUnderlayImport";
import type { BuildTool, StudioPanel } from "../components/livingRoomPlan/workspaceProps";

type PlanImportArgs = {
  roomWidthMm: number;
  onImportError: (message: string) => void;
  onSetPlanUnderlay: (underlay: LivingRoomPlanUnderlay) => void;
  onStudioPanel: (panel: StudioPanel) => void;
  onBuildTool: (tool: BuildTool) => void;
  onCommitDraft: () => void;
};

export function useWorkspacePlanImport(args: PlanImportArgs) {
  const [dwgImportFile, setDwgImportFile] = useState<File | null>(null);
  const [pdfImportFile, setPdfImportFile] = useState<File | null>(null);

  async function onImportUnderlay(file: File | null) {
    if (!file) return;
    args.onImportError("");
    setDwgImportFile(null);
    setPdfImportFile(null);
    const kind = planUnderlayFileKind(file);
    if (kind === "unsupported") {
      args.onImportError(PLAN_UNDERLAY_UNSUPPORTED_MESSAGE);
      return;
    }
    if (kind === "cad") {
      setDwgImportFile(file);
      return;
    }
    if (kind === "pdf") {
      setPdfImportFile(file);
      return;
    }
    try {
      const underlay = await imageFileToUnderlay(file, args.roomWidthMm);
      args.onSetPlanUnderlay(underlay);
      args.onStudioPanel("build");
      args.onCommitDraft();
    } catch (error) {
      args.onImportError(error instanceof Error ? error.message : "Plan import failed.");
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
    onImportUnderlay,
    cancelDwg: () => setDwgImportFile(null),
    confirmDwg,
    cancelPdf: () => setPdfImportFile(null),
    confirmPdf,
    failPdf: (message: string) => {
      setPdfImportFile(null);
      args.onImportError(message);
    },
  };
}
