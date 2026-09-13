import type { BoardMaterialId, EdgeBandingId, FinishId } from "../materialSystem";

export type PriceBookScope = "personal" | "org";

export type BoardRate = {
  materialId: BoardMaterialId;
  thicknessMm: number;
  costPerM2: number;
};

export type FinishRate = {
  finishId: FinishId;
  costPerM2: number;
};

export type EdgeRate = {
  edgeBandingId: EdgeBandingId;
  costPerM: number;
};

export type HardwareRate = {
  hardwareId: string;
  costPerUnit: number;
};

/**
 * Labour on the price book maps to the existing engine:
 * workshopPercent → CostingSettings.labourPercent (% of board + waste)
 * workshopAllowance → CostingSettings.labourAllowance (flat ₹)
 * quoteAllowance → QuoteSettings.labourAllowance (flat ₹ on sell side)
 */
export type PriceBookLabour = {
  workshopPercent: number;
  workshopAllowance: number;
  quoteAllowance: number;
};

export type PriceBookWorkshop = {
  wastePercent: number;
  hardwareAllowance: number;
  materialRateMultiplier: number;
  finishRateMultiplier: number;
  hingeId: string;
  drawerSlideId: string;
  handleId: string;
};

export type PriceBookQuoteDefaults = {
  markupPercent: number;
  discountPercent: number;
  taxPercent: number;
  finishPremiumPercent: number;
};

/** Shop thickness norms they can change. Not applied to geometry in Phase A. */
export type ShopThicknessDefaults = {
  carcassMm: number;
  shutterMm: number;
  backMm: number;
};

export type PriceBook = {
  schemaVersion: 1;
  scope: PriceBookScope;
  ownerKey: string;
  updatedAt: string;
  boards: BoardRate[];
  finishes: FinishRate[];
  edges: EdgeRate[];
  hardware: HardwareRate[];
  labour: PriceBookLabour;
  workshop: PriceBookWorkshop;
  quoteDefaults: PriceBookQuoteDefaults;
  shopThickness: ShopThicknessDefaults;
};

export type FutureCatalogSlot = {
  id: string;
  kind: "board" | "finish";
  label: string;
  status: "todo";
  notes: string;
};

/**
 * Shared org price book (Phase D — activated from A stub).
 * Optional per-seat labour/quote overrides only (not a second engine).
 */
export type OrgSeatPriceOverride = {
  seatId: string;
  labour?: Partial<PriceBookLabour>;
  quoteDefaults?: Partial<PriceBookQuoteDefaults>;
};

export type OrgPriceBookRecord = {
  scope: "org";
  orgId: string;
  book: PriceBook;
  seatOverrides: OrgSeatPriceOverride[];
  updatedAt: string;
};

/** @deprecated Use OrgPriceBookRecord — kept for import compatibility. */
export type OrgPriceBookStub = OrgPriceBookRecord;
