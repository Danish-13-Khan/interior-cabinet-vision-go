import { PerspectiveCamera, Vector2, type Camera, type Scene, type WebGLRenderer } from "three";

export type WebglCaptureRestore = () => void;

export function readGlCanvas(
  gl: WebGLRenderer,
  widthPx: number,
  heightPx: number,
) {
  const output = document.createElement("canvas");
  output.width = widthPx;
  output.height = heightPx;
  const context = output.getContext("2d");
  if (!context) throw new Error("The browser could not prepare the capture canvas.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(gl.domElement, 0, 0, widthPx, heightPx);
  return { canvas: output, context };
}

/** Resize the GL target and return a restore that puts preview size back. */
export function beginSizedGlCapture(
  gl: WebGLRenderer,
  scene: Scene,
  camera: Camera,
  size: { width: number; height: number },
  renderWidth: number,
  renderHeight: number,
): WebglCaptureRestore {
  const oldPixelRatio = gl.getPixelRatio();
  const oldDrawingSize = gl.getSize(new Vector2());
  const oldBackground = scene.background;
  const oldFog = scene.fog;
  const oldClearAlpha = gl.getClearAlpha();
  const oldOverride = scene.overrideMaterial;
  gl.setPixelRatio(1);
  gl.setSize(renderWidth, renderHeight, false);
  scene.updateMatrixWorld(true);
  return () => {
    scene.overrideMaterial = oldOverride;
    scene.background = oldBackground;
    scene.fog = oldFog;
    gl.setClearAlpha(oldClearAlpha);
    gl.setPixelRatio(oldPixelRatio);
    gl.setSize(oldDrawingSize.x || size.width, oldDrawingSize.y || size.height, false);
    if (camera instanceof PerspectiveCamera) camera.updateProjectionMatrix();
  };
}
