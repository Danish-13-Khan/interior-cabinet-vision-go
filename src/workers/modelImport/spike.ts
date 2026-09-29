export type ImportProbe = {
  worker: boolean;
  imageBitmap: boolean;
  offscreenWebgl: boolean;
  webpEncode: boolean;
};

export type ImportRuntime = "worker" | "split";

/** Pass: whole import in the worker. Fail: textures on the main thread. */
export function decideImportRuntime(probe: ImportProbe): ImportRuntime {
  if (probe.worker && probe.imageBitmap) return "worker";
  return "split";
}

export function thumbnailMime(webpEncode: boolean): "image/webp" | "image/jpeg" {
  return webpEncode ? "image/webp" : "image/jpeg";
}

export function probeImportRuntime(): ImportProbe {
  const worker = typeof Worker !== "undefined";
  const imageBitmap = typeof createImageBitmap === "function";
  let offscreenWebgl = false;
  let webpEncode = false;
  if (typeof OffscreenCanvas !== "undefined") {
    try {
      const canvas = new OffscreenCanvas(16, 16);
      offscreenWebgl = Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
      webpEncode = typeof canvas.convertToBlob === "function" && offscreenWebgl;
    } catch {
      offscreenWebgl = false;
    }
  }
  return { worker, imageBitmap, offscreenWebgl, webpEncode };
}
