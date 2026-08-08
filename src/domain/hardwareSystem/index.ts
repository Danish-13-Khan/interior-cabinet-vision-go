export type {
  HardwareKind,
  HardwareItem,
  ApplianceInsertKind,
  CabinetAccessoryLine,
  CabinetHardwareSpec,
  HardwareLine,
  HardwareScheduleRow,
  CabinetHardwareSummary,
} from "./types";

export {
  HARDWARE_CATALOG,
  APPLIANCE_INSERT_OPTIONS,
  ACCESSORY_CATALOG_IDS,
  DEFAULT_HARDWARE_SPEC,
} from "./catalog";

export {
  getHardwareItem,
  hardwareItemsOfKind,
  defaultInsertKindForType,
  isAccessoryCompatible,
  normalizeCabinetHardware,
  describeHardwareSpec,
} from "./normalize";

export {
  resolveHardwareCounts,
  buildHardwareLines,
} from "./resolve";

export {
  createHardwareSchedule,
  csvFromHardwareSchedule,
  getInsertCompatibilityNotes,
} from "./schedule";
