import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { useDialogFocusTrap } from "../../hooks/useDialogFocusTrap";
import type { LivingRoomPlanUnderlay } from "../../domain/livingRoom/planUnderlay";
import { createPlanUnderlayImportCancelGate, dataUrlToUnderlay } from "../../domain/livingRoom/planUnderlayImport";
import {
  loadPdfDocument,
  normalizeCropRect,
  rasterPdfPageToDataUrl,
  readFileAsArrayBuffer,
  renderPdfPagePreview,
  type PdfCropRect,
  type PdfPagePreview,
} from "../../domain/livingRoom/planUnderlayPdf";

export type PlanUnderlayPdfDialogProps = {
  file: File;
  roomWidthMm: number;
  onConfirm: (underlay: LivingRoomPlanUnderlay) => void;
  onCancel: () => void;
  onError?: (message: string) => void;
};

type DragState = {
  originX: number;
  originY: number;
  currentX: number;
  currentY: number;
};

function cropFromDrag(drag: DragState): PdfCropRect {
  return {
    x: drag.originX,
    y: drag.originY,
    width: drag.currentX - drag.originX,
    height: drag.currentY - drag.originY,
  };
}

function pointerInPreview(
  event: ReactPointerEvent<HTMLDivElement>,
  frame: HTMLElement,
  preview: PdfPagePreview,
): { x: number; y: number } {
  const rect = frame.getBoundingClientRect();
  const scaleX = rect.width / Math.max(1, preview.width);
  const scaleY = rect.height / Math.max(1, preview.height);
  const x = (event.clientX - rect.left) / Math.max(scaleX, 1e-6);
  const y = (event.clientY - rect.top) / Math.max(scaleY, 1e-6);
  return {
    x: Math.max(0, Math.min(preview.width, x)),
    y: Math.max(0, Math.min(preview.height, y)),
  };
}

/** Pick PDF page + optional crop, then raster to underlay PNG. */
export function PlanUnderlayPdfDialog({
  file,
  roomWidthMm,
  onConfirm,
  onCancel,
  onError,
}: PlanUnderlayPdfDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previewHostRef = useRef<HTMLDivElement>(null);
  const previewFrameRef = useRef<HTMLDivElement>(null);
  const pdfBytesRef = useRef<ArrayBuffer | null>(null);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  /** Cancel / Escape marks the gate so an in-flight raster confirm is ignored. */
  const cancelGateRef = useRef(createPlanUnderlayImportCancelGate());

  const handleCancel = useCallback(() => {
    cancelGateRef.current.cancel();
    onCancel();
  }, [onCancel]);

  useDialogFocusTrap(true, dialogRef, handleCancel);

  const [pageCount, setPageCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [preview, setPreview] = useState<PdfPagePreview | null>(null);
  const [crop, setCrop] = useState<PdfCropRect | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [cropEnabled, setCropEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const bytes = await readFileAsArrayBuffer(file);
        if (cancelled) return;
        pdfBytesRef.current = bytes.slice(0);
        const doc = await loadPdfDocument(bytes);
        let count = 1;
        try {
          count = Math.max(1, doc.numPages);
        } finally {
          await doc.destroy();
        }
        if (cancelled) return;
        const first = await renderPdfPagePreview(pdfBytesRef.current, 1);
        if (cancelled) return;
        setPageCount(count);
        setPageNumber(1);
        setPreview(first);
        setCrop(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not read the PDF.";
        if (!cancelled) {
          setError(message);
          onErrorRef.current?.(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file]);

  // After pages finish loading, move focus to Import if still on dialog/Cancel (initial focus landed on enabled Cancel).
  useEffect(() => {
    if (loading || busy || !preview || error) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const active = document.activeElement;
    const confirmBtn = dialog.querySelector<HTMLButtonElement>("[data-testid=\"lr-underlay-pdf-dialog-confirm\"]");
    if (!confirmBtn || confirmBtn.disabled) return;
    const cancelBtn = dialog.querySelector<HTMLButtonElement>("[data-testid=\"lr-underlay-pdf-dialog-cancel\"]");
    const onShell = active === dialog || active === cancelBtn || (active instanceof Node && !dialog.contains(active));
    if (onShell) confirmBtn.focus();
  }, [loading, busy, preview, error]);

  const loadPage = useCallback(async (nextPage: number) => {
    const bytes = pdfBytesRef.current;
    if (!bytes) return;
    setLoading(true);
    setError(null);
    try {
      const next = await renderPdfPagePreview(bytes, nextPage);
      setPageNumber(nextPage);
      setPreview(next);
      setCrop(null);
      setDrag(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not render that PDF page.");
    } finally {
      setLoading(false);
    }
  }, []);

  const activeCrop = drag
    ? normalizeCropRect(cropFromDrag(drag), preview?.width ?? 0, preview?.height ?? 0)
    : crop;

  async function handleConfirm() {
    const bytes = pdfBytesRef.current;
    if (!bytes || !preview || busy) return;
    const gen = cancelGateRef.current.beginConfirm();
    if (gen == null) return;
    setBusy(true);
    setError(null);
    try {
      const raster = await rasterPdfPageToDataUrl(bytes, pageNumber, {
        crop: cropEnabled ? activeCrop : null,
        previewWidth: preview.width,
        previewHeight: preview.height,
      });
      if (!cancelGateRef.current.isCurrent(gen)) return;
      const underlayName = pageCount > 1
        ? `${file.name.replace(/\.pdf$/i, "")}-p${pageNumber}.png`
        : file.name.replace(/\.pdf$/i, ".png");
      const underlay = await dataUrlToUnderlay(raster.dataUrl, underlayName || file.name, roomWidthMm);
      if (!cancelGateRef.current.isCurrent(gen)) return;
      onConfirm(underlay);
    } catch (err) {
      if (!cancelGateRef.current.isCurrent(gen)) return;
      const message = err instanceof Error ? err.message : "PDF import failed.";
      setError(message);
      onError?.(message);
    } finally {
      setBusy(false);
    }
  }

  const confirmDisabled = loading || busy || !preview || Boolean(error && !preview);

  return createPortal(
    <div
      className="app-confirm-backdrop lr-underlay-pdf-backdrop"
      data-testid="lr-underlay-pdf-dialog-backdrop"
      onKeyDown={(event) => {
        event.stopPropagation();
      }}
    >
      <div
        ref={dialogRef}
        className="app-confirm-dialog lr-underlay-pdf-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lr-underlay-pdf-dialog-title"
        data-testid="lr-underlay-pdf-dialog"
        tabIndex={-1}
      >
        <strong id="lr-underlay-pdf-dialog-title">Import PDF plan</strong>
        <p data-testid="lr-underlay-pdf-dialog-message">
          Choose a page{pageCount > 1 ? ` (1–${pageCount})` : ""}. Optionally crop, then import as a calibratable underlay.
        </p>

        {pageCount > 1 ? (
          <div className="lr-underlay-pdf-pages" data-testid="lr-underlay-pdf-pages" role="list">
            {Array.from({ length: pageCount }, (_, index) => {
              const n = index + 1;
              return (
                <button
                  key={n}
                  type="button"
                  role="listitem"
                  className={n === pageNumber ? "is-active" : undefined}
                  data-testid={`lr-underlay-pdf-page-${n}`}
                  aria-pressed={n === pageNumber}
                  disabled={loading || busy}
                  onClick={() => void loadPage(n)}
                >
                  Page {n}
                </button>
              );
            })}
          </div>
        ) : null}

        <div
          ref={previewHostRef}
          className={`lr-underlay-pdf-preview ${cropEnabled ? "is-cropping" : ""}`}
          data-testid="lr-underlay-pdf-preview"
          onPointerDown={(event) => {
            if (!cropEnabled || !preview || !previewFrameRef.current) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            const point = pointerInPreview(event, previewFrameRef.current, preview);
            setDrag({ originX: point.x, originY: point.y, currentX: point.x, currentY: point.y });
          }}
          onPointerMove={(event) => {
            if (!drag || !preview || !previewFrameRef.current) return;
            const point = pointerInPreview(event, previewFrameRef.current, preview);
            setDrag({ ...drag, currentX: point.x, currentY: point.y });
          }}
          onPointerUp={() => {
            if (!drag || !preview) {
              setDrag(null);
              return;
            }
            const next = normalizeCropRect(cropFromDrag(drag), preview.width, preview.height);
            setCrop(next);
            setDrag(null);
          }}
          onPointerCancel={() => setDrag(null)}
        >
          {preview ? (
            <div ref={previewFrameRef} className="lr-underlay-pdf-preview-frame">
              <img src={preview.dataUrl} alt={`PDF page ${pageNumber} preview`} draggable={false} />
              {activeCrop ? (
                <div
                  className="lr-underlay-pdf-crop"
                  data-testid="lr-underlay-pdf-crop-rect"
                  style={{
                    left: `${(activeCrop.x / preview.width) * 100}%`,
                    top: `${(activeCrop.y / preview.height) * 100}%`,
                    width: `${(activeCrop.width / preview.width) * 100}%`,
                    height: `${(activeCrop.height / preview.height) * 100}%`,
                  }}
                />
              ) : null}
            </div>
          ) : (
            <div className="lr-underlay-pdf-preview-empty">{loading ? "Loading PDF…" : "No preview"}</div>
          )}
        </div>

        <div className="lr-underlay-pdf-crop-controls" data-testid="lr-underlay-pdf-crop-controls">
          <label>
            <input
              type="checkbox"
              data-testid="lr-underlay-pdf-crop-toggle"
              checked={cropEnabled}
              disabled={loading || busy || !preview}
              onChange={(event) => {
                setCropEnabled(event.target.checked);
                if (!event.target.checked) {
                  setCrop(null);
                  setDrag(null);
                }
              }}
            />
            <span>Crop selection</span>
          </label>
          <button
            type="button"
            className="is-secondary"
            data-testid="lr-underlay-pdf-crop-clear"
            disabled={!cropEnabled || (!crop && !drag) || busy}
            onClick={() => {
              setCrop(null);
              setDrag(null);
            }}
          >
            Clear crop
          </button>
        </div>

        {error ? (
          <p className="lr-underlay-pdf-error" role="alert" data-testid="lr-underlay-pdf-error">{error}</p>
        ) : null}

        <div className="app-confirm-actions">
          <button
            type="button"
            data-testid="lr-underlay-pdf-dialog-cancel"
            data-dialog-initial-focus={confirmDisabled ? "" : undefined}
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="is-primary"
            data-testid="lr-underlay-pdf-dialog-confirm"
            data-dialog-initial-focus={confirmDisabled ? undefined : ""}
            disabled={confirmDisabled}
            onClick={() => void handleConfirm()}
          >
            {busy ? "Importing…" : "Import page"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
