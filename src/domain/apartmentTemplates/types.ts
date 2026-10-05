import type { OpeningKind, Point3Mm, RoomType } from "../interiorProject";
import type { LivingRoomLightingRecipeId } from "../livingRoom/lighting";
import type { LightingMood } from "../livingRoom/lightingMood";
import type { LivingRoomStyleId } from "../livingRoom/stylePresets";

/** Stable apartment template ids (D8). */
export type ApartmentTemplateId =
  | "template:apartment:studio:v1"
  | "template:apartment:1bhk:v1"
  | "template:apartment:2bhk:v1"
  | "template:apartment:3bhk:v1"
  /** Phase 0 topology check — not a product template. */
  | "template:apartment:2-room-flat:check";

/** Cardinal wall side relative to a room's plan bounds (north = −Z). */
export type WallSide = "north" | "south" | "east" | "west";

export type FinishRole =
  | "carcass"
  | "front-primary"
  | "front-accent"
  | "worktop"
  | "wall-panel"
  | "floor";

/** Guillotine cut: one straight wall across an existing cell (D2). */
export type ApartmentSplit = {
  key: string;
  inCell: string;
  axis: "x" | "z";
  /** Absolute plan coordinate of the cut plane (mm). */
  atMm: number;
  /** [min-side cell, max-side cell] along the cut axis. */
  cells: [string, string];
};

/** Which composer + options to run after the shell exists (§3.2). */
export type RoomComposition =
  | { kind: "none" }
  | { kind: "kitchen"; options?: KitchenComposeOptions }
  | { kind: "bedroom"; options?: BedroomComposeOptions }
  | { kind: "living"; options?: LivingComposeOptions }
  | { kind: "bathroom"; options?: BathroomComposeOptions }
  | { kind: "foyer"; options?: FoyerComposeOptions }
  | { kind: "utility"; options?: UtilityComposeOptions }
  | { kind: "study"; options?: StudyComposeOptions };

export type KitchenLayout = "straight" | "L" | "parallel";

export type KitchenComposeOptions = {
  layout?: KitchenLayout;
  runSide?: WallSide;
  secondarySide?: WallSide;
  wallCabinets?: boolean;
  tallPantry?: boolean;
  frontSystem?: "handled" | "gola";
  doorStyle?: "slab" | "shaker" | "glass";
  underCabinetLights?: boolean;
  /** Host sink on the primary-run base at this index (0-based among floor bases). */
  sinkHostIndex?: number;
  /** Host cooktop/hob on the primary-run base at this index (default 1: the drawer base). */
  hobHostIndex?: number;
};

export type BedroomComposeOptions = {
  wardrobeSide?: WallSide;
  wardrobeWidthMm?: number;
  headboardDecor?: string;
  bedAlongSide?: WallSide;
  pendants?: boolean;
};

export type LivingComposeOptions = {
  tvWallSide?: WallSide;
  featureWallPreset?: string;
  sofaSet?: boolean;
  coveLight?: boolean;
  trackLight?: boolean;
};

export type BathroomComposeOptions = {
  vanitySide?: WallSide;
  mirrorRopeLight?: boolean;
};

export type FoyerComposeOptions = { shoeCabinetSide?: WallSide };
export type UtilityComposeOptions = { tallUnitSide?: WallSide };
export type StudyComposeOptions = {
  deskSide?: WallSide;
  openShelfSide?: WallSide;
};

export type ApartmentRoomSpec = {
  key: string;
  cell: string;
  name: string;
  roomType: RoomType;
  floorMaterialId?: string;
  ceilingMaterialId?: string;
  compose: RoomComposition;
  camera?: { eyeMm: Point3Mm; targetMm: Point3Mm };
};

export type ApartmentOpeningBetween =
  | [string, string]
  | { room: string; side: WallSide };

export type ApartmentOpeningSpec = {
  kind: OpeningKind;
  between: ApartmentOpeningBetween;
  /** From the wall's fixed end: lower x (east–west walls) or lower z (north–south walls). */
  offsetMm: number;
  widthMm: number;
  heightMm?: number;
  sillHeightMm?: number;
  catalogItemId?: string;
};

export type ApartmentTemplateSpec = {
  id: ApartmentTemplateId;
  name: string;
  description: string;
  styleId: LivingRoomStyleId;
  lightingRecipeId: LivingRoomLightingRecipeId;
  mood: LightingMood;
  shell: {
    widthMm: number;
    depthMm: number;
    heightMm: number;
    externalWallMm: number;
    internalWallMm: number;
  };
  splits: ApartmentSplit[];
  rooms: ApartmentRoomSpec[];
  openings: ApartmentOpeningSpec[];
  heroRoomKey: string;
  finishRoles: Record<FinishRole, string>;
};
