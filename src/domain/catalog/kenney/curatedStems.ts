/** First-release Kenney stems approved for templates (Phase 3). */

export const KENNEY_TEMPLATE_CURATED_STEMS = [
  // Living room
  "loungeSofa",
  "loungeChair",
  "tableCoffee",
  "televisionModern",
  "cabinetTelevision",
  "rugRectangle",
  "lampRoundFloor",
  "pottedPlant",
  // Bedroom
  "bedDouble",
  "cabinetBedDrawerTable",
  "lampRoundTable",
  "pillow",
  "bookcaseOpen",
  // Kitchen appliances
  "kitchenFridge",
  "kitchenStoveElectric",
  "kitchenSink",
  "hoodModern",
  "kitchenMicrowave",
  "kitchenCoffeeMachine",
  // Bathroom
  "toilet",
  "bathroomSink",
  "bathroomMirror",
  "shower",
  "bathtub",
  // Office / electronics
  "desk",
  "chairDesk",
  "computerScreen",
  "computerKeyboard",
  "computerMouse",
  "laptop",
  // Extra curated browser/template slice
  "sideTable",
  "washer",
  "dryer",
] as const;

export type KenneyTemplateCuratedStem = (typeof KENNEY_TEMPLATE_CURATED_STEMS)[number];

/** Kenney kitchen cabinets — presentation only, never template-eligible. */
export const KENNEY_CABINET_PROP_STEMS = [
  "kitchenBar",
  "kitchenBarEnd",
  "kitchenCabinet",
  "kitchenCabinetCornerInner",
  "kitchenCabinetCornerRound",
  "kitchenCabinetDrawer",
  "kitchenCabinetUpper",
  "kitchenCabinetUpperCorner",
  "kitchenCabinetUpperDouble",
  "kitchenCabinetUpperLow",
] as const;

export function isKenneyTemplateCuratedStem(stem: string): boolean {
  return (KENNEY_TEMPLATE_CURATED_STEMS as readonly string[]).includes(stem);
}

export function isKenneyCabinetPropStem(stem: string): boolean {
  return (KENNEY_CABINET_PROP_STEMS as readonly string[]).includes(stem);
}
