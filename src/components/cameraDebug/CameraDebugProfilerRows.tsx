import { formatCameraDebugNumber, type CameraDebugSnapshot } from "../../domain/orbit/cameraDebug";

function count(value: number | null | undefined) {
  return formatCameraDebugNumber(value, 0);
}

function vec(value: readonly number[] | null | undefined) {
  return value ? value.map((n) => formatCameraDebugNumber(n, 2)).join(", ") : "—";
}

/** Profiler rows for the performance card. */
export function CameraDebugProfilerRows({ snapshot }: { snapshot: CameraDebugSnapshot | null }) {
  const idle = snapshot?.frameloop === "demand" && (snapshot.fps ?? 0) < 2;
  return (
    <>
      <div>fps: {count(snapshot?.fps)} · frame {formatCameraDebugNumber(snapshot?.frameMs, 1)} ms{idle ? " · idle" : ""}</div>
      <div>renders: {count(snapshot?.renders)}</div>
      <div>tris: {count(snapshot?.triangles)} · draws: {count(snapshot?.drawCalls)}</div>
      <div>points: {count(snapshot?.points)} · lines: {count(snapshot?.lines)}</div>
      <div>textures: {count(snapshot?.textures)} · geos: {count(snapshot?.geometries)} · programs: {count(snapshot?.programs)}</div>
      <div>camera: {snapshot?.cameraType ?? "—"} · fov {formatCameraDebugNumber(snapshot?.cameraFov, 1)}</div>
      <div>near/far: {formatCameraDebugNumber(snapshot?.cameraNear, 2)} / {formatCameraDebugNumber(snapshot?.cameraFar, 1)} · zoom {formatCameraDebugNumber(snapshot?.cameraZoom, 2)}</div>
      <div>pos: {vec(snapshot?.cameraPosition)}</div>
    </>
  );
}
