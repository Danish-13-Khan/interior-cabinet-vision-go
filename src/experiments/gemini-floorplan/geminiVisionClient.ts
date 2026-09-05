import {
  FLOORPLAN_RESPONSE_SCHEMA,
  FLOORPLAN_VISION_SYSTEM,
  FLOORPLAN_VISION_USER,
} from "./visionPrompt";
import { shouldUseGeminiProxy } from "./labFlags";

export type GeminiVisionRequest = {
  model: string;
  mimeType: string;
  imageBase64: string;
  /** Optional direct key; omit when using the lab proxy. */
  apiKey?: string;
};

export type GeminiVisionResponse = {
  text: string;
  promptTokens?: number;
  candidatesTokens?: number;
  totalTokens?: number;
};

type GeminiApiJson = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
  error?: { message?: string };
};

export function resolveGeminiModel(): string {
  const fromEnv = import.meta.env.VITE_GEMINI_MODEL;
  if (typeof fromEnv === "string" && fromEnv.trim()) return fromEnv.trim();
  return "gemini-3.6-flash";
}

export function readGeminiApiKey(): string | null {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (typeof key !== "string" || !key.trim()) return null;
  return key.trim();
}

function parseGeminiJson(json: GeminiApiJson, status: number): GeminiVisionResponse {
  if (status >= 400) {
    throw new Error(json.error?.message ?? `Gemini HTTP ${status}`);
  }
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text.trim()) throw new Error("Gemini returned empty content");
  return {
    text,
    promptTokens: json.usageMetadata?.promptTokenCount,
    candidatesTokens: json.usageMetadata?.candidatesTokenCount,
    totalTokens: json.usageMetadata?.totalTokenCount,
  };
}

async function callViaProxy(req: GeminiVisionRequest): Promise<GeminiVisionResponse> {
  const res = await fetch("/api/lab/gemini-vision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: req.model,
      mimeType: req.mimeType,
      imageBase64: req.imageBase64,
    }),
  });
  const json = (await res.json()) as GeminiApiJson & { error?: string };
  if (!res.ok) {
    throw new Error(json.error?.message ?? (typeof json.error === "string" ? json.error : `Proxy HTTP ${res.status}`));
  }
  return parseGeminiJson(json, res.status);
}

async function callDirect(req: GeminiVisionRequest): Promise<GeminiVisionResponse> {
  if (!req.apiKey) throw new Error("Missing Gemini API key for direct Vision call.");
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${encodeURIComponent(req.model)}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": req.apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: FLOORPLAN_VISION_SYSTEM }] },
      contents: [{
        role: "user",
        parts: [
          { inline_data: { mime_type: req.mimeType, data: req.imageBase64 } },
          { text: FLOORPLAN_VISION_USER },
        ],
      }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: FLOORPLAN_RESPONSE_SCHEMA,
      },
    }),
  });
  const json = (await res.json()) as GeminiApiJson;
  return parseGeminiJson(json, res.status);
}

/** Calls Gemini via lab proxy (preferred) or direct browser key. */
export async function callGeminiFloorplanVision(
  req: GeminiVisionRequest,
): Promise<GeminiVisionResponse> {
  if (shouldUseGeminiProxy()) return callViaProxy(req);
  return callDirect(req);
}
