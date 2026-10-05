/** Homepage template cards. Catalog ids mirror the built-in catalog; apartments use template:apartment:*. */
export type MarketingTemplate = {
  id: string;
  name: string;
  blurb: string;
  image: string;
  kind?: "catalog" | "apartment";
};

export const MARKETING_TEMPLATES: readonly MarketingTemplate[] = [
  { id: 'template:apartment:studio:v1', name: 'Studio', blurb: '32 m² nordic open plan with kitchenette, bath, and sleep niche.', image: 'catalog/templates/living-room-v1.png', kind: 'apartment' },
  { id: 'template:apartment:1bhk:v1', name: '1 BHK', blurb: '50 m² warm contemporary with L-kitchen, bedroom, and utility.', image: 'catalog/templates/bedroom-v1.png', kind: 'apartment' },
  { id: 'template:apartment:2bhk:v1', name: '2 BHK', blurb: '80 m² moody walnut with parallel kitchen and master suite.', image: 'catalog/templates/l-kitchen-v1.png', kind: 'apartment' },
  { id: 'template:apartment:3bhk:v1', name: '3 BHK', blurb: '115 m² premium warm with foyer, study, three bedrooms, balcony.', image: 'catalog/templates/straight-kitchen-v1.png', kind: 'apartment' },
  { id: 'template:core:straight-kitchen:v1', name: 'Straight Kitchen', blurb: 'One wall, tall pantry, base and wall units. The fastest start.', image: 'catalog/templates/straight-kitchen-v1.png', kind: 'catalog' },
  { id: 'template:core:l-kitchen:v1', name: 'L Kitchen', blurb: 'Corner run with a working triangle ready to size.', image: 'catalog/templates/l-kitchen-v1.png', kind: 'catalog' },
  { id: 'template:core:living-room:v1', name: 'Living Room', blurb: 'Media wall and storage around a furnished room.', image: 'catalog/templates/living-room-v1.png', kind: 'catalog' },
  { id: 'template:core:bedroom:v1', name: 'Bedroom', blurb: 'Wardrobe wall with drawers and hanging space.', image: 'catalog/templates/bedroom-v1.png', kind: 'catalog' },
  { id: 'template:core:bathroom:v1', name: 'Bathroom', blurb: 'Vanity run with tall linen storage.', image: 'catalog/templates/bathroom-v1.png', kind: 'catalog' },
  { id: 'template:core:empty-room:v1', name: 'Empty Room', blurb: 'Blank walls and openings. Draw your own run.', image: 'catalog/templates/empty-room-v1.png', kind: 'catalog' },
];

export const TEMPLATE_QUERY_PARAM = 'template';

export function findMarketingTemplate(id: string | null | undefined): MarketingTemplate | null {
  if (!id) return null;
  return MARKETING_TEMPLATES.find((template) => template.id === id) ?? null;
}

export function registerHrefForTemplate(id: string): string {
  return `/register?${new URLSearchParams({ [TEMPLATE_QUERY_PARAM]: id }).toString()}`;
}
