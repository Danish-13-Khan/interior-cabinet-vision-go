import type { InteriorObjectEntity, ParameterValue } from "../interiorProject";

/** Appliance keys (§4.4): the host plus offsets in the host's frame; position is derived from them. */
export const HOST_CABINET_ID = "hostCabinetId";
export const OFFSET_ALONG_MM = "offsetAlongMm";
export const OFFSET_DEPTH_MM = "offsetDepthMm";
export const ROTATION_OFFSET_DEG = "rotationOffsetDeg";
export const CUTOUT_WIDTH_MM = "cutoutWidthMm";
export const CUTOUT_DEPTH_MM = "cutoutDepthMm";
export const INSERT_KIND = "insertKind";
/** Set when the host was deleted, so the inspector can say why the appliance came loose. */
export const HOST_REMOVED = "hostRemoved";
/** Host-side keys: which appliance wrote the cabinet's insert, and the cut-out size. */
export const INSERT_HOSTED_BY = "insertHostedBy";
export const APPLIANCE_WIDTH_MM = "applianceWidthMm";
export const APPLIANCE_DEPTH_MM = "applianceDepthMm";

export type HostedInsertKind = "sink-bowl" | "cooktop";

export const HOSTED_INSERT_OPTIONS: Array<{ value: HostedInsertKind; label: string }> = [
  { value: "sink-bowl", label: "Sink bowl" },
  { value: "cooktop", label: "Hob / cooktop" },
];

export type ApplianceHost = {
  hostCabinetId: string;
  offsetAlongMm: number;
  offsetDepthMm: number;
  cutoutWidthMm: number;
  cutoutDepthMm: number;
  /** Quarter turns on top of the host's rotation. */
  rotationOffsetDeg: number;
  insertKind: HostedInsertKind;
};

const finite = (value: unknown, fallback: number) => (Number.isFinite(Number(value)) ? Number(value) : fallback);

export function readHostedInsertKind(value: unknown): HostedInsertKind | null {
  return value === "sink-bowl" || value === "cooktop" ? value : null;
}

/** Guess the insert from the catalog id / name; imported models fall back to a sink. */
export function detectApplianceInsertKind(object: InteriorObjectEntity): HostedInsertKind {
  const text = `${object.catalogItemId} ${object.name}`.toLowerCase();
  return /hob|cooktop|stove|range|induction/.test(text) ? "cooktop" : "sink-bowl";
}

const APPLIANCE_CATEGORIES = new Set(["kitchen-and-appliances", "appliances", "kitchen"]);

/** Kitchen / appliance catalog items and imported models (plus anything already placed); never sofas or cabinets. */
export function isPlaceableAppliance(object: InteriorObjectEntity): boolean {
  if (object.kind === "cabinet") return false;
  return APPLIANCE_CATEGORIES.has(object.category)
    || Boolean(object.extensions?.assetImport)
    || readApplianceHost(object) !== null;
}

/** Appliance turns relative to the host snap to quarter turns (0, 90, 180, 270). */
export function quarterTurn(degrees: number): number {
  return ((Math.round(degrees / 90) * 90) % 360 + 360) % 360;
}

export function readApplianceHost(object: InteriorObjectEntity): ApplianceHost | null {
  const hostCabinetId = object.parameters[HOST_CABINET_ID];
  if (typeof hostCabinetId !== "string" || !hostCabinetId) return null;
  return {
    hostCabinetId,
    offsetAlongMm: finite(object.parameters[OFFSET_ALONG_MM], 0),
    offsetDepthMm: finite(object.parameters[OFFSET_DEPTH_MM], 0),
    cutoutWidthMm: finite(object.parameters[CUTOUT_WIDTH_MM], object.dimensions.widthMm),
    cutoutDepthMm: finite(object.parameters[CUTOUT_DEPTH_MM], object.dimensions.depthMm),
    rotationOffsetDeg: quarterTurn(finite(object.parameters[ROTATION_OFFSET_DEG], 0)),
    insertKind: readHostedInsertKind(object.parameters[INSERT_KIND]) ?? detectApplianceInsertKind(object),
  };
}

export function withoutKeys(parameters: Record<string, ParameterValue>, keys: readonly string[]) {
  return Object.fromEntries(Object.entries(parameters).filter(([key]) => !keys.includes(key)));
}

export const APPLIANCE_HOST_KEYS = [
  HOST_CABINET_ID, OFFSET_ALONG_MM, OFFSET_DEPTH_MM, ROTATION_OFFSET_DEG, CUTOUT_WIDTH_MM, CUTOUT_DEPTH_MM,
] as const;
export const HOST_INSERT_KEYS = [INSERT_KIND, INSERT_HOSTED_BY, APPLIANCE_WIDTH_MM, APPLIANCE_DEPTH_MM] as const;
