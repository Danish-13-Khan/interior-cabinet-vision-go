import { DEFAULT_RENDER_SETTINGS } from "./defaults";
import { INTERIOR_PROJECT_SCHEMA_VERSION } from "./types";

type UnknownRecord = Record<string, unknown>;

export type InteriorMigrationResult = {
  document: unknown;
  fromVersion: number;
  toVersion: number;
  steps: string[];
};

function record(value: unknown): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Interior project document must be an object.");
  }
  return value as UnknownRecord;
}

function migrateV0ToV1(input: UnknownRecord): UnknownRecord {
  return {
    ...input,
    schemaVersion: 1,
    units: "mm",
    materials: Array.isArray(input.materials) ? input.materials : [],
    lights: Array.isArray(input.lights) ? input.lights : [],
    cameras: Array.isArray(input.cameras) ? input.cameras : [],
    renderSettings:
      input.renderSettings && typeof input.renderSettings === "object"
        ? input.renderSettings
        : { ...DEFAULT_RENDER_SETTINGS },
  };
}

/** Apply each schema migration exactly once and reject unsupported future files. */
export function migrateInteriorProjectDocument(input: unknown): InteriorMigrationResult {
  let document = record(input);
  const rawVersion = Number(document.schemaVersion);
  const fromVersion = Number.isInteger(rawVersion) && rawVersion >= 0 ? rawVersion : 0;
  if (fromVersion > INTERIOR_PROJECT_SCHEMA_VERSION) {
    throw new Error(
      `Project schema v${fromVersion} is newer than supported v${INTERIOR_PROJECT_SCHEMA_VERSION}.`,
    );
  }

  let version = fromVersion;
  const steps: string[] = [];
  while (version < INTERIOR_PROJECT_SCHEMA_VERSION) {
    if (version === 0) {
      document = migrateV0ToV1(document);
      version = 1;
      steps.push("v0-to-v1");
      continue;
    }
    throw new Error(`No migration is registered for project schema v${version}.`);
  }

  return {
    document,
    fromVersion,
    toVersion: version,
    steps,
  };
}
