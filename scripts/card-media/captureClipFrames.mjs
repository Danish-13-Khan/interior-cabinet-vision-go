import { copyFile, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { checkClipExposureSamples } from "./clipExposure.mjs";
import { CLIP_LIMITS_KB, encodeClipFromFrames } from "./encodeClip.mjs";
import { capturePose, grabCanvasPng, prepareCaptureViewport } from "./grabFrame.mjs";

const framePath = (dir, index) => join(dir, `frame_${String(index + 1).padStart(4, "0")}.png`);

/** Dissolve from the overview render to the room render; `weight` is the room's share. */
async function blendFrames(overviewPng, roomPng, weight) {
  const [a, b] = await Promise.all([loadImage(overviewPng), loadImage(roomPng)]);
  const canvas = createCanvas(a.width, a.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(a, 0, 0);
  ctx.globalAlpha = weight;
  ctx.drawImage(b, 0, 0, a.width, a.height);
  return canvas.encode("png");
}

/**
 * Render every frame of a clip into `dir`. Room arcs are one pass. The
 * apartment glide is two: the overview scene up to the end of the cross-fade
 * window, then the room scene from its start, so the scene changes twice in
 * all and frames inside the window are blends of both renders.
 */
async function captureFrames(page, dir, kind, timeline) {
  await prepareCaptureViewport(page);
  const count = timeline.CARD_CLIP_FRAME_COUNT;
  const frames = Array.from({ length: count }, (_, index) => {
    const t = timeline.clipPathParameter(kind, index);
    const weight = kind === "overview-to-hero" ? timeline.clipCrossfadeWeight(t) : null;
    return { index, t, weight };
  });
  const grab = async (t, scene) => {
    await capturePose(page, kind, t, scene ? { scene } : {});
    return grabCanvasPng(page, { skipViewportPrep: true });
  };

  if (kind !== "overview-to-hero") {
    for (const frame of frames) await writeFile(framePath(dir, frame.index), await grab(frame.t));
    return frames;
  }

  const [windowStart] = timeline.CARD_CLIP_CROSSFADE_T;
  const overviewOnly = (frame) => frame.weight === null && frame.t <= windowStart;
  const overviewRenders = new Map();
  for (const frame of frames.filter((item) => overviewOnly(item) || item.weight !== null)) {
    const png = await grab(frame.t, "overview");
    if (frame.weight === null) await writeFile(framePath(dir, frame.index), png);
    else overviewRenders.set(frame.index, png);
  }
  for (const frame of frames.filter((item) => !overviewOnly(item))) {
    const png = await grab(frame.t, "room");
    const out = frame.weight === null ? png : await blendFrames(overviewRenders.get(frame.index), png, frame.weight);
    await writeFile(framePath(dir, frame.index), out);
  }
  return frames;
}

/**
 * Capture, check and encode one clip. Nothing reaches `public/` unless every
 * check passes; the frames and encodes live in a temp folder that is always removed.
 */
export async function saveClip({ root, relWebm, relMp4, page, kind, timeline, failures, exposureOverrides }) {
  console.log(`  clip ${relWebm}`);
  const dir = await mkdtemp(join(tmpdir(), "card-clip-"));
  const fail = (message) => {
    failures.push(`${relWebm}: ${message}`);
    console.error(`  SKIP clip: ${message}`);
    return null;
  };
  try {
    const frames = await captureFrames(page, dir, kind, timeline);
    console.log(`    captured ${frames.length} frames`);
    const exposure = await checkClipExposureSamples(
      frames.map((frame) => ({ ...frame, path: framePath(dir, frame.index) })),
      kind,
      exposureOverrides,
    );
    if (exposure.length) return fail(exposure.join("; "));

    const tmpWebm = join(dir, "clip.webm");
    const tmpMp4 = join(dir, "clip.mp4");
    const { webmKb, mp4Kb } = await encodeClipFromFrames(dir, tmpWebm, tmpMp4, frames.length, timeline.CARD_CLIP_FPS);
    const sizes = [];
    if (webmKb > CLIP_LIMITS_KB.webm) sizes.push(`webm ${webmKb} KB > ${CLIP_LIMITS_KB.webm}`);
    if (mp4Kb > CLIP_LIMITS_KB.mp4) sizes.push(`mp4 ${mp4Kb} KB > ${CLIP_LIMITS_KB.mp4}`);
    if (sizes.length) return fail(sizes.join("; "));

    const outWebm = join(root, "public", relWebm);
    const outMp4 = join(root, "public", relMp4);
    await mkdir(dirname(outWebm), { recursive: true });
    await copyFile(tmpWebm, outWebm);
    await copyFile(tmpMp4, outMp4);
    console.log(`  wrote ${relWebm} (${webmKb} KB), ${relMp4} (${mp4Kb} KB)`);
    return { webm: relWebm, mp4: relMp4, durationMs: timeline.CARD_CLIP_DURATION_MS };
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
