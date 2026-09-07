import type { ManufacturerCatalogue } from "./manufacturerCatalogueTypes";

/** 1×1 PNG — enough for mapUrl persistence / has-map swatches without bloating seeds. */
const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

/**
 * Curated in-app manufacturer packs (M6.3). Not scraped — finishes ship as project-copyable seeds.
 * M6.4 can add brand / SKU / multi-map fields later.
 */
export const MANUFACTURER_CATALOGUES: readonly ManufacturerCatalogue[] = [
  {
    id: "mfr:studio-laminates",
    name: "Studio Laminates",
    note: "Sample board · woods & solids",
    finishes: [
      {
        id: "mfr:studio-laminates:warm-oak",
        name: "Warm Oak Laminate",
        kind: "laminate",
        color: "#c4a574",
        mapDataUrl: TINY_PNG,
        roughness: 0.68,
      },
      {
        id: "mfr:studio-laminates:slate-grey",
        name: "Slate Grey Laminate",
        kind: "laminate",
        color: "#6a6e74",
        mapDataUrl: TINY_PNG,
        roughness: 0.7,
      },
    ],
  },
  {
    id: "mfr:atelier-woods",
    name: "Atelier Woods",
    note: "Curated veneers · demo pack",
    finishes: [
      {
        id: "mfr:atelier-woods:smoked-walnut",
        name: "Smoked Walnut Veneer",
        kind: "wood",
        color: "#4b3328",
        mapDataUrl: TINY_PNG,
        roughness: 0.58,
      },
      {
        id: "mfr:atelier-woods:natural-ash",
        name: "Natural Ash Veneer",
        kind: "wood",
        color: "#d2c4a8",
        mapDataUrl: TINY_PNG,
        roughness: 0.62,
      },
    ],
  },
];

export function listManufacturerCatalogues(): readonly ManufacturerCatalogue[] {
  return MANUFACTURER_CATALOGUES;
}

export function getManufacturerCatalogue(catalogueId: string): ManufacturerCatalogue | null {
  return MANUFACTURER_CATALOGUES.find((catalogue) => catalogue.id === catalogueId) ?? null;
}

export function findManufacturerFinish(finishId: string) {
  for (const catalogue of MANUFACTURER_CATALOGUES) {
    const finish = catalogue.finishes.find((item) => item.id === finishId);
    if (finish) return { catalogue, finish };
  }
  return null;
}
