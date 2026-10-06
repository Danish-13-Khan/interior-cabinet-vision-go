import { findCardMedia, type TemplateCardId } from '../../domain/templateCardMedia';

/** Homepage template cards. Catalog ids mirror the built-in catalog; apartments use template:apartment:*. */
export type MarketingTemplate = {
  id: string;
  name: string;
  blurb: string;
  image: string;
  /** Second image (apartments): the whole-apartment overview, shown on hover / focus. */
  planImage?: string;
  kind?: "catalog" | "apartment";
};

function marketingCard(id: TemplateCardId, name: string, blurb: string, kind: MarketingTemplate["kind"]): MarketingTemplate {
  const media = findCardMedia(id);
  return {
    id,
    name,
    blurb,
    image: media?.poster.w800 ?? '',
    planImage: media?.plan?.w800,
    kind,
  };
}

export const MARKETING_TEMPLATES: readonly MarketingTemplate[] = [
  marketingCard('template:apartment:studio:v1', 'Studio', '32 m² nordic open plan with kitchenette, bath, and sleep niche.', 'apartment'),
  marketingCard('template:apartment:1bhk:v1', '1 BHK', '50 m² warm contemporary with L-kitchen, bedroom, and utility.', 'apartment'),
  marketingCard('template:apartment:2bhk:v1', '2 BHK', '80 m² moody walnut with parallel kitchen and master suite.', 'apartment'),
  marketingCard('template:apartment:3bhk:v1', '3 BHK', '115 m² premium warm with foyer, study, three bedrooms, balcony.', 'apartment'),
  marketingCard('template:core:straight-kitchen:v1', 'Straight Kitchen', 'One wall, tall pantry, base and wall units. The fastest start.', 'catalog'),
  marketingCard('template:core:l-kitchen:v1', 'L Kitchen', 'Corner run with a working triangle ready to size.', 'catalog'),
  marketingCard('template:core:living-room:v1', 'Living Room', 'Media wall and storage around a furnished room.', 'catalog'),
  marketingCard('template:core:bedroom:v1', 'Bedroom', 'Wardrobe wall with drawers and hanging space.', 'catalog'),
  marketingCard('template:core:bathroom:v1', 'Bathroom', 'Vanity run with tall linen storage.', 'catalog'),
  marketingCard('template:core:empty-room:v1', 'Empty Room', 'Blank walls and openings. Draw your own run.', 'catalog'),
];

export const TEMPLATE_QUERY_PARAM = 'template';

export function findMarketingTemplate(id: string | null | undefined): MarketingTemplate | null {
  if (!id) return null;
  return MARKETING_TEMPLATES.find((template) => template.id === id) ?? null;
}

export function registerHrefForTemplate(id: string): string {
  return `/register?${new URLSearchParams({ [TEMPLATE_QUERY_PARAM]: id }).toString()}`;
}
