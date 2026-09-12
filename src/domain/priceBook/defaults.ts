import {
  BOARD_MATERIALS,
  EDGE_BANDING_OPTIONS,
  FINISHES,
} from "../materialSystem";
import { HARDWARE_CATALOG } from "../hardwareSystem";
import { DEFAULT_COSTING_SETTINGS } from "../costingSettings";
import { DEFAULT_QUOTE_SETTINGS } from "../quoteSettings";
import type {
  FutureCatalogSlot,
  OrgPriceBookStub,
  PriceBook,
  PriceBookLabour,
  PriceBookQuoteDefaults,
  PriceBookScope,
  PriceBookWorkshop,
  ShopThicknessDefaults,
} from "./types";

/** Indian shop workshop labour sits in the existing 35–45% preset band. */
export const DEFAULT_PRICE_BOOK_LABOUR: PriceBookLabour = {
  workshopPercent: DEFAULT_COSTING_SETTINGS.labourPercent,
  workshopAllowance: DEFAULT_COSTING_SETTINGS.labourAllowance,
  quoteAllowance: DEFAULT_QUOTE_SETTINGS.labourAllowance,
};

export const DEFAULT_PRICE_BOOK_WORKSHOP: PriceBookWorkshop = {
  wastePercent: DEFAULT_COSTING_SETTINGS.wastePercent,
  hardwareAllowance: DEFAULT_COSTING_SETTINGS.hardwareAllowance,
  materialRateMultiplier: DEFAULT_COSTING_SETTINGS.materialRateMultiplier,
  finishRateMultiplier: DEFAULT_COSTING_SETTINGS.finishRateMultiplier,
  hingeId: DEFAULT_COSTING_SETTINGS.hingeId,
  drawerSlideId: DEFAULT_COSTING_SETTINGS.drawerSlideId,
  handleId: DEFAULT_COSTING_SETTINGS.handleId,
};

export const DEFAULT_PRICE_BOOK_QUOTE: PriceBookQuoteDefaults = {
  markupPercent: DEFAULT_QUOTE_SETTINGS.markupPercent,
  discountPercent: DEFAULT_QUOTE_SETTINGS.discountPercent,
  taxPercent: DEFAULT_QUOTE_SETTINGS.taxPercent,
  finishPremiumPercent: DEFAULT_QUOTE_SETTINGS.finishPremiumPercent,
};

/** 16 carcass / 18 shutter / 9 back — stored only; engine geometry still uses current defaults. */
export const DEFAULT_SHOP_THICKNESS: ShopThicknessDefaults = {
  carcassMm: 16,
  shutterMm: 18,
  backMm: 9,
};

export const SHOP_THICKNESS_CHOICES = [6, 8, 9, 12, 16, 18, 22, 25] as const;

/**
 * Typed slots for Indian shop catalog growth. Not BoardMaterialId / FinishId —
 * adding those unions would ripple through geometry and pickers.
 */
export const FUTURE_CATALOG_SLOTS: readonly FutureCatalogSlot[] = [
  {
    id: "blockboard",
    kind: "board",
    label: "Blockboard",
    status: "todo",
    notes: "Add BoardMaterialId when the shop catalog expands; keep price-book rates ready.",
  },
  {
    id: "pine",
    kind: "board",
    label: "Pine",
    status: "todo",
    notes: "Solid-wood / pine carcass option — typed slot only in Phase A.",
  },
  {
    id: "laminate-hg",
    kind: "finish",
    label: "Laminate HG",
    status: "todo",
    notes: "High-gloss laminate grade. FinishId stays generic `laminate` for now.",
  },
  {
    id: "laminate-acrylic",
    kind: "finish",
    label: "Acrylic laminate",
    status: "todo",
    notes: "Acrylic grade slot — do not invent a parallel finish engine.",
  },
  {
    id: "laminate-matt",
    kind: "finish",
    label: "Matt laminate",
    status: "todo",
    notes: "Matt laminate grade distinct from white-matte paint.",
  },
  {
    id: "laminate-inner",
    kind: "finish",
    label: "Inner carcass laminate",
    status: "todo",
    notes: "Inner vs shutter laminate; wait for FinishId expansion.",
  },
];

export function createDefaultPriceBook(
  ownerKey = "local",
  scope: PriceBookScope = "personal",
): PriceBook {
  return {
    schemaVersion: 1,
    scope: scope === "org" ? "org" : "personal",
    ownerKey: ownerKey.trim() || "local",
    updatedAt: "1970-01-01T00:00:00.000Z",
    boards: BOARD_MATERIALS.flatMap((mat) =>
      Object.entries(mat.costPerM2).map(([thickness, costPerM2]) => ({
        materialId: mat.id,
        thicknessMm: Number(thickness),
        costPerM2,
      })),
    ),
    finishes: FINISHES.map((item) => ({
      finishId: item.id,
      costPerM2: item.costPerM2,
    })),
    edges: EDGE_BANDING_OPTIONS.map((item) => ({
      edgeBandingId: item.id,
      costPerM: item.costPerM,
    })),
    hardware: HARDWARE_CATALOG.map((item) => ({
      hardwareId: item.id,
      costPerUnit: item.costPerUnit,
    })),
    labour: { ...DEFAULT_PRICE_BOOK_LABOUR },
    workshop: { ...DEFAULT_PRICE_BOOK_WORKSHOP },
    quoteDefaults: { ...DEFAULT_PRICE_BOOK_QUOTE },
    shopThickness: { ...DEFAULT_SHOP_THICKNESS },
  };
}

export function createOrgPriceBookStub(): OrgPriceBookStub {
  return {
    scope: "org",
    status: "deferred-phase-d",
    notes:
      "Company shared org price book + per-seat overrides ship in Phase D. Personal book is live.",
  };
}
