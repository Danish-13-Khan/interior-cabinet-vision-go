import type { Connect, Plugin } from "vite";
import { loadEnv } from "vite";
import {
  FLOORPLAN_RESPONSE_SCHEMA,
  FLOORPLAN_VISION_SYSTEM,
  FLOORPLAN_VISION_USER,
} from "../../src/experiments/gemini-floorplan/visionPrompt";

type EnvMap = Record<string, string>;

function readBody(req: Connect.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function serverApiKey(env: EnvMap): string | null {
  const key = (env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || "").trim();
  return key || null;
}

function attachProxy(middlewares: Connect.Server, env: EnvMap) {
  middlewares.use("/api/lab/gemini-vision", async (req, res, next) => {
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }
    if (req.method !== "POST") {
      next();
      return;
    }

    try {
      const apiKey = serverApiKey(env);
      if (!apiKey) {
        res.statusCode = 503;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({
          error: "Server has no GEMINI_API_KEY / VITE_GEMINI_API_KEY. Add it to .env (server-side).",
        }));
        return;
      }

      const raw = await readBody(req);
      const body = JSON.parse(raw) as {
        model?: string;
        mimeType?: string;
        imageBase64?: string;
      };
      if (!body.mimeType || !body.imageBase64) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "mimeType and imageBase64 are required." }));
        return;
      }

      const model = (body.model || env.VITE_GEMINI_MODEL || "gemini-3.6-flash").trim();
      const url =
        `https://generativelanguage.googleapis.com/v1beta/models/` +
        `${encodeURIComponent(model)}:generateContent`;

      const upstream = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: FLOORPLAN_VISION_SYSTEM }] },
          contents: [{
            role: "user",
            parts: [
              { inline_data: { mime_type: body.mimeType, data: body.imageBase64 } },
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

      const text = await upstream.text();
      res.statusCode = upstream.status;
      res.setHeader("Content-Type", "application/json");
      res.end(text);
    } catch (err) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({
        error: err instanceof Error ? err.message : "Proxy request failed",
      }));
    }
  });
}

/** Dev/preview middleware: browser calls /api/lab/gemini-vision; key stays on server. */
export function geminiFloorplanProxyPlugin(): Plugin {
  return {
    name: "gemini-floorplan-lab-proxy",
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.root, "");
      attachProxy(server.middlewares, env);
    },
    configurePreviewServer(server) {
      const env = loadEnv(server.config.mode, server.config.root, "");
      attachProxy(server.middlewares, env);
    },
  };
}
