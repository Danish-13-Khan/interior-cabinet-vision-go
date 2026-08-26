import type { CameraEntity } from "../../interiorProject";
import type { CompiledSceneBounds } from "../sceneTypes";

export type CameraFramingIssue = {
  code:
    | "missing-camera"
    | "invalid-fov"
    | "camera-inside-bounds"
    | "target-outside-room"
    | "degenerate-look"
    | "eye-too-low"
    | "eye-too-high"
    | "eye-off-standing"
    | "ceiling-heavy"
    | "cut-feet";
  severity: "error" | "warning";
  message: string;
};

export type CameraFramingReport = {
  ok: boolean;
  cameraId: string | null;
  cameraName: string | null;
  issues: CameraFramingIssue[];
};

function distance3(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number },
) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.hypot(dx, dy, dz);
}

function insideXz(point: { x: number; z: number }, bounds: CompiledSceneBounds, padMm: number) {
  return (
    point.x >= bounds.min.x + padMm
    && point.x <= bounds.max.x - padMm
    && point.z >= bounds.min.z + padMm
    && point.z <= bounds.max.z - padMm
  );
}

/** Validate active camera framing against compiled room bounds. */
export function validateCameraFraming(
  camera: CameraEntity | null | undefined,
  bounds: CompiledSceneBounds,
): CameraFramingReport {
  if (!camera) {
    return {
      ok: false,
      cameraId: null,
      cameraName: null,
      issues: [{
        code: "missing-camera",
        severity: "error",
        message: "No active camera is selected for framing.",
      }],
    };
  }

  const issues: CameraFramingIssue[] = [];
  const name = camera.name.toLowerCase();
  const isDetail = name.includes("detail") || name.includes("lamp");
  const isTelevision = name.includes("tv") || name.includes("millwork");

  if (
    !Number.isFinite(camera.fieldOfViewDegrees)
    || camera.fieldOfViewDegrees < 18
    || camera.fieldOfViewDegrees > 90
  ) {
    issues.push({
      code: "invalid-fov",
      severity: "error",
      message: `Camera FOV ${camera.fieldOfViewDegrees}° is outside 18–90°.`,
    });
  }

  const look = distance3(camera.position, camera.target);
  if (look < 200) {
    issues.push({
      code: "degenerate-look",
      severity: "error",
      message: "Camera position and target are nearly coincident.",
    });
  }

  if (camera.position.y < 400) {
    issues.push({
      code: "eye-too-low",
      severity: "warning",
      message: `Camera eye height ${Math.round(camera.position.y)}mm is unusually low.`,
    });
  }
  if (camera.position.y > bounds.size.heightMm * 1.35 + 800) {
    issues.push({
      code: "eye-too-high",
      severity: "warning",
      message: `Camera eye height ${Math.round(camera.position.y)}mm is far above the room.`,
    });
  }

  const standingMin = isDetail ? 1200 : 1400;
  const standingMax = isDetail ? 1550 : 1700;
  if (camera.position.y < standingMin || camera.position.y > standingMax) {
    issues.push({
      code: "eye-off-standing",
      severity: "warning",
      message: `Eye height ${Math.round(camera.position.y)}mm is outside living-room standing range (${standingMin}–${standingMax}mm).`,
    });
  }

  const horizontal = Math.hypot(
    camera.target.x - camera.position.x,
    camera.target.z - camera.position.z,
  );
  const pitch = (camera.target.y - camera.position.y) / Math.max(1, horizontal);
  if (pitch > 0.16) {
    issues.push({
      code: "ceiling-heavy",
      severity: "warning",
      message: "Look direction pitches up too far — framing may overweight the ceiling.",
    });
  }

  const cutFeetLimit = isTelevision ? 1180 : isDetail ? 1050 : 980;
  if (camera.target.y > cutFeetLimit) {
    issues.push({
      code: "cut-feet",
      severity: "warning",
      message: `Target height ${Math.round(camera.target.y)}mm is high enough to crop furniture feet.`,
    });
  }

  const roomPad = Math.min(bounds.size.widthMm, bounds.size.depthMm) * 0.08;
  if (insideXz(camera.position, bounds, roomPad) && camera.position.y < bounds.max.y - 200) {
    issues.push({
      code: "camera-inside-bounds",
      severity: "warning",
      message: "Camera eye sits inside the room volume; framing may clip architecture.",
    });
  }

  const targetPad = -Math.min(bounds.size.widthMm, bounds.size.depthMm) * 0.15;
  if (!insideXz(camera.target, bounds, targetPad)) {
    issues.push({
      code: "target-outside-room",
      severity: "warning",
      message: "Camera target is outside an expanded room footprint.",
    });
  }

  return {
    ok: !issues.some((issue) => issue.severity === "error"),
    cameraId: camera.id,
    cameraName: camera.name,
    issues,
  };
}
