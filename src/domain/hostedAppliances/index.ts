export {
  APPLIANCE_DEPTH_MM,
  APPLIANCE_WIDTH_MM,
  HOST_CABINET_ID,
  HOST_REMOVED,
  HOSTED_APPLIANCE_ROTATION_HINT,
  HOSTED_INSERT_OPTIONS,
  INSERT_HOSTED_BY,
  INSERT_KIND,
  OFFSET_ALONG_MM,
  OFFSET_DEPTH_MM,
  detectApplianceInsertKind,
  isPlaceableAppliance,
  readApplianceHost,
  readHostedInsertKind,
  type ApplianceHost,
  type HostedInsertKind,
} from "./parameters";
export {
  clampApplianceOffsets,
  fallbackWorktopTopMm,
  hostedAppliancePose,
  offsetsFromPosition,
  worktopTopsByObjectId,
} from "./resolve";
export { syncHostedAppliances } from "./sync";
export { applianceHostCandidates, placeApplianceInCabinet, placeInCabinetPatch, RELEASE_APPLIANCE_PATCH, releaseAppliance } from "./commands";
