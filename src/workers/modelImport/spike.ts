export type ImportProbe = {
  worker: boolean;
  imageBitmap: boolean;
  /** GLTFExporter draws textures to an OffscreenCanvas when there is no document (a worker). */
  offscreen2d: boolean;
};

export type ImportRuntime = "worker" | "main";

/** Pass: whole import in the worker. Fail: whole import on the main thread, which has a document canvas. */
export function decideImportRuntime(probe: ImportProbe): ImportRuntime {
  if (probe.worker && probe.imageBitmap && probe.offscreen2d) return "worker";
  return "main";
}

function looksLikeWebp(bytes: Uint8Array): boolean {
  return bytes.length >= 12
    && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
    && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
}

let webpProbe: Promise<boolean> | null = null;

/** True only when a canvas really emits a WebP payload, not merely because convertToBlob exists. Cached. */
export function canEncodeWebp(): Promise<boolean> {
  webpProbe ??= probeWebpEncode();
  return webpProbe;
}

async function probeWebpEncode(): Promise<boolean> {
  if (typeof OffscreenCanvas === "undefined") return false;
  try {
    const canvas = new OffscreenCanvas(1, 1);
    const context = canvas.getContext("2d");
    if (!context || typeof canvas.convertToBlob !== "function") return false;
    context.fillStyle = "#123456";
    context.fillRect(0, 0, 1, 1);
    const blob = await canvas.convertToBlob({ type: "image/webp" });
    if (blob.type !== "image/webp") return false;
    return looksLikeWebp(new Uint8Array(await blob.arrayBuffer()));
  } catch {
    return false;
  }
}

async function canDecodeBitmap(): Promise<boolean> {
  if (typeof createImageBitmap !== "function" || typeof OffscreenCanvas === "undefined") return false;
  try {
    const canvas = new OffscreenCanvas(1, 1);
    const context = canvas.getContext("2d");
    if (!context) return typeof createImageBitmap === "function";
    context.fillRect(0, 0, 1, 1);
    const blob = await canvas.convertToBlob();
    const bitmap = await createImageBitmap(blob);
    const ok = bitmap.width > 0 && bitmap.height > 0;
    bitmap.close?.();
    return ok;
  } catch {
    return false;
  }
}

function canUseOffscreen2d(): boolean {
  if (typeof OffscreenCanvas === "undefined") return false;
  try {
    return Boolean(new OffscreenCanvas(1, 1).getContext("2d"));
  } catch {
    return false;
  }
}

let runtimeProbe: Promise<ImportProbe> | null = null;

/**
 * Real capability check, run once per session. OffscreenCanvas and createImageBitmap are the same
 * globals in a worker on the engines we support, so the main-thread result stands in for the worker.
 */
export function probeImportRuntime(): Promise<ImportProbe> {
  runtimeProbe ??= canDecodeBitmap().then((imageBitmap) => ({
    worker: typeof Worker !== "undefined",
    imageBitmap,
    offscreen2d: canUseOffscreen2d(),
  }));
  return runtimeProbe;
}
