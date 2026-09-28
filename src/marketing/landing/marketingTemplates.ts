/** Homepage template cards. IDs mirror the built-in catalog without importing its 340 KB JSON. */
export type MarketingTemplate = {
  id: string;
  name: string;
  blurb: string;
  image: string;
};

export const MARKETING_TEMPLATES: readonly MarketingTemplate[] = [
  { id: 'template:core:straight-kitchen:v1', name: 'Straight Kitchen', blurb: 'One wall, tall pantry, base and wall units. The fastest start.', image: 'catalog/templates/straight-kitchen-v1.png' },
  { id: 'template:core:l-kitchen:v1', name: 'L Kitchen', blurb: 'Corner run with a working triangle ready to size.', image: 'catalog/templates/l-kitchen-v1.png' },
  { id: 'template:core:living-room:v1', name: 'Living Room', blurb: 'Media wall and storage around a furnished room.', image: 'catalog/templates/living-room-v1.png' },
  { id: 'template:core:bedroom:v1', name: 'Bedroom', blurb: 'Wardrobe wall with drawers and hanging space.', image: 'catalog/templates/bedroom-v1.png' },
  { id: 'template:core:bathroom:v1', name: 'Bathroom', blurb: 'Vanity run with tall linen storage.', image: 'catalog/templates/bathroom-v1.png' },
  { id: 'template:core:empty-room:v1', name: 'Empty Room', blurb: 'Blank walls and openings. Draw your own run.', image: 'catalog/templates/empty-room-v1.png' },
];

export const TEMPLATE_QUERY_PARAM = 'template';

export function findMarketingTemplate(id: string | null | undefined): MarketingTemplate | null {
  if (!id) return null;
  return MARKETING_TEMPLATES.find((template) => template.id === id) ?? null;
}

export function registerHrefForTemplate(id: string): string {
  return `/register?${new URLSearchParams({ [TEMPLATE_QUERY_PARAM]: id }).toString()}`;
}
