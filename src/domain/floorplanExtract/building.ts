import { floorplanApiBase } from "./config";
import type { ExtractionResult } from "./types";

export type MultiFloorLevel = {
  id: string;
  name: string;
  elevation_m: number;
  extract: ExtractionResult;
};

export type MultiFloorProject = {
  schema_version: string;
  floors: MultiFloorLevel[];
};

export type BuildingExportMode = "stack" | "explode" | "cutaway";

export function wrapSingleFloorBuilding(
  extract: ExtractionResult,
  opts?: { id?: string; name?: string; elevation_m?: number },
): MultiFloorProject {
  return {
    schema_version: "1.0",
    floors: [{
      id: opts?.id ?? "L0",
      name: opts?.name ?? "Ground",
      elevation_m: opts?.elevation_m ?? 0,
      extract,
    }],
  };
}

async function readError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { error?: string };
    return j.error ?? res.statusText;
  } catch {
    return res.statusText || `HTTP ${res.status}`;
  }
}

/** Preview/download only — never the editable graph. */
export async function exportFloorplanBuilding(
  project: MultiFloorProject,
  mode: BuildingExportMode = "stack",
): Promise<Blob> {
  const q = new URLSearchParams({
    mode,
    strict: "0",
    props: "1",
    floors: "1",
    doors: "1",
    frames: "1",
    glass: "1",
    trim: "1",
    union: "1",
  });
  const res = await fetch(`${floorplanApiBase()}/export/building?${q}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(project),
  });
  const ctype = res.headers.get("content-type") ?? "";
  if (!res.ok || ctype.includes("application/json")) {
    throw new Error(await readError(res));
  }
  return await res.blob();
}
