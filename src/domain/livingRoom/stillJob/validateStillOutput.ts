import { gate } from "./qaHelpers";
import type { StillJobGateResult } from "./types";

/** §3.1 deterministic rerun: mean abs diff ≤ 2% of 8-bit channel range. */
export const STILL_DETERMINISTIC_RERUN_MAD_LIMIT = 0.02 * 255;

export type PixelBufferCompareResult =
  | { ok: true; mad: number; channels: number }
  | { ok: false; reason: string };

export function comparePixelBuffers(
  pixelsA: Uint8ClampedArray,
  pixelsB: Uint8ClampedArray,
): PixelBufferCompareResult {
  if (pixelsA.length !== pixelsB.length) {
    return {
      ok: false,
      reason: `RGBA length mismatch ${pixelsA.length} vs ${pixelsB.length}`,
    };
  }
  if (pixelsA.length === 0 || pixelsA.length % 4 !== 0) {
    return { ok: false, reason: "empty or non-RGBA pixel buffer" };
  }

  let sum = 0;
  let channels = 0;
  for (let i = 0; i < pixelsA.length; i += 4) {
    if (pixelsA[i + 3] < 8 && pixelsB[i + 3] < 8) continue;
    sum += Math.abs(pixelsA[i] - pixelsB[i]);
    sum += Math.abs(pixelsA[i + 1] - pixelsB[i + 1]);
    sum += Math.abs(pixelsA[i + 2] - pixelsB[i + 2]);
    channels += 3;
  }
  if (channels === 0) {
    return { ok: false, reason: "no comparable RGB channels in pixel buffers" };
  }
  return { ok: true, mad: sum / channels, channels };
}

export function meanAbsoluteChannelDiff(
  pixelsA: Uint8ClampedArray,
  pixelsB: Uint8ClampedArray,
): number {
  const compared = comparePixelBuffers(pixelsA, pixelsB);
  if (!compared.ok) return Number.NaN;
  return compared.mad;
}

export function validateDeterministicRerun(
  pixelsA: Uint8ClampedArray,
  pixelsB: Uint8ClampedArray,
): StillJobGateResult {
  const compared = comparePixelBuffers(pixelsA, pixelsB);
  if (!compared.ok) {
    return gate("deterministic_rerun", false, compared.reason);
  }
  return gate(
    "deterministic_rerun",
    compared.mad <= STILL_DETERMINISTIC_RERUN_MAD_LIMIT,
    `mean abs channel Δ=${compared.mad.toFixed(3)} (${compared.channels} channels; limit ${STILL_DETERMINISTIC_RERUN_MAD_LIMIT.toFixed(2)})`,
    compared.mad,
    STILL_DETERMINISTIC_RERUN_MAD_LIMIT,
  );
}
