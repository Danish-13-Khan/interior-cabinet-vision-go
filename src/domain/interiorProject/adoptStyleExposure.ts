type UnknownRecord = Record<string, unknown>;

/**
 * Preset exposures an untouched project may still be carrying.
 * A saved exposure outside this list was chosen by the user and stays.
 */
const PREVIOUS_STYLE_EXPOSURE: Record<string, readonly number[]> = {
  "moody-walnut": [0.92],
  "nordic-light": [1.18],
  "warm-contemporary": [1.05],
};

const CURRENT_STYLE_EXPOSURE: Record<string, number> = {
  "moody-walnut": 1.05,
  "nordic-light": 1.42,
  "warm-contemporary": 1.42,
};

function record(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : null;
}

function styleIdOf(extensions: UnknownRecord): string {
  const snapshot = record(extensions.livingRoomStyle);
  if (snapshot && typeof snapshot.id === "string") return snapshot.id;
  return typeof extensions.livingRoomStyleId === "string" ? extensions.livingRoomStyleId : "";
}

/** Move a project off a retired style exposure. Custom exposures are left alone. */
export function adoptCurrentStyleExposure(input: UnknownRecord): UnknownRecord {
  const settings = record(input.renderSettings);
  const extensions = record(input.extensions) ?? {};
  if (!settings) return input;
  const styleId = styleIdOf(extensions);
  const current = CURRENT_STYLE_EXPOSURE[styleId];
  const previous = PREVIOUS_STYLE_EXPOSURE[styleId] ?? [];
  const exposure = Number(settings.exposure);
  if (current == null || exposure === current || !previous.includes(exposure)) return input;
  const snapshot = record(extensions.livingRoomStyle);
  const color = snapshot ? record(snapshot.colorManagement) : null;
  const nextExtensions = snapshot && color
    ? {
      ...extensions,
      livingRoomStyle: {
        ...snapshot,
        colorManagement: { ...color, exposure: current },
      },
    }
    : extensions;
  return {
    ...input,
    renderSettings: { ...settings, exposure: current },
    extensions: nextExtensions,
  };
}

/**
 * Same adoption for a cabinet project that carries its interior document, so a
 * browser draft reopened without going through the file loader is covered too.
 */
export function adoptInteriorDocumentExposure<T extends { interiorDocument?: unknown }>(project: T): T {
  const document = record(project.interiorDocument);
  if (!document) return project;
  const adopted = adoptCurrentStyleExposure(document);
  return adopted === document ? project : { ...project, interiorDocument: adopted };
}
