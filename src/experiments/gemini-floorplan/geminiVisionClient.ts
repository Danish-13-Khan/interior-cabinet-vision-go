import {
  FLOORPLAN_RESPONSE_SCHEMA,
  FLOORPLAN_VISION_SYSTEM,
  FLOORPLAN_VISION_USER,
} from "./visionPrompt";

export type GeminiVisionRequest = {
  apiKey: string;
  model: string;
  mimeType: string;
  imageBase64: string;
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
  return "gemini-2.0-flash";
}

export function readGeminiApiKey(): string | null {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (typeof key !== "string" || !key.trim()) return null;
  return key.trim();
}

/** Calls Gemini generateContent with image + structured JSON config. */
export async function callGeminiFloorplanVision(
  req: GeminiVisionRequest,
): Promise<GeminiVisionResponse> {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${encodeURIComponent(req.model)}:generateContent`;

  const body = {
    systemInstruction: { parts: [{ text: FLOORPLAN_VISION_SYSTEM }] },
    contents: [
      {
        role: "user",
        parts: [
          { inline_data: { mime_type: req.mimeType, data: req.imageBase64 } },
          { text: FLOORPLAN_VISION_USER },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: FLOORPLAN_RESPONSE_SCHEMA,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": req.apiKey,
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as GeminiApiJson;
  if (!res.ok) {
    throw new Error(json.error?.message ?? `Gemini HTTP ${res.status}`);
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
