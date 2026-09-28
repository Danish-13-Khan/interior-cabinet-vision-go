import { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_PALETTE, PALETTE_IDS, PALETTES, readPalette, SHOWROOM_PALETTE_KEY, type PaletteId } from './palettes';
import { readShowroomEnvironment, resolveShowroomStart } from './autoplay';
import type { ShowroomController, ShowroomMode } from './createScene';
import { STAGE_LABELS, type TimelineStage } from './motion';
import './showroom.css';

const BASE = import.meta.env.BASE_URL;
const POSTER = `${BASE}marketing/showroom-poster.png`;
const POSTER_FALLBACK = `${BASE}catalog/templates/l-kitchen-v1.png`;

export function Showroom() {
  const start = useMemo(() => resolveShowroomStart(readShowroomEnvironment()), []);
  const posterMode = start.mode === 'still';
  const [paletteId, setPaletteId] = useState<PaletteId>(() => {
    try { return readPalette(window.localStorage); } catch { return DEFAULT_PALETTE; }
  });
  const [mode, setMode] = useState<ShowroomMode | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [stage, setStage] = useState<TimelineStage>('hold');
  const [status, setStatus] = useState('Finished kitchen run preview');
  const [poster, setPoster] = useState(POSTER);
  const host = useRef<HTMLDivElement>(null), section = useRef<HTMLElement>(null);
  const controller = useRef<ShowroomController | null>(null);
  const palette = PALETTES[paletteId];
  const currentPalette = useRef(palette);
  currentPalette.current = palette;

  useEffect(() => {
    if (start.kind !== 'auto') return;
    if (posterMode) { setMode('still'); return; }
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(entries => {
      clearTimeout(timer);
      if (entries[0].isIntersecting) timer = setTimeout(() => { setMode(start.mode); observer.disconnect(); }, 600);
    });
    if (section.current) observer.observe(section.current);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [start, posterMode]);

  useEffect(() => {
    if (!mode || !host.current) return;
    let cancelled = false;
    const element = host.current;
    setFailed(false); setReady(false); setStatus('Loading 3D preview…');
    const fail = () => {
      if (cancelled) return;
      controller.current?.dispose(); controller.current = null;
      setFailed(true); setReady(false); setStatus('3D is unavailable. The still preview stays in place.');
    };
    import('./createScene').then(({ createShowroom }) => {
      if (cancelled) return;
      controller.current = createShowroom(element, currentPalette.current, {
        mode, onStage: setStage, onError: fail,
        onFirstFrame: () => section.current?.setAttribute('data-showroom-ready', 'true'),
      });
      setReady(true);
      setStatus(mode === 'still' ? 'Finished kitchen run' : 'Playing the build · drag to orbit');
    }).catch(fail);
    return () => { cancelled = true; controller.current?.dispose(); controller.current = null; };
  }, [mode, attempt]);

  useEffect(() => {
    controller.current?.setPalette(palette);
    try { localStorage.setItem(SHOWROOM_PALETTE_KEY, paletteId); } catch { /* Private browsing keeps the in-memory choice. */ }
  }, [paletteId, palette]);

  const launch = () => { setMode(start.mode); setAttempt(value => value + 1); };
  const replay = () => controller.current?.replay(start.mode === 'loop');

  return <section ref={section} className={`cs-showroom${posterMode ? ' is-poster' : ''}`} aria-label="Interactive cabinet showroom">
    <div className="cs-showroom-stage">
      <div ref={host} className="cs-showroom-canvas" />
      {!ready && <div className="cs-showroom-poster">
        <img src={poster} alt="Finished oak kitchen run with pantry, base and wall cabinets" width="960" height="720"
          onError={() => setPoster(POSTER_FALLBACK)} />
        {(start.kind === 'manual' || failed) && <button type="button" className="cs-showroom-play" onClick={launch} disabled={!!mode && !failed}>
          {failed ? 'Retry 3D' : mode ? 'Loading 3D…' : start.kind === 'manual' ? start.label : 'Play'}
        </button>}
      </div>}
      {ready && !posterMode && <p className="cs-showroom-caption" aria-hidden="true">{STAGE_LABELS[stage]}</p>}
    </div>
    {!posterMode && <div className="cs-showroom-controls">
      <div className="cs-showroom-palettes" role="group" aria-label="Cabinet finish">
        {PALETTE_IDS.map(id => <button type="button" key={id} aria-pressed={paletteId === id} onClick={() => setPaletteId(id)}>
          <span className="cs-showroom-dot" style={{ background: PALETTES[id].swatch }} />{PALETTES[id].name}
        </button>)}
      </div>
      <button type="button" className="cs-showroom-replay" disabled={!ready} onClick={replay}>Replay assembly</button>
    </div>}
    <p className="cs-showroom-status" role="status">{status}</p>
  </section>;
}
