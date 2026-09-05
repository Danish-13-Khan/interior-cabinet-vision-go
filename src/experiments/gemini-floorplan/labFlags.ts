/** Lab is on in Vite DEV, or when explicitly flagged for a build. */
export function isGeminiFloorplanLabEnabled(): boolean {
  if (import.meta.env.VITE_ENABLE_GEMINI_LAB === "true") return true;
  return Boolean(import.meta.env.DEV);
}

/** Presence only — never read or log the key value in UI. */
export function hasGeminiApiKeyConfigured(): boolean {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  return typeof key === "string" && key.trim().length > 0;
}

/** Prefer local Vite proxy so the API key is not required in the browser bundle. */
export function shouldUseGeminiProxy(): boolean {
  if (import.meta.env.VITE_GEMINI_USE_PROXY === "false") return false;
  if (import.meta.env.VITE_GEMINI_USE_PROXY === "true") return true;
  return Boolean(import.meta.env.DEV);
}

/** True when Vision can run (proxy in DEV and/or client key). */
export function hasGeminiVisionConfigured(): boolean {
  return hasGeminiApiKeyConfigured() || shouldUseGeminiProxy();
}
