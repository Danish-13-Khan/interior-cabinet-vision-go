export {
  addLivingRoomPartition,
} from "./planCommands";
export {
  openingOffsetAtPoint,
  moveOpeningOffset,
  resizeOpeningWidth,
  resizeOpeningFromStart,
} from "./openingPlacement";
export {
  DEFAULT_PLAN_READABILITY,
  formatPlanDimension,
  planDimensionPair,
  topologyPlanDimensionPair,
  wallLabelPose,
  wallLengthMm,
  type PlanDimensionPair,
  type PlanDisplayUnit,
  type PlanReadabilitySettings,
  type PlanVisualStyle,
} from "./planReadability";
export {
  OPENING_CATALOG,
  getOpeningCatalogItem,
  openingCatalogForKind,
  createOpeningCatalogInstance,
  type OpeningCatalogItem,
  type OpeningCatalogSymbol,
} from "./openingCatalog";
export {
  applyBuildCommand,
  createBuildCommandState,
  isArmedPlacementTool,
  reduceBuildCommand,
  type BuildCommand,
  type BuildCommandHandlers,
  type OpeningCommandPatch,
  type BuildCommandState,
  type BuildDraft,
  type BuildTool,
} from "./buildToolCommands";
export {
  createLivingRoomObject,
  getLivingRoomCatalogItem,
  LIVING_ROOM_CATALOG,
  type LivingRoomCatalogId,
  type LivingRoomCatalogItem,
  type LivingRoomObjectPlacement,
} from "./catalog";
export { createLivingRoomCameras, LIVING_ROOM_CAMERA_KEYS } from "./cameras";
export {
  defaultLivingRoomIdFactory,
  type LivingRoomIdFactory,
} from "./ids";
export {
  createLivingRoomLights,
  applyLivingRoomLightingRecipe,
  LIVING_ROOM_LIGHTING_RECIPES,
  type LivingRoomLightingRecipe,
  type LivingRoomLightingRecipeId,
} from "./lighting";
export {
  createLivingRoomMaterials,
  LIVING_ROOM_MATERIAL_IDS,
} from "./materials";
export {
  environmentAssetIdForRecipe,
  isLivingRoomLightingRecipeId,
  lightformerFallbackForRecipe,
  LIGHTFORMER_FALLBACK_BY_RECIPE,
  LIGHTING_RECIPE_ENVIRONMENT_IDS,
  type LightformerFallbackTone,
} from "./lightingEnvironment";
export {
  resolveEnvironmentLightingQuality,
  type EnvironmentLightingQuality,
} from "./environmentLightingQuality";
export {
  resolveGroundingQuality,
  type GroundingQuality,
} from "./groundingQuality";
export {
  describePresetHonesty,
  type PresetHonestyDescription,
  type PresetHonestyRole,
} from "./presetHonesty";
export {
  resolveMaterialContrast,
  applyMaterialContrastRoughness,
  type MaterialContrastTuning,
} from "./materialContrast";
export {
  resolveWindowKeyLights,
  sampleWindowOpenings,
  type WindowKeyLightDescriptor,
  type WindowOpeningSample,
} from "./windowKeyLight";
export {
  createLivingRoomRenderResult,
  getRenderQualityPreset,
  livingRoomRenderFileName,
  matchRenderOutputPreset,
  RENDER_OUTPUT_PRESETS,
  RENDER_QUALITY_PRESETS,
  resolveRenderCameraPose,
  applyRenderPresetToSettings,
  getModelViewDefaultPresetId,
  getRenderPresetBehavior,
  listModelViewRenderPresets,
  listRenderPresetBehaviors,
  MODEL_VIEW_DEFAULT_PRESET_ID,
  RENDER_PRESET_DEFINITIONS,
  RENDER_PRESET_IDS,
  resolveStudioRenderMode,
  type LivingRoomRenderResult,
  type RenderOutputPreset,
  type RenderQualityPreset,
  type RenderPresetBehavior,
} from "./renderStudio";
export {
  getRenderModeQuality,
  resolveHeroCaptureTuning,
  resolveHeroContactShadowTuning,
  resolveHeroRenderScale,
  type HeroCaptureTuning,
  type HeroContactShadowTuning,
} from "./heroRenderQuality";
export {
  HERO_FOCAL_PRESETS,
  type HeroFocalPreset,
  type HeroFocalPresetId,
} from "./renderCameraPose";
export {
  clearLivingRoomRecovery,
  createLivingRoomPlanThumbnail,
  createLivingRoomRecoverySnapshot,
  interiorProjectFingerprint,
  LIVING_ROOM_RECOVERY_STORAGE_KEY,
  persistLivingRoomRecovery,
  readLivingRoomRecovery,
  type LivingRoomRecoverySnapshot,
} from "./desktopExperience";
export { preferModelViewCameraId } from "./modelViewDefaults";
export {
  describeModelViewHonesty,
  describeModelViewRuntimeProfile,
  modelViewProjectLightScale,
  modelViewWindowKeyScale,
  resolveModelViewLightingQuality,
  resolveModelViewMaterialQuality,
  resolveModelViewRenderMode,
  resolveModelViewMaterialBuildContext,
  type ModelViewMaterialBuildContext,
  type ModelViewRuntimeProfile,
} from "./modelViewPreviewDefaults";
export { getCabinetMechanismState, mechanismAllPatch, mechanismFrontIndex, mechanismPanelPatch, type CabinetMechanismMode, type CabinetMechanismState } from "./cabinetMechanisms";
export { assertV1CatalogScope, V1_PRODUCT_SCOPE } from "./v1Scope";
export {
  isLivingRoomLayerVisible,
  paintLivingRoomSurface,
  setLivingRoomFloorMaterial,
  setLivingRoomLayerVisibility,
  setLivingRoomWallMaterial,
  type LivingRoomLayerId,
  type LivingRoomPaintTarget,
} from "./materialLayerCommands";
export {
  applyMaterialToSelection,
  commonMaterialSlots,
  primaryMaterialId,
} from "./paintSelection";
export {
  ASSET_IMPORT_STARTER_PACK,
  createImportedAssetObject,
  getPackagedImportedAsset,
  readImportedGlb,
  type ImportedAsset,
} from "./assetImportPipeline";
export {
  getModelViewPreset,
  MODEL_VIEW_PRESETS,
  resolveModelViewPose,
  type ModelViewPose,
  type ModelViewPresetId,
} from "./modelViewPresets";
export {
  modelViewNavHint,
  resolveModelViewCameraOverrides,
  WALKTHROUGH_EYE_HEIGHT_MM,
  type ModelViewCameraOverrides,
} from "./modelViewCameraOverrides";
export {
  createLivingRoomReleaseDemoProject,
  LIVING_ROOM_RELEASE_DEMO_DATE,
  LIVING_ROOM_RELEASE_DEMO_ID,
} from "./releaseDemo";
export {
  createPhase1BenchmarkProject,
  describePhase1LatencyEnvironment,
  getPhase1BenchmarkDefinition,
  isPhase1LatencyWithinBudget,
  listPhase1BenchmarkFrames,
  listPhase1BenchmarkProjects,
  listPhase1ScorecardChecks,
  PHASE1_BENCHMARK_DEFINITIONS,
  PHASE1_BENCHMARK_IDS,
  PHASE1_BENCHMARK_NOW,
  PHASE1_LATENCY_ENVIRONMENT,
  PHASE1_SCORECARD_CHECK_IDS,
  resolvePhase1BenchmarkCameraId,
  evaluatePhase1Scorecard,
  formatPhase1ProofMarkdown,
  type Phase1BenchmarkCameraLock,
  type Phase1BenchmarkDefinition,
  type Phase1BenchmarkFrameId,
  type Phase1BenchmarkId,
  type Phase1CameraKey,
  type Phase1LatencyEnvironment,
  type Phase1LatencySample,
  type Phase1ScorecardCheckId,
  type Phase1CheckResult,
  type Phase1CheckStatus,
  type Phase1FrameLadderReport,
  type Phase1ProofPack,
} from "./phase1Benchmarks";
export {
  STILL_JOB_CONTRACT_NOTE,
  STILL_JOB_SCHEMA_VERSION,
  STILL_JOB_TOLERANCES,
  buildStillJob,
  mergeStillValidations,
  stillJobProjectContentHash,
  stillJobSnapshotId,
  stillSupportArtifactRefs,
  STILL_DETERMINISTIC_RERUN_MAD_LIMIT,
  validateDeterministicRerun,
  validateStillJobAgainstProject,
  type BuildStillJobInput,
  type StillAcceptanceStatus,
  type StillJob,
  type StillJobAllowedEnhancement,
  type StillJobAttachmentRefs,
  type StillJobCameraPose,
  type StillJobEngine,
  type StillJobGateId,
  type StillJobGateResult,
  type StillJobMaterialSlot,
  type StillJobMillworkRef,
  type StillJobMode,
  type StillJobObjectRef,
  type StillJobOpeningRef,
  type StillJobValidation,
  type StillJobWallRef,
  type StillProvenance,
} from "./stillJob";
export {
  acceptStillReview,
  createIdleStillReview,
  isStaleStillAcceptance,
  openStillReview,
  rejectStillReview,
  retryStillReview,
  stillEligibleForPackage,
  stillReviewExportStatusMessage,
  stillReviewPanelStatusLabel,
  type StillReviewSession,
  type StillReviewStatus,
} from "./stillReview";
export { describeStillHonesty } from "./stillHonesty";
export {
  buildClientPresentationHonesty,
  CLIENT_PRESENTATION_HONESTY_DISCLAIMER,
  RENDER_TIER_CATALOG,
  RENDER_TIER_LEGEND,
  resolveRenderStudioHonesty,
  tierIdForRenderQuality,
  isPackageDeliverableRenderQuality,
  formatPackageHeroCaption,
  type ClientPresentationHonesty,
  type RenderHonestyDescription,
  type RenderStudioView,
  type RenderTierCatalogEntry,
  type RenderTierId,
} from "./renderTierHonesty";
export {
  commitPackageCameraViewName,
  createDefaultPackageCameraBookmarks,
  isPackageCameraBookmarked,
  movePackageCameraBookmark,
  resolvePackageCameraViews,
  sanitizePackageCameraBookmarks,
  setPackageCameraViewName,
  togglePackageCameraBookmark,
  type ResolvedPackageCameraView,
} from "./packageCameraBookmarks";
export {
  HERO_STILL_ENGINE,
  HERO_STILL_ENHANCEMENTS,
} from "./stillEngine";
export {
  buildLivingRoomMillworkSchedule,
  exportMillworkSchedulePdf,
  formatMaterialIds,
  formatMaterialLabels,
  formatWhdMm,
  millworkScheduleFileBase,
  millworkScheduleToCsv,
  summarizeMillworkWorkflow,
  MILLWORK_SCHEDULE_HONESTY_NOTE,
  MILLWORK_SCHEDULE_VERSION,
  type MillworkSchedule,
  type MillworkScheduleLine,
  type MillworkWorkflowSnapshot,
  type MillworkWorkflowStep,
} from "./millworkSchedule";
export { isMillworkObject } from "./stillJob";
export {
  createLivingRoomStarterProject,
  LIVING_ROOM_DIMENSIONS,
  LIVING_ROOM_PRESET_ID,
  LIVING_ROOM_PRESET_VERSION,
  type LivingRoomStarterOptions,
} from "./preset";
export {
  boundsDistance,
  boundsOverlap,
  getObjectPlanBounds,
  getObjectPlanCorners,
  getRoomPlanBounds,
  getTopologyRoomPlanBounds,
  objectFitsRoom,
  type PlanBounds,
} from "./planGeometry";
export {
  snapLivingRoomObject,
  type PlanSnapGuide,
  type PlanSnapResult,
} from "./planSnapping";
export {
  inspectLivingRoomPlan,
  isBlockingLivingRoomPlanIssue,
  type LivingRoomPlanIssue,
} from "./planConstraints";
export {
  getLivingRoomPlanUnderlay,
  setLivingRoomPlanUnderlay,
  type LivingRoomPlanUnderlay,
} from "./planUnderlay";
export {
  addLivingRoomObject,
  alignLivingRoomObjects,
  deleteLivingRoomObjects,
  duplicateLivingRoomObject,
  moveLivingRoomObject,
  resizeLivingRoom,
  resizeLivingRoomObject,
  rotateLivingRoomObject,
  type LivingRoomAlignMode,
} from "./planCommands";
export {
  addLivingRoomOpening,
  deleteLivingRoomOpening,
  updateLivingRoomOpening,
} from "./openingCommands";
export {
  arrangeCabinetRun,
  attachToWall,
  cabinetRunFillerForObject,
  cabinetRunForObject,
  countCabinetRunFillers,
  isCabinetRunFiller,
  listRoomWallCorners,
  placeCornerCabinet,
  placeOnWall,
  preferredRoomWallCorner,
  reconcileCabinetRunsAfterObjectRemoval,
  reflowCabinetRunsForWalls,
  reflowCornerCabinetsForWalls,
  snapCabinetToWall,
  syncCabinetRunFillers,
  updateCabinetRun,
  updateCabinetRunLayout,
  type CabinetRunAlignment,
  type CabinetRunFillerMetadata,
  type CabinetRunLayoutOptions,
  type CabinetRunMetadata,
  type CabinetRunOptions,
  type RoomWallCorner,
  type WallPlacement,
} from "./wardrobePlacement";
export {
  placeStructuralColumn,
  STRUCTURAL_COLUMN_CATALOG_ID,
} from "./structuralCommands";
export {
  attachObjectRenderBinding,
  createObjectRenderBinding,
  createProceduralRenderBinding,
  expectedStrategyForCatalogItem,
  GLB_INTENT_CATALOG_IDS,
  materialAssetIdForEntity,
  resolveEffectiveRenderStrategy,
  withRenderBinding,
  type GlbIntentCatalogId,
} from "./renderAssetBindings";
export {
  computeGlbScaleFactors,
  computeGlbScaleFromNativeSize,
  nativeSizeMmToMeters,
  type GlbScaleFactors,
  type Size3Meters,
} from "./glbScale";
export {
  matchMaterialSlotForName,
  resolveMaterialIdForMeshName,
} from "./glbMaterialGroups";
export type {
  EnvironmentAssetDefinition,
  MaterialAssetDefinition,
  MaterialAssetId,
  ModelAssetDefinition,
  ModelAssetId,
  ModelNativeSizeMm,
  RenderAssetStrategy,
  RenderBinding,
  RenderMode,
  RenderModeQuality,
  TextureAssetDefinition,
  TextureAssetId,
} from "./renderAssetContracts";
export {
  analyzeRgbaBuffer,
  isRgbaBufferNonblank,
  validateCameraFraming,
  type CameraFramingIssue,
  type CameraFramingReport,
  type CanvasNonblankResult,
  type CanvasSampleOptions,
} from "./renderQa";
export {
  assembleClientPresentationFiles,
  buildClientPresentationPackage,
  buildClientPackageViews,
  filterPackageEligibleStills,
  isPackageEligibleStill,
  withAcceptedStillProvenance,
  createLivingRoomRenderThumbnail,
  clientPresentationPackageDirectory,
  clientPreviewExportStatusMessage,
  exportClientPresentationPdf,
  packageFilePath,
  preferLivingRoomBrowserThumbnail,
  siblingPackagePath,
  type AcceptedStillPng,
  type ClientPresentationFile,
  type ClientPresentationPackage,
  type ClientPackageView,
} from "./clientPresentation";
export {
  compileLivingRoomScene,
} from "./sceneCompiler";
export { computeArchitectureBounds } from "./sceneCompilerBounds";
export {
  compileLivingRoomObjectNode,
  getLivingRoomObjectAdapter,
  type LivingRoomObjectAdapter,
} from "./sceneAdapters";
export type {
  CompiledBoxPrimitive,
  CompiledRoundedBoxPrimitive,
  CompiledCylinderPrimitive,
  CompiledPolygonPrismPrimitive,
  CompiledLivingRoomScene,
  CompiledMaterial,
  CompiledPrimitive,
  CompiledSceneBounds,
  CompiledSceneNode,
} from "./sceneTypes";
export {
  applyLivingRoomStyle,
  getActiveLivingRoomStyleId,
  getLivingRoomStylePreset,
  LIVING_ROOM_STYLE_PRESETS,
  resolveLivingRoomColorManagement,
  resolveLivingRoomEnvironment,
  resolveLivingRoomStyle,
  type LivingRoomColorManagement,
  type LivingRoomEnvironment,
  type LivingRoomStyleId,
  type LivingRoomStylePreset,
} from "./stylePresets";
