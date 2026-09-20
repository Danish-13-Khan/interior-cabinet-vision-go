import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDialogFocusTrap } from '../../hooks/useDialogFocusTrap';
import { dwgPreviewDataUrl, type DwgPreview } from '../../domain/livingRoom/dwgGeometry';
import { dwgPlanDimensionsMm } from '../../domain/livingRoom/dwgUnits';
import type { LivingRoomPlanUnderlay } from '../../domain/livingRoom/planUnderlay';

export function PlanUnderlayDwgDialog({ file, onCancel, onConfirm }: {
  file: File; onCancel: () => void; onConfirm: (value: LivingRoomPlanUnderlay) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  useDialogFocusTrap(true, root, onCancel);
  const [preview, setPreview] = useState<DwgPreview | null>(null);
  const [error, setError] = useState('');
  const [scale, setScale] = useState('');
  const [hidden, setHidden] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    let active = true;
    const worker = new Worker(new URL('../../domain/livingRoom/dwgImport.worker.ts', import.meta.url), { type: 'module' });
    const fail = (message: string) => { if (active) setError(message); worker.terminate(); };
    const timeout = window.setTimeout(() => fail('DWG import timed out. Try a smaller drawing.'), 120000);
    worker.onmessage = ({ data }: MessageEvent<{ preview?: DwgPreview; error?: string }>) => {
      if (!active) return;
      window.clearTimeout(timeout); worker.terminate();
      if (data.error) setError(data.error);
      else if (data.preview) { setPreview(data.preview); setScale(data.preview.mmPerUnit?.toString() ?? ''); }
    };
    worker.onerror = () => fail('The DWG reader could not start or ran out of memory. Try a smaller drawing.');
    if (file.size > 50 * 1024 * 1024) fail('DWG files must be 50 MB or smaller.');
    else void file.arrayBuffer().then(buffer => { if (active) worker.postMessage(buffer, [buffer]); }).catch(() => fail('Could not read the selected file.'));
    return () => { active = false; window.clearTimeout(timeout); worker.terminate(); };
  }, [file]);
  const dataUrl = useMemo(() => preview ? dwgPreviewDataUrl(preview, hidden) : '', [preview, hidden]);
  let dimensions: { widthMm: number; heightMm: number } | null = null;
  try { if (preview) dimensions = dwgPlanDimensionsMm(preview.bounds, Number(scale)); } catch { /* User is entering scale. */ }
  return createPortal(<div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: '#0009', display: 'grid', placeItems: 'center' }}>
    <div ref={root} role="dialog" aria-modal="true" aria-labelledby="dwg-import-title" onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); onCancel(); } }}
      style={{ background: 'white', color: '#263238', padding: 24, width: 'min(900px, 95vw)', maxHeight: '90vh', overflow: 'auto' }}>
      <h2 id="dwg-import-title">Import DWG background</h2><p>{file.name}</p>
      {error ? <p role="alert">{error}</p> : !preview ? <p role="status">Reading DWG locally…</p> : <>
        <p>{preview.rendered} entities drawn. Only planar lines, straight lightweight polylines and circles are supported in this preview.</p>
        {Object.keys(preview.omitted).length > 0 && <p role="status">Missing content: {Object.entries(preview.omitted).map(([type, count]) => `${type}: ${count}`).join('; ')}. Blocks, text and external references may be absent. Check against the original drawing.</p>}
        <label>Millimeters per drawing unit <input aria-label="Millimeters per drawing unit" type="number" min="0" step="any" value={scale} onChange={e => setScale(e.target.value)} /></label>
        <p>{preview.mmPerUnit ? 'Initial scale comes from DWG units.' : 'Drawing units are missing or unsupported. Enter the correct scale.'} Verify a known distance with Calibrate after import.</p>
        <label>Preview zoom <input aria-label="Preview zoom" type="range" min="1" max="5" step="0.25" value={zoom} onChange={e => setZoom(Number(e.target.value))} /></label>
        <div style={{ height: 320, overflow: 'auto', background: '#f5f5f5', border: '1px solid #ddd' }}><img alt="DWG tracing preview" src={dataUrl} style={{ width: `${zoom*100}%`, maxWidth: 'none', height: `${zoom*100}%`, objectFit: 'contain' }} /></div>
        <fieldset><legend>Visible layers</legend>{preview.layers.map(layer => <label key={layer.name} style={{ display: 'inline-block', marginRight: 12 }}><input type="checkbox" checked={!hidden.includes(layer.name)} onChange={() => setHidden(value => value.includes(layer.name) ? value.filter(name => name !== layer.name) : [...value, layer.name])} />{layer.name}</label>)}</fieldset>
        {dimensions && <p>{dimensions.widthMm.toFixed(1)} × {dimensions.heightMm.toFixed(1)} mm</p>}
      </>}
      <button type="button" onClick={onCancel}>Cancel</button>{preview && <button type="button" disabled={!dimensions || hidden.length === preview.layers.length} onClick={() => {
        if (!dimensions) return;
        onConfirm({ fileName: file.name, dataUrl, ...dimensions, importWidthMm: dimensions.widthMm, importHeightMm: dimensions.heightMm,
          importReport: `${preview.rendered} entities drawn. Omitted: ${Object.entries(preview.omitted).map(([type, count]) => `${type}: ${count}`).join('; ') || 'none reported'}. Only planar lines, straight lightweight polylines and circles are supported.`,
          opacity: 0.42, xMm: 0, zMm: 0, rotationDeg: 0, calibrated: false, sourceType: 'dwg' });
      }}>Import tracing background</button>}
    </div>
  </div>, document.body);
}
