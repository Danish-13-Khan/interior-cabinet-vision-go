export type {
  ApartmentOpeningSpec,
  ApartmentRoomSpec,
  ApartmentSplit,
  ApartmentTemplateId,
  ApartmentTemplateSpec,
  BathroomComposeOptions,
  BedroomComposeOptions,
  FinishRole,
  FoyerComposeOptions,
  HandleHardwareId,
  DoorSourcingOption,
  KitchenComposeOptions,
  KitchenLayout,
  LivingComposeOptions,
  RoomComposition,
  StudyComposeOptions,
  UtilityComposeOptions,
  WallSide,
} from "./types";

/** Deterministic template ids (D3). Phase 6: customer clones may use createUniqueLivingRoomIdFactory. */
export { apartmentIdFactory } from "./ids";
export { buildApartmentShell } from "./buildApartmentShell";
export type { BuildApartmentShellOptions } from "./buildApartmentShell";
export {
  wallOnSide,
  wallsOnSide,
  exteriorWallOnSide,
  legacyWallSide,
  wallSideFromLegacy,
} from "./wallSide";
export { composeApartment } from "./composeApartment";
export { applyShowcaseCameras } from "./applyShowcaseCameras";
export {
  APARTMENT_TEMPLATE_IDS,
  instantiateApartmentTemplate,
  lookupApartmentTemplate,
} from "./instantiateApartmentTemplate";
export { sharedWallBetween } from "./sharedWall";

export { TWO_ROOM_FLAT_SPEC } from "./specs/twoRoomFlat";
export { STUDIO_SHELL_SPEC } from "./specs/studioShell";
export { ONE_BHK_SHELL_SPEC } from "./specs/oneBhkShell";
export { TWO_BHK_SHELL_SPEC } from "./specs/twoBhkShell";
export { THREE_BHK_SHELL_SPEC } from "./specs/threeBhkShell";
export { DEFAULT_FINISH_ROLES } from "./specs/finishRoles";

import { STUDIO_SHELL_SPEC } from "./specs/studioShell";
import { ONE_BHK_SHELL_SPEC } from "./specs/oneBhkShell";
import { TWO_BHK_SHELL_SPEC } from "./specs/twoBhkShell";
import { THREE_BHK_SHELL_SPEC } from "./specs/threeBhkShell";
import type { ApartmentTemplateSpec } from "./types";

/** The four product apartment shells (Phase 0 exit gate). */
export const APARTMENT_SHELL_SPECS: readonly ApartmentTemplateSpec[] = [
  STUDIO_SHELL_SPEC,
  ONE_BHK_SHELL_SPEC,
  TWO_BHK_SHELL_SPEC,
  THREE_BHK_SHELL_SPEC,
];


export {
  composeKitchen,
  composeBedroom,
  composeLiving,
  composeBathroom,
  composeFoyer,
  composeUtility,
  composeStudy,
  roomObjectsOverlapOpenings,
  objectOverlapsOpeningOnWall,
  withActiveRoom,
} from "./composers";
export type {
  ComposeKitchenArgs,
  ComposeBedroomArgs,
  ComposeLivingArgs,
  ComposeBathroomArgs,
  ComposeFoyerArgs,
  ComposeUtilityArgs,
  ComposeStudyArgs,
} from "./composers";
export { APARTMENT_TEMPLATE_DECISIONS } from "./decisions";

export { APARTMENT_TEMPLATE_CARDS } from "./apartmentCards";
export type { ApartmentTemplateCard } from "./apartmentCards";
export {
  PENDING_TEMPLATE_STORAGE_KEY,
  clearPendingTemplate,
  defaultPendingTemplateStorage,
  peekPendingTemplate,
  stashPendingTemplate,
  takePendingTemplate,
} from "./pendingTemplateHandoff";
export type { PendingTemplateStorage } from "./pendingTemplateHandoff";
export { showcaseCameraForRoom } from "./showcaseCamera";
