import { useState } from "react";
import type { InteriorProject } from "../../domain/interiorProject";
import {
  applyPlanPrintPresetToProject,
  captureLivePlanSvg,
  exportPlanSheetPdf,
  exportPlanSheetPngBlob,
  exportPlanViewBoxForProject,
  planSheetFileBase,
  readPlanPrintSettings,
  setPlanPrintSettings,
  setPlanMarksSettings,
  type PlanPrintLayers,
} from "../../domain/livingRoom";
import { enqueueBrowserDownload } from "../../platform/browserDownloadQueue";
import { PlanPrintExportToolbar } from "./PlanPrintExportToolbar";

export function PlanPrintExportControls({
  project,
  onPatchDocument,
}: {
  project: InteriorProject;
  onPatchDocument: (
    update: (current: InteriorProject) => InteriorProject,
    status: string,
  ) => void;
}) {
  const settings = readPlanPrintSettings(project);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function capturePlanSvg(): string {
    const svg = document.querySelector<SVGSVGElement>(".lr-plan-svg");
    if (!svg) throw new Error("Plan canvas not ready.");
    const viewBox = exportPlanViewBoxForProject(project);
    return captureLivePlanSvg(svg, settings.layers, viewBox);
  }

  async function runExport(format: "pdf" | "png") {
    setExporting(true);
    setMessage(null);
    try {
      const planSvg = capturePlanSvg();
      const base = planSheetFileBase(project, settings);
      if (format === "pdf") {
        const blob = await exportPlanSheetPdf({ project, planSvg, settings });
        await enqueueBrowserDownload(blob, `${base}.pdf`);
        setMessage("Exported floor plan PDF.");
      } else {
        const blob = await exportPlanSheetPngBlob({ project, planSvg, settings });
        await enqueueBrowserDownload(blob, `${base}.png`);
        setMessage("Exported floor plan PNG.");
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Export failed.";
      setMessage(`Floor plan export failed: ${detail}`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <PlanPrintExportToolbar
        settings={settings}
        exporting={exporting}
        onPreset={(audience) => {
          onPatchDocument(
            (current) => {
              const next = applyPlanPrintPresetToProject(current, audience);
              const layers = readPlanPrintSettings(next).layers;
              return setPlanMarksSettings(next, {
                enabled: layers.marks,
                audience,
              });
            },
            audience === "technical" ? "Technical print preset." : "Sales print preset.",
          );
        }}
        onLayer={(key, value) => {
          onPatchDocument(
            (current) => {
              const next = setPlanPrintSettings(current, { layers: { [key]: value } as Partial<PlanPrintLayers> });
              if (key === "marks") {
                return setPlanMarksSettings(next, { enabled: value });
              }
              return next;
            },
            value ? `Show ${key} on print.` : `Hide ${key} on print.`,
          );
        }}
        onCompanyName={(companyName) => {
          onPatchDocument(
            (current) => setPlanPrintSettings(current, { companyName }),
            "Updated company name on plan sheet.",
          );
        }}
        onLogo={(logoDataUrl) => {
          onPatchDocument(
            (current) => setPlanPrintSettings(current, { logoDataUrl }),
            "Added logo to plan sheet.",
          );
        }}
        onClearLogo={() => {
          onPatchDocument(
            (current) => setPlanPrintSettings(current, { logoDataUrl: null }),
            "Cleared plan sheet logo.",
          );
        }}
        onExportPdf={() => void runExport("pdf")}
        onExportPng={() => void runExport("png")}
      />
      {message ? (
        <span className="lr-print-export-status" data-testid="lr-export-floor-plan-status">{message}</span>
      ) : null}
    </>
  );
}
