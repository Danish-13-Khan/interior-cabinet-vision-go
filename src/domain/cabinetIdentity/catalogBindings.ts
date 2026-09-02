import type { CatalogCabinetBinding } from "./types";

export const RUN_FILLER_CATALOG_ID = "living:run-filler";

/** Explicit catalog-id → type/family map. Category is never consulted. */
export const CABINET_CATALOG_BINDINGS: Record<string, CatalogCabinetBinding> = {
  [RUN_FILLER_CATALOG_ID]: {
    cabinetType: "base",
    familyId: "frameless-standard-base",
    sku: null,
    production: true,
  },
  "living:base-cabinet-900": {
    cabinetType: "base",
    familyId: "frameless-standard-base",
    sku: "MW-BASE-900",
    production: true,
  },
  "living:wall-cabinet-900": {
    cabinetType: "wall",
    familyId: "frameless-standard-wall",
    sku: "MW-WALL-900",
    production: true,
  },
  "living:tall-pantry-600": {
    cabinetType: "tall",
    familyId: "frameless-standard-tall",
    sku: "MW-TALL-600",
    production: true,
  },
  "living:drawer-cabinet-900": {
    cabinetType: "drawer",
    familyId: "frameless-standard-drawer",
    sku: "MW-DRAWER-900",
    production: true,
  },
  "living:open-shelf-900": {
    cabinetType: "open-shelf",
    familyId: "frameless-standard-open-shelf",
    sku: "MW-SHELF-900",
    production: true,
  },
  "living:wardrobe-wall": {
    cabinetType: "almirah",
    familyId: "frameless-standard-almirah",
    sku: null,
    production: true,
  },
  "living:corner-wardrobe": {
    cabinetType: "corner",
    familyId: "frameless-standard-corner",
    sku: null,
    production: true,
  },
  "cabinet:base": {
    cabinetType: "base",
    familyId: "frameless-standard-base",
    sku: null,
    production: true,
  },
  "cabinet:wall": {
    cabinetType: "wall",
    familyId: "frameless-standard-wall",
    sku: null,
    production: true,
  },
  "cabinet:tall": {
    cabinetType: "tall",
    familyId: "frameless-standard-tall",
    sku: null,
    production: true,
  },
  "cabinet:drawer": {
    cabinetType: "drawer",
    familyId: "frameless-standard-drawer",
    sku: null,
    production: true,
  },
  "cabinet:sink": {
    cabinetType: "sink",
    familyId: "frameless-standard-sink",
    sku: null,
    production: true,
  },
  "cabinet:corner": {
    cabinetType: "corner",
    familyId: "frameless-standard-corner",
    sku: null,
    production: true,
  },
  "cabinet:open-shelf": {
    cabinetType: "open-shelf",
    familyId: "frameless-standard-open-shelf",
    sku: null,
    production: true,
  },
  "cabinet:almirah": {
    cabinetType: "almirah",
    familyId: "frameless-standard-almirah",
    sku: null,
    production: true,
  },
};

export function catalogBindingFor(catalogItemId: string): CatalogCabinetBinding | null {
  return CABINET_CATALOG_BINDINGS[catalogItemId] ?? null;
}

export function isRunFillerCatalogId(catalogItemId: string | undefined) {
  return catalogItemId === RUN_FILLER_CATALOG_ID;
}
