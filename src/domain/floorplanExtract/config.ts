/** Local sidecar default — no secrets in Vite. */
export function floorplanApiBase(): string {
  const fromEnv = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_FLOORPLAN_API_BASE;
  const raw = (fromEnv ?? "https://cabinet-floorplan.onrender.com").trim();
  return raw.replace(/\/$/, "");
}
