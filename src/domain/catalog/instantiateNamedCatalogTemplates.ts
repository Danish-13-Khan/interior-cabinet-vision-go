import type { InteriorProject } from "../interiorProject";
import { lookupBuiltInCatalogTemplate } from "./catalogLookup";
import {
  BEDROOM_CATALOG_TEMPLATE_ID,
  EMPTY_ROOM_CATALOG_TEMPLATE_ID,
  instantiateProjectTemplate,
  L_KITCHEN_CATALOG_TEMPLATE_ID,
  LIVING_ROOM_CATALOG_TEMPLATE_ID,
  STRAIGHT_KITCHEN_CATALOG_TEMPLATE_ID,
  type InstantiateTemplateOptions,
} from "./instantiateProjectTemplate";

function instantiateNamedCatalogTemplate(
  templateId: string,
  options: InstantiateTemplateOptions,
): InteriorProject {
  const template = lookupBuiltInCatalogTemplate(templateId);
  if (!template) {
    throw new Error(`Missing catalog template ${templateId}`);
  }
  return instantiateProjectTemplate(template, options);
}

export function instantiateLivingRoomCatalogTemplate(
  options: InstantiateTemplateOptions = {},
): InteriorProject {
  return instantiateNamedCatalogTemplate(LIVING_ROOM_CATALOG_TEMPLATE_ID, options);
}

export function instantiateEmptyRoomCatalogTemplate(
  options: InstantiateTemplateOptions = {},
): InteriorProject {
  return instantiateNamedCatalogTemplate(EMPTY_ROOM_CATALOG_TEMPLATE_ID, options);
}

export function instantiateStraightKitchenCatalogTemplate(
  options: InstantiateTemplateOptions = {},
): InteriorProject {
  return instantiateNamedCatalogTemplate(STRAIGHT_KITCHEN_CATALOG_TEMPLATE_ID, options);
}

export function instantiateLKitchenCatalogTemplate(
  options: InstantiateTemplateOptions = {},
): InteriorProject {
  return instantiateNamedCatalogTemplate(L_KITCHEN_CATALOG_TEMPLATE_ID, options);
}

export function instantiateBedroomCatalogTemplate(
  options: InstantiateTemplateOptions = {},
): InteriorProject {
  return instantiateNamedCatalogTemplate(BEDROOM_CATALOG_TEMPLATE_ID, options);
}
