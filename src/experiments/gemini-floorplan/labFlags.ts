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
