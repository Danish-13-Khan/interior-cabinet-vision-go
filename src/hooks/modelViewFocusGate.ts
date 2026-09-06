/** True while the Interiors 3D canvas host (not the toolbar) owns keyboard focus. */
let modelViewCanvasFocused = false;

export function isModelViewCanvasFocused() {
  return modelViewCanvasFocused;
}

export function setModelViewCanvasFocused(focused: boolean) {
  modelViewCanvasFocused = focused;
}
