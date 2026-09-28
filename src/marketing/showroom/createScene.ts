import * as T from 'three';
import type { ShowroomPalette } from './palettes';
import { createShowroomMaterials } from './materials';
import { buildShowroomStage } from './sceneBuild';
import { cameraAzimuth, cycleTime, TIMELINE_SECONDS, timelineStage, type TimelineStage } from './motion';

export type ShowroomMode = 'loop' | 'once' | 'still';

export type ShowroomController = {
  setPalette: (palette: ShowroomPalette) => void;
  /** Restart the build; `loop` keeps cycling, otherwise it plays once and holds. */
  replay: (loop: boolean) => void;
  orbit: (direction: number) => void;
  dispose: () => void;
};

export type ShowroomOptions = {
  mode: ShowroomMode;
  onStage: (stage: TimelineStage) => void;
  onError: () => void;
  onFirstFrame?: () => void;
};

const TARGET = new T.Vector3(0, 1.05, 0.3);
const MAX_USER_ORBIT = 0.6;

/** Isolated marketing scene: never reads or changes the designer document. */
export function createShowroom(host: HTMLElement, palette: ShowroomPalette, options: ShowroomOptions): ShowroomController {
  const renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power', preserveDrawingBuffer: options.mode === 'still' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const canvas = renderer.domElement;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('tabindex', '0');
  canvas.setAttribute('aria-label', 'A kitchen run assembling in 3D. Drag or use the arrow keys to orbit.');
  host.append(canvas);

  const materials = createShowroomMaterials(palette);
  const stage = buildShowroomStage(materials);
  const camera = new T.PerspectiveCamera(32, 4 / 3, 0.1, 40);
  let disposed = false, inView = false, raf = 0, last = 0, firstFrame = true;
  let elapsed = options.mode === 'still' ? TIMELINE_SECONDS : 0;
  let loop = options.mode === 'loop', playing = options.mode !== 'still';
  let userOrbit = 0, aspect = 4 / 3, lastStage: TimelineStage | null = null;

  const time = () => cycleTime(elapsed, loop);
  function render() {
    if (disposed || !inView || document.hidden) return;
    const t = time();
    const azimuth = cameraAzimuth(t) + userOrbit;
    const radius = 5.4 * Math.max(1, 1.25 / aspect);
    camera.position.set(TARGET.x + Math.sin(azimuth) * radius, 1.75, TARGET.z + Math.cos(azimuth) * radius);
    camera.lookAt(TARGET);
    renderer.render(stage.scene, camera);
    if (firstFrame) { firstFrame = false; options.onFirstFrame?.(); }
  }
  function pose() {
    const t = time();
    stage.pose(t);
    const current = timelineStage(t);
    if (current !== lastStage) { lastStage = current; options.onStage(current); }
    render();
  }
  function wake() {
    if (!disposed && inView && !document.hidden && playing && !raf) raf = requestAnimationFrame(tick);
  }
  function tick(now: number) {
    raf = 0;
    if (disposed || !inView || document.hidden) return;
    const dt = Math.min((now - (last || now)) / 1000, 0.05);
    last = now;
    elapsed += dt;
    if (!loop && elapsed >= TIMELINE_SECONDS) { elapsed = TIMELINE_SECONDS; playing = false; }
    pose();
    wake();
  }
  function visibility() {
    if (document.hidden || !inView) { cancelAnimationFrame(raf); raf = 0; last = 0; }
    else { render(); wake(); }
  }

  const observer = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; visibility(); });
  observer.observe(host);
  const resize = new ResizeObserver(() => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    aspect = width / height;
    renderer.setSize(width, height, false);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    render();
  });
  resize.observe(host);
  document.addEventListener('visibilitychange', visibility);

  const orbitBy = (delta: number) => {
    userOrbit = Math.max(-MAX_USER_ORBIT, Math.min(MAX_USER_ORBIT, userOrbit + delta));
    render();
  };
  let drag: number | null = null;
  canvas.onpointerdown = e => { drag = e.clientX; canvas.setPointerCapture(e.pointerId); };
  canvas.onpointermove = e => { if (drag === null) return; orbitBy((drag - e.clientX) * 0.006); drag = e.clientX; };
  canvas.onpointerup = canvas.onpointercancel = canvas.onlostpointercapture = () => { drag = null; };
  canvas.onkeydown = e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    orbitBy(e.key === 'ArrowLeft' ? -0.15 : 0.15);
  };
  const lost = (event: Event) => { event.preventDefault(); options.onError(); };
  canvas.addEventListener('webglcontextlost', lost);
  pose();

  return {
    setPalette(p) { materials.setPalette(p); render(); },
    replay(nextLoop) {
      elapsed = 0; last = 0; loop = nextLoop; playing = true; userOrbit = 0;
      pose(); wake();
    },
    orbit: direction => orbitBy(direction * 0.15),
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      resize.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.onpointerdown = canvas.onpointermove = canvas.onpointerup = canvas.onpointercancel = canvas.onlostpointercapture = null;
      canvas.onkeydown = null;
      stage.dispose();
      materials.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
