import type { ManufacturerCatalogue } from "./manufacturerCatalogueTypes";

/**
 * Tiny project-owned PNGs for catalogue seeds.
 * Normal ≈ RGB(128,128,255) opaque; roughness is opaque grayscale — never reuse albedo for PBR maps.
 */
const ALBEDO_WARM =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGM4srTkPwAG6wLdBaK3NwAAAABJRU5ErkJggg==";
const ALBEDO_SLATE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGPIyiv5DwAE3gJMpedKvwAAAABJRU5ErkJggg==";
const ALBEDO_WALNUT =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGPwNtb4DwADGQGmDt1SCwAAAABJRU5ErkJggg==";
const ALBEDO_ASH =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGO4dGTFfwAH6AM+0hfREwAAAABJRU5ErkJggg==";
const NORMAL_NEUTRAL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNoaPj/HwAGggL/s75RMwAAAABJRU5ErkJggg==";
const ROUGHNESS_MID =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNYsWLFfwAG7AL4BWMKnwAAAABJRU5ErkJggg==";

/** Curated in-app manufacturer packs (M6.3–M6.4). Not scraped — finishes ship as project-copyable seeds. */
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
        mapDataUrl: ALBEDO_WARM,
        roughness: 0.68,
        brand: "Studio Laminates",
        productCode: "SL-WO-284",
        sheetWidthMm: 2800,
        sheetHeightMm: 2070,
        normalMapDataUrl: NORMAL_NEUTRAL,
        roughnessMapDataUrl: ROUGHNESS_MID,
      },
      {
        id: "mfr:studio-laminates:slate-grey",
        name: "Slate Grey Laminate",
        kind: "laminate",
        color: "#6a6e74",
        mapDataUrl: ALBEDO_SLATE,
        roughness: 0.7,
        brand: "Studio Laminates",
        productCode: "SL-SG-122",
        sheetWidthMm: 2800,
        sheetHeightMm: 2070,
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
        mapDataUrl: ALBEDO_WALNUT,
        roughness: 0.58,
        brand: "Atelier Woods",
        productCode: "AW-SW-01",
        sheetWidthMm: 2500,
        sheetHeightMm: 1250,
        normalMapDataUrl: NORMAL_NEUTRAL,
        roughnessMapDataUrl: ROUGHNESS_MID,
      },
      {
        id: "mfr:atelier-woods:natural-ash",
        name: "Natural Ash Veneer",
        kind: "wood",
        color: "#d2c4a8",
        mapDataUrl: ALBEDO_ASH,
        roughness: 0.62,
        brand: "Atelier Woods",
        productCode: "AW-NA-02",
        sheetWidthMm: 2500,
        sheetHeightMm: 1250,
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
