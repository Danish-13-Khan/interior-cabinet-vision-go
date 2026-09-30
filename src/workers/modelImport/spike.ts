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

function looksLikeWebp(bytes: Uint8Array): boolean {
  return bytes.length >= 12
    && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
    && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
}

/** True only when a canvas really emits a WebP payload, not merely because convertToBlob exists. */
export async function canEncodeWebp(): Promise<boolean> {
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

function canUseOffscreenWebgl(): boolean {
  if (typeof OffscreenCanvas === "undefined") return false;
  try {
    const canvas = new OffscreenCanvas(16, 16);
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Real capability check. WebP is not assumed from the presence of convertToBlob. */
export async function probeImportRuntime(): Promise<ImportProbe> {
  const [imageBitmap, webpEncode] = await Promise.all([canDecodeBitmap(), canEncodeWebp()]);
  return {
    worker: typeof Worker !== "undefined",
    imageBitmap,
    offscreenWebgl: canUseOffscreenWebgl(),
    webpEncode,
  };
}
