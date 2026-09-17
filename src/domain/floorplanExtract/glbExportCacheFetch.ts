import { assertGlbBlob } from "./glbMagic";
import { floorplanGlbQuery, type FloorplanGlbExportFlags } from "./glbExportProfile";
import type { ExtractionResult } from "./types";

async function readExportError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { error?: string };
    return j.error ?? res.statusText;
  } catch {
    return res.statusText || `HTTP ${res.status}`;
  }
}

export async function fetchFloorplanGlbBlob(
  draft: ExtractionResult,
  flags: FloorplanGlbExportFlags,
  apiBase: string,
  signal: AbortSignal,
): Promise<Blob> {
  const base = apiBase.replace(/\/$/, "");
  const res = await fetch(`${base}/export/glb?${floorplanGlbQuery(flags)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft),
    signal,
  });
  const ctype = (res.headers.get("content-type") ?? "").toLowerCase();
  if (!res.ok || ctype.includes("application/json")) {
    throw new Error(await readExportError(res));
  }
  return assertGlbBlob(await res.blob());
}
