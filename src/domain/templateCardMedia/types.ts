/** Template ids for card media — plain strings, no spec imports. */

export type ApartmentTemplateCardId =
  | "template:apartment:studio:v1"
  | "template:apartment:1bhk:v1"
  | "template:apartment:2bhk:v1"
  | "template:apartment:3bhk:v1";

export type CatalogTemplateCardId =
  | "template:core:living-room:v1"
  | "template:core:empty-room:v1"
  | "template:core:straight-kitchen:v1"
  | "template:core:l-kitchen:v1"
  | "template:core:bedroom:v1"
  | "template:core:bathroom:v1";

export type TemplateCardId = ApartmentTemplateCardId | CatalogTemplateCardId;

export type CardMediaVariantPaths = {
  w800: string;
  w1600: string;
};

export type CardMediaEntry = {
  poster: CardMediaVariantPaths;
  plan?: CardMediaVariantPaths;
  clip?: { webm: string; mp4: string; durationMs: number };
};
