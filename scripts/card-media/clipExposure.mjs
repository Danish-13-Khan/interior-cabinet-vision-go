import { loadImage, createCanvas } from "@napi-rs/canvas";
import { exposureProblems, formatExposure, readExposure } from "../showcase-tour/still-exposure.mjs";

/**
 * Sampled frames per clip kind. Room arcs: the poster pose and both turns.
 * Apartment glides: the plan hold, mid-glide (a blended frame), the hero hold.
 */
const SAMPLES = {
  "room-arc": [0, 24, 72],
  "overview-to-hero": [0, 48, 95],
};

/**
 * Limits for a sampled frame. Only the hero hold is an interior frame read in
 * full. Everything before it is a raised view on the backdrop, read on the
 * subject with the plan limits: mid-glide looks down into a pale room, which
 * reads brighter than an eye-level room still (the 3 BHK mid-glide reads 174).
 */
function sampleLimits(kind, t) {
  if (kind === "room-arc") return { mood: "evening", subjectOnly: true };
  if (t >= 1) return { mood: "evening-apartment-hero", subjectOnly: false };
  return { mood: "plan-evening", subjectOnly: true, plan: true };
}

/**
 * @param {{ index: number, t: number, path: string }[]} frames
 * @param {"room-arc" | "overview-to-hero"} kind
 * @param {{ plan?: object, hero?: object }} [overrides] per-target limit exceptions
 */
export async function checkClipExposureSamples(frames, kind, overrides = {}) {
  const problems = [];
  for (const index of SAMPLES[kind]) {
    const frame = frames[index];
    if (!frame) continue;
    const image = await loadImage(frame.path);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);
    const limits = sampleLimits(kind, frame.t);
    const exposure = readExposure(ctx.getImageData(0, 0, image.width, image.height).data, {
      subjectOnly: limits.subjectOnly,
      width: image.width,
    });
    const extra = limits.plan ? overrides.plan : limits.mood === "evening-apartment-hero" ? overrides.hero : undefined;
    console.log(`    frame ${index} (t=${frame.t.toFixed(2)}) — ${formatExposure(exposure)}`);
    problems.push(...exposureProblems(exposure, limits.mood, extra).map((item) => `frame ${index}: ${item}`));
  }
  return problems;
}
