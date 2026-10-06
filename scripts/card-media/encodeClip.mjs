import { spawnSync } from "node:child_process";
import { stat } from "node:fs/promises";
import ffmpegPath from "ffmpeg-static";

export const CLIP_W = 800;
export const CLIP_H = 600;
export const CLIP_LIMITS_KB = { webm: 600, mp4: 900 };

function runFfmpeg(args) {
  if (!ffmpegPath) throw new Error("ffmpeg-static binary missing");
  const result = spawnSync(ffmpegPath, args, { stdio: "pipe", encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr || `ffmpeg exited ${result.status}`);
  }
}

/** Encode PNG sequence to VP9 WebM + H.264 MP4 at 800×600 (D3, D10). */
export async function encodeClipFromFrames(pngDir, outWebm, outMp4, frameCount, fps = 24) {
  const input = `${pngDir}/frame_%04d.png`;
  const scale = `scale=${CLIP_W}:${CLIP_H}:flags=lanczos`;
  const commonIn = ["-y", "-framerate", String(fps), "-i", input, "-frames:v", String(frameCount)];
  runFfmpeg([
    ...commonIn,
    "-vf", scale,
    "-c:v", "libvpx-vp9",
    "-b:v", "0",
    "-crf", "34",
    "-row-mt", "1",
    "-pix_fmt", "yuv420p",
    outWebm,
  ]);
  runFfmpeg([
    ...commonIn,
    "-vf", scale,
    "-c:v", "libx264",
    "-preset", "slow",
    "-crf", "26",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    outMp4,
  ]);
  const webmKb = Math.round((await stat(outWebm)).size / 1024);
  const mp4Kb = Math.round((await stat(outMp4)).size / 1024);
  return { webmKb, mp4Kb };
}
