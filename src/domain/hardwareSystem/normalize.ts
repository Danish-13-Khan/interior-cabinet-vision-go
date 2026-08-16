import type { CabinetType } from "../cabinetDimensions";
import {
  ACCESSORY_CATALOG_IDS,
  APPLIANCE_INSERT_OPTIONS,
  DEFAULT_HARDWARE_SPEC,
  HARDWARE_CATALOG,
} from "./catalog";
import type {
  ApplianceInsertKind,
  CabinetHardwareSpec,
  HardwareItem,
  HardwareKind,
} from "./types";

function applianceDimension(value: unknown): number {
  const dimension = Math.round(Number(value));
  return Number.isFinite(dimension) ? Math.min(2400, Math.max(0, dimension)) : 0;
}

export function getHardwareItem(id: string): HardwareItem | undefined {
  return HARDWARE_CATALOG.find((item) => item.id === id);
}

export function hardwareItemsOfKind(kind: HardwareKind): HardwareItem[] {
  return HARDWARE_CATALOG.filter((item) => item.kind === kind);
}

export function defaultInsertKindForType(type: CabinetType): ApplianceInsertKind {
  if (type === "sink") return "sink-bowl";
  return "none";
}

export function isAccessoryCompatible(
  accessoryId: string,
  type: CabinetType,
  insertKind: ApplianceInsertKind,
): boolean {
  if (!ACCESSORY_CATALOG_IDS.includes(accessoryId)) return false;
  if (insertKind === "dishwasher-gap") return false;
  if (insertKind === "cooktop") {
    return accessoryId === "tray-cutlery";
  }
  if (type === "sink" || insertKind === "sink-bowl") {
    return accessoryId === "trash-pullout" || accessoryId === "basket-wire";
  }
  if (type === "wall" || type === "open-shelf") {
    return accessoryId === "basket-wire" || accessoryId === "tray-cutlery";
  }
  return true;
}

export function normalizeCabinetHardware(
  type: CabinetType,
  hardware: Partial<CabinetHardwareSpec> | undefined,
  defaults: {
    hingeId: string;
    drawerSlideId: string;
    handleId: string;
  } = {
    hingeId: "hinge-soft",
    drawerSlideId: "drawer-slide-soft",
    handleId: "handle-bar",
  },
): CabinetHardwareSpec {
  const hingeIds = new Set(hardwareItemsOfKind("hinge").map((item) => item.id));
  const slideIds = new Set(hardwareItemsOfKind("slide").map((item) => item.id));
  const handleIds = new Set(hardwareItemsOfKind("handle").map((item) => item.id));
  const legIds = new Set(["none", ...hardwareItemsOfKind("leg").map((item) => item.id)]);
  const bracketIds = new Set([
    "none",
    ...hardwareItemsOfKind("bracket").map((item) => item.id),
  ]);
  const insertOptions = new Set(APPLIANCE_INSERT_OPTIONS.map((item) => item.value));

  const seed = {
    ...DEFAULT_HARDWARE_SPEC,
    hingeId: defaults.hingeId,
    slideId: defaults.drawerSlideId,
    handleId: defaults.handleId,
    insertKind: defaultInsertKindForType(type),
    ...(hardware ?? {}),
  };

  const insertKind = insertOptions.has(seed.insertKind)
    ? seed.insertKind
    : defaultInsertKindForType(type);

  const accessories = Array.isArray(seed.accessories)
    ? seed.accessories
        .map((line) => ({
          id: String(line?.id ?? ""),
          quantity: Math.min(6, Math.max(0, Math.round(Number(line?.quantity) || 0))),
        }))
        .filter(
          (line) =>
            line.quantity > 0 && isAccessoryCompatible(line.id, type, insertKind),
        )
        .slice(0, 8)
    : [];

  // Sink / insert compatibility: dishwasher gap clears accessories and doors hardware still ok
  if (type === "sink" && insertKind === "none") {
    // keep sink-bowl as practical default when unspecified incorrectly
  }

  return {
    hingeId: hingeIds.has(seed.hingeId) ? seed.hingeId : DEFAULT_HARDWARE_SPEC.hingeId,
    slideId: slideIds.has(seed.slideId) ? seed.slideId : DEFAULT_HARDWARE_SPEC.slideId,
    handleId: handleIds.has(seed.handleId) ? seed.handleId : DEFAULT_HARDWARE_SPEC.handleId,
    legId: legIds.has(seed.legId) ? seed.legId : DEFAULT_HARDWARE_SPEC.legId,
    bracketId: bracketIds.has(seed.bracketId)
      ? seed.bracketId
      : DEFAULT_HARDWARE_SPEC.bracketId,
    includeShelfPins: seed.includeShelfPins !== false,
    accessories,
    insertKind:
      type === "sink" && insertKind === "none" ? "sink-bowl" : insertKind,
    applianceWidthMm: applianceDimension(seed.applianceWidthMm),
    applianceHeightMm: applianceDimension(seed.applianceHeightMm),
    applianceDepthMm: applianceDimension(seed.applianceDepthMm),
  };
}

export function describeHardwareSpec(spec: CabinetHardwareSpec): string {
  const hinge = getHardwareItem(spec.hingeId)?.label ?? spec.hingeId;
  const slide = getHardwareItem(spec.slideId)?.label ?? spec.slideId;
  const handle = getHardwareItem(spec.handleId)?.label ?? spec.handleId;
  const accessoryCount = spec.accessories.reduce((sum, line) => sum + line.quantity, 0);
  const insert =
    APPLIANCE_INSERT_OPTIONS.find((item) => item.value === spec.insertKind)?.label ??
    "None";
  const applianceSize = [spec.applianceWidthMm, spec.applianceHeightMm, spec.applianceDepthMm]
    .every((dimension) => dimension > 0)
    ? ` · ${spec.applianceWidthMm}×${spec.applianceHeightMm}×${spec.applianceDepthMm} mm`
    : "";
  return `${hinge} · ${slide} · ${handle}${accessoryCount ? ` · ${accessoryCount} acc.` : ""} · ${insert}${applianceSize}`;
}
