import { fileToBase64 } from "./imageGuards";
import {
  callGeminiFloorplanVision,
  readGeminiApiKey,
  resolveGeminiModel,
} from "./geminiVisionClient";
import { normalizeProposalToMm } from "./normalizeProposal";
import { parseGeminiFloorProposal } from "./proposalSchema";
import type { VisionExtractResult } from "./proposalTypes";

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

/** Full Phase 1 pipeline: image file → Gemini Vision → validate → mm. */
export async function extractFloorPlanFromImage(
  file: File,
  mimeType: string,
): Promise<VisionExtractResult> {
  const apiKey = readGeminiApiKey();
  if (!apiKey) {
    return {
      ok: false,
      error: "VITE_GEMINI_API_KEY is not set. Add it to .env and restart Vite.",
    };
  }

  const model = resolveGeminiModel();
  const started = performance.now();
  try {
    const imageBase64 = await fileToBase64(file);
    const vision = await callGeminiFloorplanVision({
      apiKey,
      model,
      mimeType,
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
