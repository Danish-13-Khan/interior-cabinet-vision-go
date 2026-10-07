import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { Loader, Texture, TextureLoader, type WebGLRenderer } from "three";

const pngLoader = new TextureLoader();
let renderer: WebGLRenderer | null = null;
let requestRedraw: (() => void) | null = null;
let ktx2: KTX2Loader | null = null;
let mapsInFlight = 0;
const decodedMaps = new Map<string, Texture>();

function canvas(): HTMLCanvasElement | null {
  const element = renderer?.domElement;
  return element instanceof HTMLCanvasElement ? element : null;
}

function publishMapReadiness() {
  const node = canvas();
  if (node) node.dataset.materialMaps = mapsInFlight > 0 ? "0" : "1";
}

function noteMapLoadStart() {
  mapsInFlight += 1;
  publishMapReadiness();
}

/** Stay at "0" until the frame after the last map is on the GPU. Absent means idle. */
function noteMapLoadEnd() {
  mapsInFlight = Math.max(0, mapsInFlight - 1);
  if (mapsInFlight > 0) {
    publishMapReadiness();
    return;
  }
  requestRedraw?.();
  requestAnimationFrame(() => {
    requestRedraw?.();
    requestAnimationFrame(() => {
      if (mapsInFlight === 0) publishMapReadiness();
    });
  });
}

function sharedKtx2() {
  if (!ktx2) {
    ktx2 = new KTX2Loader();
    ktx2.setTranscoderPath(`${import.meta.env.BASE_URL}basis/`);
    if (renderer) ktx2.detectSupport(renderer);
  }
  return ktx2;
}

/** Capture waits on `dataset.materialMaps !== "0"`. Bind before the first load. */
export function bindMaterialMapRenderer(gl: WebGLRenderer, redraw?: () => void) {
  renderer = gl;
  if (redraw) requestRedraw = redraw;
  ktx2?.detectSupport(gl);
}

export function cachedMaterialMap(url: string) {
  return decodedMaps.get(url);
}

/**
 * Dispatches `.ktx2` to the Basis transcoder and leaves PNG (metal AO) on TextureLoader.
 * One loader type keeps `useLoader` unconditional.
 */
export class MaterialMapLoader extends Loader<Texture> {
  setRenderer(gl: WebGLRenderer, redraw?: () => void) {
    bindMaterialMapRenderer(gl, redraw);
  }

  load(
    url: string,
    onLoad: (texture: Texture) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (error: unknown) => void,
  ) {
    noteMapLoadStart();
    const finish = (texture: Texture) => {
      if (url.endsWith(".ktx2")) decodedMaps.set(url, texture);
      onLoad(texture);
      noteMapLoadEnd();
    };
    const fail = (error: unknown) => {
      noteMapLoadEnd();
      onError?.(error);
    };
    try {
      const target = url.endsWith(".ktx2") ? sharedKtx2() : pngLoader;
      target.load(url, finish, onProgress, fail);
    } catch (error) {
      fail(error);
    }
  }
}
