import type { ExtractionResult } from "./types";
import { testGlbHeaderBlob } from "./glbMagic";

export const glbDraftA = {
  schema_version: "1.0",
  units: "meters",
  polygons: {
    rooms: [],
    walls: [{ outer: [[0, 0], [2, 0], [2, 0.2], [0, 0.2]] }],
    doors: [],
    windows: [],
  },
} as ExtractionResult;

export function glbDraftN(n: number): ExtractionResult {
  return {
    ...glbDraftA,
    polygons: {
      ...glbDraftA.polygons,
      walls: [{ outer: [[0, 0], [n, 0], [n, 0.2], [0, 0.2]] }],
    },
  } as ExtractionResult;
}

export function okGlbResponse(extra: number[] = [1, 2, 3]) {
  return new Response(testGlbHeaderBlob(extra), {
    status: 200,
    headers: { "content-type": "model/gltf-binary" },
  });
}

export function readyOkResponse(version = "0.5.0") {
  return new Response(JSON.stringify({ ok: true, version, service: "cabinet-floorplan" }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
