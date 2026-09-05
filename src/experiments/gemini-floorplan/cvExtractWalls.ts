import { morphClean, rgbaToGray, thresholdToBinary } from "./cvBinaryMask";
import {
  findAxisWallSegments,
  inkBoundingBox,
  inkRatio,
  type AxisSegmentOptions,
} from "./cvAxisSegments";
import { mapSegmentsToProposalWalls } from "./cvMapToProposal";
import type { BinaryMask, GrayBuffer } from "./geometryMode";
import type { GeminiFloorProposal, ProposalWall } from "./proposalTypes";

export type CvWallExtractOk = {
  ok: true;
  walls: ProposalWall[];
  segmentCount: number;
  inkRatio: number;
};

export type CvWallExtractErr = {
  ok: false;
  reason: string;
  segmentCount?: number;
  inkRatio?: number;
};

export type CvWallExtractResult = CvWallExtractOk | CvWallExtractErr;

export type CvExtractOptions = AxisSegmentOptions & {
  /** Max longest edge for working raster. Default 800. */
  maxEdgePx?: number;
  minWalls?: number;
  maxWalls?: number;
  minInkRatio?: number;
  maxInkRatio?: number;
};

const CV_MAX_EDGE = 800;

/** Pure path: gray → binary → segments → proposal walls (for tests). */
export function extractWallsFromGray(
  gray: GrayBuffer,
  proposal: GeminiFloorProposal,
  options: CvExtractOptions = {},
): CvWallExtractResult {
  const minWalls = options.minWalls ?? 3;
  const maxWalls = options.maxWalls ?? 80;
  const minInk = options.minInkRatio ?? 0.004;
  const maxInk = options.maxInkRatio ?? 0.35;

  const binary: BinaryMask = morphClean(thresholdToBinary(gray));
  const ratio = inkRatio(binary);
  if (ratio < minInk || ratio > maxInk) {
    return {
      ok: false,
      reason: `Ink density ${ratio.toFixed(3)} outside usable range (photo/noise or empty).`,
      inkRatio: ratio,
    };
  }
  const box = inkBoundingBox(binary);
  if (!box) {
    return { ok: false, reason: "No ink detected in plan image.", inkRatio: ratio };
  }
  const segments = findAxisWallSegments(binary, options);
  if (segments.length < minWalls) {
    return {
      ok: false,
      reason: `Only ${segments.length} axis segments (need ≥${minWalls}).`,
      segmentCount: segments.length,
      inkRatio: ratio,
    };
  }
  if (segments.length > maxWalls) {
    return {
      ok: false,
      reason: `Too many segments (${segments.length}) — noisy scan.`,
      segmentCount: segments.length,
      inkRatio: ratio,
    };
  }
  const walls = mapSegmentsToProposalWalls(segments, box, proposal);
  return { ok: true, walls, segmentCount: segments.length, inkRatio: ratio };
}

export async function loadFileAsGray(file: File, maxEdgePx = CV_MAX_EDGE): Promise<GrayBuffer> {
  const bitmap = await createImageBitmap(file);
  try {
    const longest = Math.max(bitmap.width, bitmap.height);
    const scale = longest > maxEdgePx ? maxEdgePx / longest : 1;
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Canvas unavailable for classical CV.");
    ctx.drawImage(bitmap, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    return rgbaToGray(imageData.data, width, height);
  } finally {
    bitmap.close();
  }
}

export async function extractCvWallCandidates(
  file: File,
  proposal: GeminiFloorProposal,
  options: CvExtractOptions = {},
): Promise<CvWallExtractResult> {
  try {
    const gray = await loadFileAsGray(file, options.maxEdgePx ?? CV_MAX_EDGE);
    return extractWallsFromGray(gray, proposal, options);
  } catch (e) {
    return {
      ok: false,
      reason: e instanceof Error ? e.message : "Classical CV failed to read image.",
    };
  }
}
