import type { CyclesStillBundle } from "../domain/livingRoom";
import { blobToDataUrl } from "../utils/dataUrl";

/**
 * Client for `scripts/cycles/serve.mjs`. The service may be the local Blender install,
 * the Docker image in `docker/cycles`, or a box on EC2: the app only knows a URL.
 * The URL comes from `VITE_CYCLES_RENDER_URL` at build time or from local storage,
 * so a shop can point a seat at its own box without a rebuild.
 */
export const CYCLES_SERVICE_URL_KEY = "cabinet-designer:cycles-service-url";

export function cyclesServiceUrl(): string | null {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(CYCLES_SERVICE_URL_KEY);
  } catch {
    stored = null;
  }
  const env = (import.meta.env.VITE_CYCLES_RENDER_URL as string | undefined) ?? "";
  const url = (stored ?? env).trim();
  return url ? url.replace(/\/+$/, "") : null;
}

export function setCyclesServiceUrl(url: string | null) {
  try {
    if (url && url.trim()) localStorage.setItem(CYCLES_SERVICE_URL_KEY, url.trim());
    else localStorage.removeItem(CYCLES_SERVICE_URL_KEY);
  } catch {
    /* private mode keeps the in-memory default */
  }
}

export type CyclesServiceJob = {
  id: string;
  status: "queued" | "rendering" | "done" | "failed" | "cancelled";
  error: string | null;
  log: string[];
};

export type CyclesServiceResult = {
  provenanceText: string;
  stillDataUrl: string;
  job: CyclesServiceJob;
};

const POLL_MS = 2000;

async function request(base: string, path: string, init: RequestInit = {}) {
  const response = await fetch(`${base}${path}`, init);
  if (!response.ok) {
    let detail = `${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) detail = body.error;
    } catch {
      /* no JSON body */
    }
    throw new Error(`Render service: ${detail}`);
  }
  return response;
}

/** Post the bundle, poll until done, then fetch the still and provenance. */
export async function renderBundleOnService(
  bundle: CyclesStillBundle,
  options: { onStatus?: (job: CyclesServiceJob) => void; signal?: AbortSignal } = {},
): Promise<CyclesServiceResult> {
  const base = cyclesServiceUrl();
  if (!base) throw new Error("No render service configured.");
  const created = await request(base, "/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bundle),
    signal: options.signal,
  });
  const { id } = (await created.json()) as { id: string };
  for (;;) {
    if (options.signal?.aborted) {
      await fetch(`${base}/jobs/${id}`, { method: "DELETE" }).catch(() => undefined);
      throw new Error("Render cancelled.");
    }
    const job = (await (await request(base, `/jobs/${id}`)).json()) as CyclesServiceJob;
    options.onStatus?.(job);
    if (job.status === "done") {
      const provenanceText = await (await request(base, `/jobs/${id}/provenance.json`)).text();
      const still = await (await request(base, `/jobs/${id}/still.png`)).blob();
      return { provenanceText, stillDataUrl: await blobToDataUrl(still), job };
    }
    if (job.status === "failed" || job.status === "cancelled") {
      throw new Error(job.error ?? `Render ${job.status}.`);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
}
