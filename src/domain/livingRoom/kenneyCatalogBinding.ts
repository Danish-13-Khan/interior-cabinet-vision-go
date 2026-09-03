import { publicAssetUrl } from "../../utils/publicAssetUrl";
import {
  lookupBuiltInCatalogFile,
  lookupBuiltInCatalogItem,
  pinnedCatalogItemVersion,
} from "../catalog/catalogLookup";
import type { MaterialSlotPolicy } from "../catalog/types";
import type { InteriorObjectEntity } from "../interiorProject";
import type { RenderBinding } from "./renderAssetContracts";

/** Bind a Kenney catalog item to its bundled GLB. */
export function createKenneyCatalogRenderBinding(
  object: InteriorObjectEntity,
  materialBindings: Record<string, string>,
  uvScaleMm: number,
  slotPolicies?: Record<string, MaterialSlotPolicy>,
): RenderBinding | null {
  const item = lookupBuiltInCatalogItem(object.catalogItemId, pinnedCatalogItemVersion(object));
  if (!item) return null;
  const file = lookupBuiltInCatalogFile(item.modelAssetId);
  if (!file || file.kind !== "model") return null;
  return {
    strategy: "glb",
    modelAssetId: item.modelAssetId,
    modelUrl: publicAssetUrl(file.objectKey),
    materialBindings,
    uvScaleMm,
    targetSizeMm: { ...object.dimensions },
    slotPolicies,
  };
}
