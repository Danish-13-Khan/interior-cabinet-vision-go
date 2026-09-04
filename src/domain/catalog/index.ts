export type {
  CatalogFileRecord,
  CatalogImageFile,
  CatalogItem,
  CatalogLifecycle,
  CatalogManifest,
  CatalogMaterial,
  CatalogModelFile,
  CatalogPage,
  CatalogPlacement,
  CatalogQuery,
  CatalogVisibility,
  MaterialSlotPolicy,
  ProjectTemplate,
  ResolvedAsset,
} from "./types";
export {
  camelStemToKebab,
  displayNameFromStem,
  kenneyIsoImageId,
  kenneyItemId,
  kenneyModelId,
  kenneySideImageId,
} from "./ids";
export {
  assertValidCatalogManifest,
  validateCatalogManifest,
  type CatalogValidationIssue,
} from "./schema";
export type { CatalogProvider } from "./providers/types";
export { BuiltInCatalogProvider } from "./providers/builtInCatalogProvider";
export {
  getCatalogItem,
  getCatalogManifest,
  getCatalogProvider,
  listCatalogItems,
  resolveCatalogFile,
  setCatalogProvider,
} from "./catalogService";
export {
  catalogSlotPoliciesForObject,
  lookupBuiltInCatalogFile,
  lookupBuiltInCatalogItem,
  lookupBuiltInCatalogMaterial,
  lookupBuiltInCatalogMaterials,
  pinnedCatalogItemVersion,
  catalogVersionPinFallbackWarning,
} from "./catalogLookup";
export {
  classifyKenneyStem,
  isArchitectureStem,
  KENNEY_ARCHITECTURE_STEMS,
} from "./kenney/classification";
export {
  getKenneyOverride,
  KENNEY_OVERRIDES,
  type KenneyItemOverride,
} from "./kenney/overrides";
export {
  isKenneyCabinetPropStem,
  isKenneyTemplateCuratedStem,
  KENNEY_CABINET_PROP_STEMS,
  KENNEY_TEMPLATE_CURATED_STEMS,
  type KenneyTemplateCuratedStem,
} from "./kenney/curatedStems";
export {
  getProofMaterialSlots,
  KENNEY_MATERIAL_SLOTS,
  KENNEY_PROOF_MATERIAL_SLOTS,
  KENNEY_PROOF_STEMS,
  type KenneyProofStem,
} from "./kenney/materialMappings";
export {
  placeCatalogItemWithDefaults,
  type CatalogObjectPlacement,
} from "./placeCatalogItem";
export {
  CATALOG_SEED_MATERIALS,
  getCatalogSeedMaterial,
} from "./materials/seedMaterials";
export {
  assertSlotEditable,
  filterMaterialsForSlot,
  isCatalogMaterialCompatible,
  isMaterialCompatibleWithSlot,
  tagsFromMaterialExtensions,
} from "./materialCompatibility";
export {
  matchSlotFromMaterialOrMeshName,
  resolveMaterialIdForPrimitive,
} from "./materialSlotMatch";
export {
  countMaterialReferences,
  ensureCatalogMaterialSnapshot,
  snapshotCatalogMaterial,
  isCanonicalCatalogSnapshot,
} from "./materialSnapshots";
export {
  mutateProjectMaterialCow,
  paintObjectSlotWithPolicy,
  resetObjectFinishToCatalogDefaults,
  type FinishUvRebind,
} from "./finishCommands";
