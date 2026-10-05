import { lookupBuiltInCatalogTemplate } from "../catalog";
import { lookupApartmentTemplate } from "./instantiateApartmentTemplate";
import { defaultPendingTemplateStorage, peekPendingTemplate, type PendingTemplateStorage } from "./pendingTemplateHandoff";


export type PendingTemplateOffer = {
  templateId: string;
  kind: "apartment" | "catalog";
  name: string;
};

/**
 * What the project home may offer after register → editor. Never creates a
 * project: the user must accept the offer (or open that template) explicitly.
 */
export function pendingTemplateOffer(
  storage: PendingTemplateStorage | null = defaultPendingTemplateStorage(),
): PendingTemplateOffer | null {
  const templateId = peekPendingTemplate(storage);
  if (!templateId) return null;
  const apartment = lookupApartmentTemplate(templateId);
  if (apartment) return { templateId, kind: "apartment", name: apartment.name };
  const catalog = lookupBuiltInCatalogTemplate(templateId);
  if (catalog) return { templateId, kind: "catalog", name: catalog.name };
  return null;
}
