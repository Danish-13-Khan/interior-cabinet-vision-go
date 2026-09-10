import * as T from 'three';
import type { ShowroomPalette } from './palettes';
import { ASSEMBLY_SECONDS, assemblyProgress, easeOut, lightProgress } from './motion';

export type ShowroomController = {
  setPalette: (palette: ShowroomPalette) => void;
  replay: () => void;
  setDrawer: (open: boolean) => void;
  rotate: (direction: number) => void;
  dispose: () => void;
};

/** Isolated marketing scene: never reads or changes the designer document. */
export function createShowroom(host: HTMLElement, palette: ShowroomPalette,
  status: (message: string) => void, onError: () => void): ShowroomController {
  const renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  const canvas = renderer.domElement;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Animated cabinet assembly. Drag to rotate, or use the rotation buttons.');
  host.append(canvas);
  const scene = new T.Scene(), group = new T.Group();
  scene.add(group);
  const camera = new T.PerspectiveCamera(34, 1, .1, 40);
  const wood = new T.MeshStandardMaterial({ color: palette.wood, roughness: .65 });
  const stone = new T.MeshStandardMaterial({ color: palette.stone, roughness: .55 });
  const metal = new T.MeshStandardMaterial({ color: palette.handle, metalness: .7, roughness: .3 });
  const inner = new T.MeshStandardMaterial({ color: '#b9ab91', roughness: .85 });
  const ground = new T.MeshStandardMaterial({ color: palette.wall, roughness: 1 });
  const glowMaterial = new T.MeshStandardMaterial({ color: palette.light, emissive: palette.light, emissiveIntensity: 0 });
  const parts: { mesh: T.Mesh; target: T.Vector3; start: T.Vector3; delay: number }[] = [];
  const materials = [wood, stone, metal, inner, ground, glowMaterial];
  function box(size: number[], pos: number[], material: T.Material, parent: T.Group = group) {
    const mesh = new T.Mesh(new T.BoxGeometry(size[0], size[1], size[2]), material);
    mesh.position.set(pos[0], pos[1], pos[2]); mesh.castShadow = true; mesh.receiveShadow = true;
    parent.add(mesh); return mesh;
  }
  function part(size: number[], pos: number[], mat: T.Material, offset: number[], delay: number) {
    const mesh = box(size, pos, mat);
    parts.push({ mesh, target: mesh.position.clone(), start: mesh.position.clone().add(new T.Vector3(...offset)), delay });
  }
  // A real open carcass, partitions, inset doors, and a separate drawer box.
  box([4.5, .07, 2.8], [0, -.055, 0], ground);
  part([2.9, .13, .65], [0, .10, 0], metal, [0, -.2, 0], 0);
  part([3, .06, .8], [0, .21, 0], wood, [0, .8, 0], .35);
  part([.055, 1, .8], [-1.48, .73, 0], wood, [-1.1, .5, 0], .8);
  part([.055, 1, .8], [1.48, .73, 0], wood, [1.1, .5, 0], 1);
  part([2.9, .98, .035], [0, .73, -.38], wood, [0, .6, -1], 1.25);
  for (const x of [-.5, .5]) part([.035, .98, .76], [x, .73, 0], wood, [0, 1.4, 0], 1.5);
  part([2.9, .035, .74], [0, .64, 0], inner, [0, .2, 1.2], 1.85);
  for (const x of [-.99, .99]) {
    part([.945, .97, .055], [x, .74, .425], wood, [x < 0 ? -.6 : .6, .2, 1], 2.2);
    part([.30, .026, .035], [x, 1.12, .468], metal, [0, .1, 1.3], 3.5);
  }
  part([.94, .54, .055], [0, .52, .425], wood, [0, .2, 1.2], 2.6);
  const drawer = new T.Group(); group.add(drawer);
  box([.94, .38, .055], [0, .99, .425], wood, drawer);
  box([.85, .035, .60], [0, .82, .08], inner, drawer);
  for (const x of [-.425, .425]) box([.03, .26, .60], [x, .96, .08], inner, drawer);
  box([.85, .26, .03], [0, .96, -.22], inner, drawer);
  box([.30, .026, .035], [0, 1.10, .468], metal, drawer);
  part([3.13, .085, .91], [0, 1.27, 0], stone, [0, 1.6, 0], 3.1);
  const strip = box([2.72, .018, .018], [0, .19, .30], glowMaterial);
  const glow = new T.PointLight(palette.light, 0, 4, 2); glow.position.set(0, .17, .6); group.add(glow);
  const hemi = new T.HemisphereLight('#fff8ec', '#50655c', 2.5); scene.add(hemi);
  const key = new T.DirectionalLight(palette.light, 3.4); key.position.set(-3, 5, 4);
  key.castShadow = true; key.shadow.mapSize.set(512, 512);
  Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4 });
  key.shadow.normalBias = .035; scene.add(key);
  let disposed = false, inView = false, raf = 0, last = 0;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let elapsed = motion.matches ? ASSEMBLY_SECONDS : 0, assembling = !motion.matches;
  let drawerValue = 0, drawerStart = 0, drawerEnd = 0, drawerTime = 1;
  const render = () => { if (!disposed && inView && !document.hidden) renderer.render(scene, camera); };
  function pose() {
    for (const p of parts) {
      const progress = assemblyProgress(elapsed, p.delay);
      p.mesh.position.lerpVectors(p.start, p.target, progress);
      p.mesh.visible = progress > 0;
    }
    drawer.visible = elapsed > 2.7;
    drawer.position.z = (1 - assemblyProgress(elapsed, 2.7)) * 1.3 + drawerValue;
    const illumination = lightProgress(elapsed);
    glow.intensity = illumination * 3; glowMaterial.emissiveIntensity = illumination * 2.5;
    strip.visible = illumination > 0;
    const reveal = easeOut((elapsed - 3.9) / 2);
    camera.position.set(4.4 - reveal * .9, 2.9 - reveal * .3, 5.2 + reveal * .35);
    camera.lookAt(0, .65, 0); render();
  }
  function wake() {
    if (!disposed && inView && !document.hidden && !raf && (assembling || drawerTime < 1)) {
      raf = requestAnimationFrame(tick);
    }
  }
  function tick(time: number) {
    raf = 0;
    if (disposed || !inView || document.hidden) return;
    const dt = Math.min((time - (last || time)) / 1000, .05); last = time;
    if (assembling) elapsed = Math.min(ASSEMBLY_SECONDS, elapsed + dt);
    drawerTime = Math.min(1, drawerTime + dt * 1.8);
    drawerValue = drawerStart + (drawerEnd - drawerStart) * easeOut(drawerTime);
    pose();
    if (assembling && elapsed >= ASSEMBLY_SECONDS) { assembling = false; status('Assembled · drag to rotate'); }
    wake();
  }
  function visibility() {
    if (document.hidden || !inView) { cancelAnimationFrame(raf); raf = 0; last = 0; }
    else { render(); wake(); }
  }
  const observer = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; visibility(); }); observer.observe(host);
  const resize = new ResizeObserver(() => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); render();
  }); resize.observe(host);
  const reduced = () => { if (motion.matches) { elapsed = ASSEMBLY_SECONDS; assembling = false; drawerTime = 1; drawerValue = drawerEnd; cancelAnimationFrame(raf); raf = 0; pose(); status('Still view · reduced motion'); } };
  motion.addEventListener('change', reduced);
  document.addEventListener('visibilitychange', visibility);
  let drag: number | null = null;
  canvas.onpointerdown = e => { drag = e.clientX; canvas.setPointerCapture(e.pointerId); };
  canvas.onpointermove = e => { if (drag === null) return; group.rotation.y += (e.clientX - drag) * .007; drag = e.clientX; render(); };
  canvas.onpointerup = canvas.onpointercancel = canvas.onlostpointercapture = () => { drag = null; };
  const lost = (event: Event) => { event.preventDefault(); onError(); }; canvas.addEventListener('webglcontextlost', lost);
  pose(); status(motion.matches ? 'Still view · reduced motion' : 'Assembling your cabinet…');
  return {
    setPalette(p) { wood.color.set(p.wood); stone.color.set(p.stone); ground.color.set(p.wall); metal.color.set(p.handle); key.color.set(p.light); glow.color.set(p.light); glowMaterial.color.set(p.light); glowMaterial.emissive.set(p.light); render(); },
    replay() { elapsed = motion.matches ? ASSEMBLY_SECONDS : 0; assembling = !motion.matches; group.rotation.y = 0; drawerValue = drawerStart = drawerEnd = 0; drawerTime = 1; pose(); status(motion.matches ? 'Still view · reduced motion' : 'Assembling your cabinet…'); wake(); },
    setDrawer(open) { elapsed = ASSEMBLY_SECONDS; assembling = false; drawerStart = drawerValue; drawerEnd = open ? .60 : 0; drawerTime = motion.matches ? 1 : 0; if (motion.matches) drawerValue = drawerEnd; pose(); status(open ? 'Drawer open' : 'Drawer closed'); wake(); },
    rotate(direction) { group.rotation.y += direction * .25; render(); },
    dispose() {
      disposed = true; cancelAnimationFrame(raf); observer.disconnect(); resize.disconnect();
      document.removeEventListener('visibilitychange', visibility); motion.removeEventListener('change', reduced);
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.onpointerdown = canvas.onpointermove = canvas.onpointerup = canvas.onpointercancel = canvas.onlostpointercapture = null;
      group.traverse(object => { if (object instanceof T.Mesh) object.geometry.dispose(); });
      materials.forEach(material => material.dispose()); key.shadow.map?.dispose(); renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
    },
  };
}
