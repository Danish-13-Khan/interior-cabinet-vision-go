import type { OpeningEntity, OpeningKind, ParameterValue } from "../interiorProject";

export type OpeningCatalogSymbol =
  | "single-swing"
  | "double-swing"
  | "fixed-glass"
  | "casement";

export type OpeningCatalogItem = {
  catalogItemId: string;
  name: string;
  kind: Exclude<OpeningKind, "opening">;
  symbol: OpeningCatalogSymbol;
  defaults: { widthMm: number; heightMm: number; sillHeightMm: number };
  parameters: Record<string, ParameterValue>;
  materialSlots: readonly string[];
  generator: "procedural-door" | "procedural-window";
};

export const OPENING_CATALOG: readonly OpeningCatalogItem[] = [
  {
    catalogItemId: "opening:door-single",
    name: "Single Swing Door",
    kind: "door",
    symbol: "single-swing",
    defaults: { widthMm: 900, heightMm: 2100, sillHeightMm: 0 },
    parameters: { leafCount: 1, swing: "in", frameDepthMm: 100 },
    materialSlots: ["frame", "leaf", "hardware"],
    generator: "procedural-door",
  },
  {
    catalogItemId: "opening:door-double",
    name: "Double Swing Door",
    kind: "door",
    symbol: "double-swing",
    defaults: { widthMm: 1600, heightMm: 2200, sillHeightMm: 0 },
    parameters: { leafCount: 2, swing: "in", frameDepthMm: 100 },
    materialSlots: ["frame", "leaf", "hardware"],
    generator: "procedural-door",
  },
  {
    catalogItemId: "opening:window-fixed",
    name: "Fixed Window",
    kind: "window",
    symbol: "fixed-glass",
    defaults: { widthMm: 1200, heightMm: 1200, sillHeightMm: 900 },
    parameters: { panelCount: 2, operable: false, frameDepthMm: 90 },
    materialSlots: ["frame", "glass"],
    generator: "procedural-window",
  },
  {
    catalogItemId: "opening:window-casement",
    name: "Casement Window",
    kind: "window",
    symbol: "casement",
    defaults: { widthMm: 900, heightMm: 1400, sillHeightMm: 900 },
    parameters: { panelCount: 1, operable: true, swing: "out", frameDepthMm: 90 },
    materialSlots: ["frame", "glass", "hardware"],
    generator: "procedural-window",
  },
] as const;

export function getOpeningCatalogItem(catalogItemId: string | undefined) {
  return OPENING_CATALOG.find((item) => item.catalogItemId === catalogItemId) ?? OPENING_CATALOG[0];
}

export function openingCatalogForKind(kind: "door" | "window") {
  return OPENING_CATALOG.filter((item) => item.kind === kind);
}

export function createOpeningCatalogInstance(input: {
  id: string; roomId?: string; wallId: string; catalogItemId: string; offsetMm: number;
}): OpeningEntity {
  const item = getOpeningCatalogItem(input.catalogItemId);
  return {
    id: input.id,
    roomId: input.roomId,
    wallId: input.wallId,
    kind: item.kind,
    offsetMm: input.offsetMm,
    ...item.defaults,
    catalogItemId: item.catalogItemId,
    materialSlots: {},
    parameters: { ...item.parameters },
    swingDirection: item.kind === "door" ? "in" : undefined,
  };
}
