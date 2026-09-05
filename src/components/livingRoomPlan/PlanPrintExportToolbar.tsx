import type { ChangeEvent } from "react";
import type { PlanPrintLayers, PlanPrintSettings } from "../../domain/livingRoom";

const LAYER_TOGGLES: Array<{ key: keyof PlanPrintLayers; label: string; testId: string }> = [
  { key: "furniture", label: "Furniture", testId: "lr-print-layer-furniture" },
  { key: "dims", label: "Dims", testId: "lr-print-layer-dims" },
  { key: "referenceDims", label: "Ref dims", testId: "lr-print-layer-reference-dims" },
  { key: "labels", label: "Labels", testId: "lr-print-layer-labels" },
  { key: "marks", label: "Marks", testId: "lr-print-layer-marks" },
  { key: "grid", label: "Grid", testId: "lr-print-layer-grid" },
  { key: "underlay", label: "Underlay", testId: "lr-print-layer-underlay" },
  { key: "openings", label: "Openings", testId: "lr-print-layer-openings" },
];

export function PlanPrintExportToolbar({
  settings,
  exporting,
  onPreset,
  onLayer,
  onCompanyName,
  onLogo,
  onClearLogo,
  onExportPdf,
  onExportPng,
}: {
  settings: PlanPrintSettings;
  exporting?: boolean;
  onPreset: (audience: "sales" | "technical") => void;
  onLayer: (key: keyof PlanPrintLayers, value: boolean) => void;
  onCompanyName: (value: string) => void;
  onLogo: (dataUrl: string) => void;
  onClearLogo: () => void;
  onExportPdf: () => void;
  onExportPng: () => void;
}) {
  function onLogoFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/^image\/(png|jpeg|jpg|webp)$/i.test(file.type)) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onLogo(reader.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="lr-toolbar-group lr-print-export-toolbar" aria-label="Floor plan export" data-testid="lr-print-export-toolbar">
      <span>Print</span>
      <button
        type="button"
        className={settings.audience === "sales" ? "is-active" : ""}
        data-testid="lr-print-preset-sales"
        aria-pressed={settings.audience === "sales"}
        onClick={() => onPreset("sales")}
      >
        Sales
      </button>
      <button
        type="button"
        className={settings.audience === "technical" ? "is-active" : ""}
        data-testid="lr-print-preset-technical"
        aria-pressed={settings.audience === "technical"}
        onClick={() => onPreset("technical")}
      >
        Technical
      </button>
      {LAYER_TOGGLES.map((item) => (
        <label key={item.key} title={item.label}>
          <input
            type="checkbox"
            data-testid={item.testId}
            checked={settings.layers[item.key]}
            onChange={(event) => onLayer(item.key, event.target.checked)}
          />{" "}
          {item.label}
        </label>
      ))}
      <input
        aria-label="Company name"
        data-testid="lr-print-company-name"
        placeholder="Company"
        value={settings.companyName ?? ""}
        onChange={(event) => onCompanyName(event.target.value)}
        style={{ width: 88 }}
      />
      <label className="lr-print-logo-picker" title="Add company logo">
        <input type="file" accept="image/png,image/jpeg,image/webp" data-testid="lr-print-logo-input" onChange={onLogoFile} />
        {settings.logoDataUrl ? "Logo" : "Add logo"}
      </label>
      {settings.logoDataUrl ? (
        <>
          <img src={settings.logoDataUrl} alt="" className="lr-print-logo-thumb" data-testid="lr-print-logo-thumb" />
          <button type="button" data-testid="lr-print-logo-clear" onClick={onClearLogo}>Clear</button>
        </>
      ) : null}
      <button
        type="button"
        className="is-primary"
        data-testid="lr-export-floor-plan"
        disabled={exporting}
        onClick={onExportPdf}
        title="Download floor plan PDF"
      >
        {exporting ? "Exporting…" : "Export PDF"}
      </button>
      <button type="button" data-testid="lr-export-floor-plan-png" disabled={exporting} onClick={onExportPng}>
        PNG
      </button>
    </div>
  );
}
