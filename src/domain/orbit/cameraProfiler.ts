import type { CameraDebugSnapshot } from "./cameraDebug";

export type GlProfilerInfo = {
  memory?: { textures?: number; geometries?: number };
  render?: { frame?: number; points?: number; lines?: number };
  programs?: readonly unknown[] | null;
};

export type ProfilerCamera = {
  type?: string;
  fov?: number;
  near?: number;
  far?: number;
  zoom?: number;
  position?: { x: number; y: number; z: number };
};

function finiteOrNull(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export type ProfilerSample = Pick<
  CameraDebugSnapshot,
  | "textures"
  | "geometries"
  | "programs"
  | "renders"
  | "points"
  | "lines"
  | "cameraType"
  | "cameraFov"
  | "cameraNear"
  | "cameraFar"
  | "cameraZoom"
  | "cameraPosition"
>;

/** Renderer memory plus the active camera. Missing fields stay null. */
export function readProfilerSample(
  info: GlProfilerInfo | null | undefined,
  camera: ProfilerCamera | null | undefined,
): ProfilerSample {
  const programs = info?.programs;
  const position = camera?.position;
  return {
    textures: finiteOrNull(info?.memory?.textures),
    geometries: finiteOrNull(info?.memory?.geometries),
    programs: Array.isArray(programs) ? programs.length : null,
    renders: finiteOrNull(info?.render?.frame),
    points: finiteOrNull(info?.render?.points),
    lines: finiteOrNull(info?.render?.lines),
    cameraType: camera?.type ?? null,
    cameraFov: finiteOrNull(camera?.fov),
    cameraNear: finiteOrNull(camera?.near),
    cameraFar: finiteOrNull(camera?.far),
    cameraZoom: finiteOrNull(camera?.zoom),
    cameraPosition: position ? [position.x, position.y, position.z] : null,
  };
}
