import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { PALETTES, readPalette, SHOWROOM_PALETTE_KEY, type PaletteId } from './palettes';
import type { ShowroomController } from './createScene';
import './showroom.css';

export function Showroom() {
  const [paletteId, setPaletteId] = useState<PaletteId>(() => {
    try { return readPalette(window.localStorage); } catch { return 'midnight'; }
  });
  const [enabled, setEnabled] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [status, setStatus] = useState('Preview your cabinet in 3D');
  const host = useRef<HTMLDivElement>(null), section = useRef<HTMLElement>(null);
  const controller = useRef<ShowroomController | null>(null);
  const palette = PALETTES[paletteId];
  const currentPalette = useRef(palette); currentPalette.current = palette;
  useEffect(() => {
    // Keep the first page render light; opt out of automatic 3D on constrained connections.
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || connection?.saveData || /2g/.test(connection?.effectiveType ?? '')) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(entries => {
      clearTimeout(timer);
      if (entries[0].isIntersecting) timer = setTimeout(() => setEnabled(true), 1000);
    });
    if (section.current) observer.observe(section.current);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, []);
  useEffect(() => {
    if (!enabled || !host.current) return;
    let cancelled = false;
    const element = host.current;
    setFailed(false); setReady(false); setStatus('Loading 3D preview…');
    const fail = () => {
      if (cancelled) return;
      controller.current?.dispose(); controller.current = null;
      setFailed(true); setReady(false); setStatus('3D is unavailable. You can still explore the website.');
    };
    import('./createScene').then(({ createShowroom }) => {
      if (cancelled) return;
      controller.current = createShowroom(element, currentPalette.current, setStatus, fail);
      setReady(true);
    }).catch(fail);
    return () => { cancelled = true; controller.current?.dispose(); controller.current = null; };
  }, [enabled, attempt]);
  useEffect(() => {
    controller.current?.setPalette(palette);
    try { localStorage.setItem(SHOWROOM_PALETTE_KEY, paletteId); } catch { /* Private browsing: keep the in-memory choice. */ }
  }, [paletteId, palette]);
  const style = {
    '--showroom-bg': palette.background, '--showroom-halo': palette.halo,
    '--showroom-text': palette.text, '--showroom-panel': palette.panel,
    '--showroom-border': palette.border,
  } as CSSProperties;
  return <section ref={section} className="cs-showroom" style={style} aria-label="Interactive cabinet showroom">
    <div className="cs-showroom-palettes" role="group" aria-label="Showroom color palette">
      {(Object.keys(PALETTES) as PaletteId[]).map(id => <button type="button" key={id} aria-pressed={paletteId === id} onClick={() => setPaletteId(id)}>
        <span className="cs-showroom-dot" style={{ background: PALETTES[id].wood }} />{PALETTES[id].name}
      </button>)}
    </div>
    <div className="cs-showroom-caption"><span>From parts to possibilities</span><span>Cabinet Studio / 3D</span></div>
    <div className="cs-showroom-stage">
      <div ref={host} className="cs-showroom-canvas" />
      {!ready && <div className="cs-showroom-poster">
        <img src={`${import.meta.env.BASE_URL}catalog/templates/l-kitchen-v1.png`} alt="Kitchen plan preview" width="480" height="320" />
        <button type="button" onClick={() => { setEnabled(true); setAttempt(value => value + 1); }} disabled={enabled && !failed}>
          {failed ? 'Retry 3D' : enabled ? 'Loading 3D…' : 'Watch it come together'}
        </button>
      </div>}
    </div>
    <div className="cs-showroom-controls" role="group" aria-label="3D preview controls">
      <button type="button" disabled={!ready} onClick={() => controller.current?.rotate(-1)} aria-label="Rotate cabinet left">← Rotate</button>
      <button type="button" disabled={!ready} onClick={() => controller.current?.rotate(1)} aria-label="Rotate cabinet right">Rotate →</button>
      <button type="button" disabled={!ready} onClick={() => { controller.current?.replay(); setDrawer(false); }}>Replay assembly</button>
      <button type="button" disabled={!ready} aria-pressed={drawer} onClick={() => { controller.current?.setDrawer(!drawer); setDrawer(!drawer); }}>{drawer ? 'Close drawer' : 'Open drawer'}</button>
    </div>
    <p className="cs-showroom-status" role="status">{status}</p>
    <small className="cs-showroom-disclaimer">Illustrative furniture preview · your projects stay unchanged</small>
  </section>;
}
