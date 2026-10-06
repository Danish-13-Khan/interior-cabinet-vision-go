export const CAPTURE_CSS = { width: 800, height: 600 };
export const CAPTURE_PIXELS = { width: 1600, height: 1200 };

async function readCanvasMetrics(page) {
  return page.evaluate(() => {
    const host = document.querySelector("[data-testid=lr-model-canvas-host]");
    const canvas = host?.querySelector("canvas");
    if (!canvas || !host) return null;
    return {
      width: canvas.width,
      height: canvas.height,
      hostW: host.clientWidth,
      hostH: host.clientHeight,
      dpr: window.devicePixelRatio,
    };
  });
}

/** Pin the canvas host to 800×600 CSS px (1600×1200 backing store at DPR 2). */
export async function prepareCaptureViewport(page) {
  await page.evaluate(({ width, height }) => {
    const host = document.querySelector("[data-testid=lr-model-canvas-host]");
    if (!host) throw new Error("Missing lr-model-canvas-host");
    host.style.width = `${width}px`;
    host.style.height = `${height}px`;
    host.style.flex = "none";
    host.style.minWidth = `${width}px`;
    host.style.minHeight = `${height}px`;
    host.style.maxWidth = `${width}px`;
    host.style.maxHeight = `${height}px`;
    window.dispatchEvent(new Event("resize"));
  }, CAPTURE_CSS);
  await waitForCanvasPixels(page);
}

export async function waitForCaptureReady(page) {
  await page.waitForFunction(() => typeof window.__cardCapture?.ready === "function", null, { timeout: 90_000 });
  await page.evaluate(async () => window.__cardCapture?.ready());
}

export async function capturePose(page, path, t) {
  await page.evaluate(async ({ path, t }) => {
    await window.__cardCapture?.pose(path, t);
  }, { path, t });
}

export async function setCaptureLook(page, mood = "evening") {
  await page.evaluate(async (look) => {
    await window.__cardCapture?.setLook(look);
  }, { quality: "presentation", mood });
  await page.waitForTimeout(1500);
}

async function waitForCanvasPixels(page) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    const size = await readCanvasMetrics(page);
    if (size?.width === CAPTURE_PIXELS.width && size?.height === CAPTURE_PIXELS.height) return;
    await page.waitForTimeout(400);
  }
  const last = await readCanvasMetrics(page);
  throw new Error(
    `Canvas stuck at ${last?.width ?? "?"}×${last?.height ?? "?"} `
    + `(host ${last?.hostW ?? "?"}×${last?.hostH ?? "?"} css, dpr ${last?.dpr ?? "?"})`,
  );
}

async function assertCanvasShape(page) {
  const size = await readCanvasMetrics(page);
  if (!size || size.width !== CAPTURE_PIXELS.width || size.height !== CAPTURE_PIXELS.height) {
    throw new Error(`Canvas pixels ${size?.width}×${size?.height}, expected ${CAPTURE_PIXELS.width}×${CAPTURE_PIXELS.height}`);
  }
  const aspect = size.width / size.height;
  if (Math.abs(aspect - 4 / 3) > 0.02) {
    throw new Error(`Canvas aspect ${aspect.toFixed(3)}, expected 4:3`);
  }
}

export async function grabCanvasPng(page) {
  await prepareCaptureViewport(page);
  await assertCanvasShape(page);
  const canvas = page.locator("[data-testid=lr-model-canvas-host] canvas");
  await page.waitForFunction(
    () => document.querySelector("[data-testid=lr-model-canvas-host] canvas")?.dataset.frameSettled === "1",
    null,
    { timeout: 45_000 },
  );
  await page.waitForTimeout(300);
  const dataUrl = await canvas.evaluate((element) => element.toDataURL("image/png"));
  return Buffer.from(dataUrl.split(",")[1], "base64");
}

/** Pose, resize, wait for a settled frame, then grab. */
export async function captureStillPng(page, path, t) {
  await capturePose(page, path, t);
  return grabCanvasPng(page);
}
