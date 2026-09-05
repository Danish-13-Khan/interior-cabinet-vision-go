import { fileToBase64 } from "./imageGuards";
import {
  callGeminiFloorplanVision,
  readGeminiApiKey,
  resolveGeminiModel,
} from "./geminiVisionClient";
import { hasGeminiVisionConfigured, shouldUseGeminiProxy } from "./labFlags";
import { normalizeProposalToMm } from "./normalizeProposal";
import { parseGeminiFloorProposal } from "./proposalSchema";
import type { VisionExtractResult } from "./proposalTypes";
import { prepareVisionImage } from "./stripImageExif";

function parseJsonText(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Response was not valid JSON");
  }
}

/** Full pipeline: image → downscale/strip → Gemini Vision → validate → mm. */
export async function extractFloorPlanFromImage(
  file: File,
  mimeType: string,
): Promise<VisionExtractResult> {
  if (!hasGeminiVisionConfigured()) {
    return {
      ok: false,
      error:
        "Vision unavailable. Start Vite with GEMINI_API_KEY in .env (proxy) or set VITE_GEMINI_API_KEY.",
    };
  }

  const model = resolveGeminiModel();
  const started = performance.now();
  try {
    const cleaned = await prepareVisionImage(file);
    const imageBase64 = await fileToBase64(cleaned);
    const vision = await callGeminiFloorplanVision({
      apiKey: shouldUseGeminiProxy() ? undefined : readGeminiApiKey() ?? undefined,
      model,
      mimeType: cleaned.type || mimeType,
      imageBase64,
    });
    const latencyMs = Math.round(performance.now() - started);
    const metrics = {
      latencyMs,
      promptTokens: vision.promptTokens,
      candidatesTokens: vision.candidatesTokens,
      totalTokens: vision.totalTokens,
      model,
    };

    let parsed: unknown;
    try {
      parsed = parseJsonText(vision.text);
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "JSON parse failed",
        rawText: vision.text,
        metrics,
      };
    }

    const { proposal, errors } = parseGeminiFloorProposal(parsed);
    if (!proposal) {
      return {
        ok: false,
        error: "Proposal failed schema validation",
        rawText: vision.text,
        validationErrors: errors,
        metrics,
      };
    }

    return {
      ok: true,
      proposal: normalizeProposalToMm(proposal),
      rawText: vision.text,
      metrics,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Vision request failed",
      metrics: {
        latencyMs: Math.round(performance.now() - started),
        model,
      },
    };
  }
}
