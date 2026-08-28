import { DEFAULT_RENDER_SETTINGS } from "./defaults";
import type {
  EntityExtensions,
  InteriorValidationIssue,
  ParameterValue,
  RenderSettings,
} from "./types";

export type UnknownRecord = Record<string, unknown>;

export const MAX_PROJECT_ENTITIES_PER_COLLECTION = 10_000;

export function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function records(value: unknown): UnknownRecord[] {
  return Array.isArray(value)
    ? value.filter(isRecord).slice(0, MAX_PROJECT_ENTITIES_PER_COLLECTION)
    : [];
}

export function text(value: unknown, fallback: string, maxLength = 160): string {
  const candidate = typeof value === "string" ? value.trim() : "";
  return (candidate || fallback).slice(0, maxLength);
}

export function numberIn(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

export function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function extensions(value: unknown): EntityExtensions | undefined {
  return isRecord(value) ? value : undefined;
}

export function point2(value: unknown) {
  const source = isRecord(value) ? value : {};
  return {
    x: numberIn(source.x, 0, -1_000_000, 1_000_000),
    z: numberIn(source.z, 0, -1_000_000, 1_000_000),
  };
}

export function point3(value: unknown) {
  const source = isRecord(value) ? value : {};
  return {
    x: numberIn(source.x, 0, -1_000_000, 1_000_000),
    y: numberIn(source.y, 0, -1_000_000, 1_000_000),
    z: numberIn(source.z, 0, -1_000_000, 1_000_000),
  };
}

export function rotation(value: unknown) {
  const source = isRecord(value) ? value : {};
  return {
    x: numberIn(source.x, 0, -360_000, 360_000),
    y: numberIn(source.y, 0, -360_000, 360_000),
    z: numberIn(source.z, 0, -360_000, 360_000),
  };
}

export function size3(value: unknown, fallback = { widthMm: 1000, heightMm: 1000, depthMm: 1000 }) {
  const source = isRecord(value) ? value : {};
  return {
    widthMm: numberIn(source.widthMm, fallback.widthMm, 1, 1_000_000),
    heightMm: numberIn(source.heightMm, fallback.heightMm, 1, 1_000_000),
    depthMm: numberIn(source.depthMm, fallback.depthMm, 1, 1_000_000),
  };
}

export function parameterMap(value: unknown): Record<string, ParameterValue> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, ParameterValue] =>
      ["string", "number", "boolean"].includes(typeof entry[1]),
    ),
  );
}

export function stringMap(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] =>
      typeof entry[1] === "string" && entry[1].trim().length > 0,
    ),
  );
}

export function uniqueId(
  raw: unknown,
  fallback: string,
  path: string,
  used: Set<string>,
  issues: InteriorValidationIssue[],
) {
  const base = text(raw, fallback, 120).replace(/\s+/g, "-");
  let id = base;
  let suffix = 2;
  while (used.has(id)) id = `${base}-${suffix++}`;
  used.add(id);
  if (id !== raw) {
    issues.push({
      severity: "warning",
      code: "normalized-id",
      path,
      message: `Normalized entity ID to “${id}”.`,
      repaired: true,
    });
  }
  return id;
}

export function renderSettings(value: unknown): RenderSettings {
  const source = isRecord(value) ? value : {};
  const quality = ["draft", "standard", "presentation", "client-preview"].includes(String(source.quality))
    ? (source.quality as RenderSettings["quality"])
    : DEFAULT_RENDER_SETTINGS.quality;
  return {
    widthPx: Math.round(numberIn(source.widthPx, 1920, 320, 8192)),
    heightPx: Math.round(numberIn(source.heightPx, 1080, 240, 8192)),
    quality,
    exposure: numberIn(source.exposure, 1, 0.1, 5),
    transparentBackground: booleanValue(source.transparentBackground, false),
    activeCameraId:
      typeof source.activeCameraId === "string" && source.activeCameraId.trim()
        ? source.activeCameraId.trim()
        : null,
    lightingRecipeId: text(source.lightingRecipeId, "neutral-studio", 80),
    composition: source.composition === "project-camera" ? "project-camera" : "architectural",
    packageCameraBookmarks: Array.isArray(source.packageCameraBookmarks)
      ? source.packageCameraBookmarks
          .map((item) => {
            if (!isRecord(item)) return null;
            const cameraId = typeof item.cameraId === "string" ? item.cameraId.trim() : "";
            const viewName = typeof item.viewName === "string" ? item.viewName.trim() : "";
            if (!cameraId || !viewName) return null;
            return { cameraId, viewName: viewName.slice(0, 80) };
          })
          .filter((item): item is { cameraId: string; viewName: string } => Boolean(item))
      : [],
  };
}

export function noteTruncatedCollections(
  source: UnknownRecord,
  issues: InteriorValidationIssue[],
) {
  for (const key of [
    "nodes", "loops", "rooms", "walls", "openings", "surfaces",
    "objects", "materials", "lights", "cameras",
  ] as const) {
    const collection = source[key];
    if (Array.isArray(collection) && collection.length > MAX_PROJECT_ENTITIES_PER_COLLECTION) {
      issues.push({
        severity: "warning",
        code: "collection-truncated",
        path: key,
        message: `Kept the first ${MAX_PROJECT_ENTITIES_PER_COLLECTION.toLocaleString()} ${key} for v1 performance safety.`,
        repaired: true,
      });
    }
  }
}
