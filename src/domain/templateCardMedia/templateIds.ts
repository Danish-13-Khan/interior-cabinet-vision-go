import type { ApartmentTemplateCardId, CatalogTemplateCardId, TemplateCardId } from "./types";

export const APARTMENT_TEMPLATE_CARD_IDS: readonly ApartmentTemplateCardId[] = [
  "template:apartment:studio:v1",
  "template:apartment:1bhk:v1",
  "template:apartment:2bhk:v1",
  "template:apartment:3bhk:v1",
];

export const CATALOG_TEMPLATE_CARD_IDS: readonly CatalogTemplateCardId[] = [
  "template:core:living-room:v1",
  "template:core:empty-room:v1",
  "template:core:straight-kitchen:v1",
  "template:core:l-kitchen:v1",
  "template:core:bedroom:v1",
  "template:core:bathroom:v1",
];

export const TEMPLATE_CARD_IDS: readonly TemplateCardId[] = [
  ...APARTMENT_TEMPLATE_CARD_IDS,
  ...CATALOG_TEMPLATE_CARD_IDS,
];

export function isApartmentTemplateCardId(id: TemplateCardId): id is ApartmentTemplateCardId {
  return (APARTMENT_TEMPLATE_CARD_IDS as readonly string[]).includes(id);
}

export function catalogTemplateFileSlug(id: CatalogTemplateCardId): string {
  const map: Record<CatalogTemplateCardId, string> = {
    "template:core:living-room:v1": "living-room",
    "template:core:empty-room:v1": "empty-room",
    "template:core:straight-kitchen:v1": "straight-kitchen",
    "template:core:l-kitchen:v1": "l-kitchen",
    "template:core:bedroom:v1": "bedroom",
    "template:core:bathroom:v1": "bathroom",
  };
  return map[id];
}

export function apartmentSlugFromId(id: string): string {
  return id.split(":")[2] ?? "unknown";
}
