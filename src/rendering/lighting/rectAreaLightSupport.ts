import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";

let ready = false;

/**
 * Install LTC lookup textures so `rectAreaLight` actually emits.
 * Call from the canvas that mounts the lights. Importing this module
 * must stay side-effect free: unit tests load it without WebGL.
 */
export function ensureRectAreaLightSupport() {
  if (ready) return;
  RectAreaLightUniformsLib.init();
  ready = true;
}
