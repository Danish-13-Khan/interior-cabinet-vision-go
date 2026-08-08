import type { CabinetPlacement } from "../cabinetDimensions";

export type ManufacturingSeverity = "info" | "warning" | "error";

export type ManufacturingRuleCode =
  | "FAMILY_WIDTH"
  | "FAMILY_HEIGHT"
  | "FAMILY_DEPTH"
  | "OPENING_WIDTH"
  | "OPENING_HEIGHT"
  | "OPENING_CONTENT"
  | "OPENING_LEAF_CLEARANCE"
  | "SHELF_SPAN"
  | "SHELF_SPACING"
  | "SHELF_DEPTH"
  | "DOOR_WIDTH"
  | "DOOR_STYLE"
  | "DRAWER_HEIGHT"
  | "DRAWER_DOOR_MIX"
  | "TOE_KICK_REQUIRED"
  | "TOE_KICK_FORBIDDEN"
  | "TOE_KICK_RANGE"
  | "MATERIAL_WET_ZONE"
  | "MATERIAL_SHELF_SPAN"
  | "WALL_ATTACHMENT"
  | "WALL_MOUNT_HEIGHT"
  | "WALL_BACK_REQUIRED";

export type ManufacturingIssue = {
  code: ManufacturingRuleCode;
  severity: ManufacturingSeverity;
  message: string;
  field?: string;
  autoFixed?: boolean;
};

export type ManufacturingRuleContext = {
  placement?: CabinetPlacement | null;
  roomHeightMm?: number;
};

export type FamilyDimensionLimits = {
  width: { min: number; max: number; preferredMin: number; preferredMax: number };
  height: { min: number; max: number; preferredMin: number; preferredMax: number };
  depth: { min: number; max: number; preferredMin: number; preferredMax: number };
};
