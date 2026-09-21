import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDialogFocusTrap } from "../../hooks/useDialogFocusTrap";
import { dwgPreviewDataUrl, DWG_GEOMETRY_DESCRIPTION, type DwgPreview } from "../../domain/livingRoom/dwgGeometry";
import { dwgPlanDimensionsMm } from "../../domain/livingRoom/dwgUnits";
import type { LivingRoomPlanUnderlay } from "../../domain/livingRoom/planUnderlay";

function omittedReport(preview: DwgPreview) {
  return Object.entries(preview.omitted).map(([type, count]) => `${type}: ${count}`).join("; ");
}

export function PlanUnderlayDwgDialog({ file, onCancel, onConfirm }: {
  file: File; onCancel: () => void; onConfirm: (value: LivingRoomPlanUnderlay) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  useDialogFocusTrap(true, root, onCancel);
  const [preview, setPreview] = useState<DwgPreview | null>(null);
  const [error, setError] = useState("");
  const [scale, setScale] = useState("");
  const [hidden, setHidden] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    let active = true;
    const worker = new Worker(new URL("../../domain/livingRoom/dwgImport.worker.ts", import.meta.url), { type: "module" });
    const fail = (message: string) => { if (active) setError(message); worker.terminate(); };
    const timeout = window.setTimeout(() => fail("DWG import timed out. Try a smaller drawing."), 120000);
    worker.onmessage = ({ data }: MessageEvent<{ preview?: DwgPreview; error?: string }>) => {
      if (!active) return;
      window.clearTimeout(timeout);
      worker.terminate();
      if (data.error) setError(data.error);
      else if (data.preview) {
        setPreview(data.preview);
        setHidden(data.preview.layers.filter((layer) => !layer.visible).map((layer) => layer.name));
        setScale(data.preview.mmPerUnit?.toString() ?? "");
      }
    };
    worker.onerror = () => fail("The DWG reader could not start or ran out of memory. Try a smaller drawing.");
    if (file.size > 50 * 1024 * 1024) fail("DWG files must be 50 MB or smaller.");
    else void file.arrayBuffer()
      .then((buffer) => { if (active) worker.postMessage({ buffer, name: file.name }, [buffer]); })
      .catch(() => fail("Could not read the selected file."));
    return () => { active = false; window.clearTimeout(timeout); worker.terminate(); };
  }, [file]);
  const fittedPreview = useMemo(() => preview && showAll && preview.fullBounds
    ? { ...preview, bounds: preview.fullBounds } : preview, [preview, showAll]);
  const dataUrl = useMemo(() => fittedPreview ? dwgPreviewDataUrl(fittedPreview, hidden) : "", [fittedPreview, hidden]);
  let dimensions: { widthMm: number; heightMm: number } | null = null;
  try { if (fittedPreview) dimensions = dwgPlanDimensionsMm(fittedPreview.bounds, Number(scale)); } catch { /* User is entering scale. */ }
  const confirmDisabled = !preview || !dimensions || hidden.length === preview.layers.length;
  return createPortal(
    <div className="app-confirm-backdrop lr-underlay-dwg-backdrop" data-testid="lr-underlay-dwg-dialog-backdrop" onKeyDown={(event) => event.stopPropagation()}>
      <div
        ref={root}
        className="app-confirm-dialog lr-underlay-dwg-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dwg-import-title"
        data-testid="lr-underlay-dwg-dialog"
        tabIndex={-1}
        onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); onCancel(); } }}
      >
        <strong id="dwg-import-title">Import DWG background</strong>
        <p>{file.name}</p>
        {error ? <p className="lr-underlay-pdf-error" role="alert">{error}</p> : null}
        {!error && !preview ? <p role="status">Reading DWG locally…</p> : null}
        {!error && preview ? (
          <>
            <p>{preview.rendered} entities drawn. {DWG_GEOMETRY_DESCRIPTION}</p>
            {Object.keys(preview.omitted).length > 0 ? (
              <p role="status">Missing content: {omittedReport(preview)}. Unsupported content is absent. Check against the original drawing.</p>
            ) : null}
            {preview.warnings.map((warning) => <p key={warning}>{warning}</p>)}
            <label className="app-prompt-field">
              Millimeters per drawing unit
              <input aria-label="Millimeters per drawing unit" type="number" min="0" step="any" value={scale} onChange={(event) => setScale(event.target.value)} />
            </label>
            <p>
              {preview.mmPerUnit ? "Initial scale comes from DWG units." : "Drawing units are missing or unsupported. Enter the correct scale."}
              {" "}Verify a known distance with Calibrate after import.
            </p>
            {preview.fullBounds && JSON.stringify(preview.bounds) !== JSON.stringify(preview.fullBounds) &&
              <label><input type="checkbox" checked={showAll} onChange={event => { setShowAll(event.target.checked); setZoom(1); }} /> Show all geometry, including distant objects</label>}
            <label className="app-prompt-field">
              Preview zoom
              <input aria-label="Preview zoom" type="range" min="1" max="5" step="0.25" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
            </label>
            <div className="lr-underlay-dwg-preview">
              <img alt="DWG tracing preview" src={dataUrl} style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }} />
            </div>
            <fieldset className="lr-underlay-dwg-layers">
              <legend>Visible layers</legend>
              {preview.layers.map((layer) => (
                <label key={layer.name}>
                  <input
                    type="checkbox"
                    checked={!hidden.includes(layer.name)}
                    onChange={() => setHidden((value) => value.includes(layer.name) ? value.filter((name) => name !== layer.name) : [...value, layer.name])}
                  />
                  {layer.name}
                </label>
              ))}
            </fieldset>
            {dimensions ? <p>{dimensions.widthMm.toFixed(1)} × {dimensions.heightMm.toFixed(1)} mm</p> : null}
            {dimensions && Math.max(dimensions.widthMm, dimensions.heightMm) > 200_000 ? (
              <p role="status">This size is still huge for a room. Hide unused layers, then calibrate a taped wall.</p>
            ) : null}
          </>
        ) : null}
        <div className="app-confirm-actions">
          <button type="button" data-testid="lr-underlay-dwg-dialog-cancel" onClick={onCancel}>Cancel</button>
          {preview ? (
            <button
              type="button"
              className="is-primary"
              data-testid="lr-underlay-dwg-dialog-confirm"
              disabled={confirmDisabled}
              onClick={() => {
                if (!dimensions || !fittedPreview) return;
                onConfirm({
                  fileName: file.name,
                  dataUrl,
                  dwg: { preview: fittedPreview, hiddenLayers: hidden },
                  ...dimensions,
                  importWidthMm: dimensions.widthMm,
                  importHeightMm: dimensions.heightMm,
                  importReport: `${preview.rendered} entities drawn. Omitted: ${omittedReport(preview) || "none reported"}. ${preview.warnings.join(" ")} ${DWG_GEOMETRY_DESCRIPTION}`,
                  opacity: 0.42,
                  xMm: 0,
                  zMm: 0,
                  rotationDeg: 0,
                  calibrated: false,
                  sourceType: "dwg",
                });
              }}
            >
              Import tracing background
            </button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
