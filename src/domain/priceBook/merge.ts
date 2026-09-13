import {
  clampCostingSettings,
  DEFAULT_COSTING_SETTINGS,
  type CostingSettings,
} from "../costingSettings";
import {
  clampQuoteSettings,
  DEFAULT_QUOTE_SETTINGS,
  type QuoteSettings,
} from "../quoteSettings";
import { clampPriceBook } from "./clamp";
import { toCostRateOverrides } from "./rates";
import type { PriceBook } from "./types";
import type { CostRateOverrides } from "../costingRates";

export type CommercialInputs = {
  costing: CostingSettings;
  quote: QuoteSettings;
  rates: CostRateOverrides;
};

function costingFromBook(book: PriceBook): CostingSettings {
  return clampCostingSettings({
    presetId: "price-book",
    wastePercent: book.workshop.wastePercent,
    labourPercent: book.labour.workshopPercent,
    hardwareAllowance: book.workshop.hardwareAllowance,
    labourAllowance: book.labour.workshopAllowance,
    materialRateMultiplier: book.workshop.materialRateMultiplier,
    finishRateMultiplier: book.workshop.finishRateMultiplier,
    hingeId: book.workshop.hingeId,
    drawerSlideId: book.workshop.drawerSlideId,
    handleId: book.workshop.handleId,
  });
}

function quoteFromBook(book: PriceBook): QuoteSettings {
  return clampQuoteSettings({
    ...DEFAULT_QUOTE_SETTINGS,
    markupPercent: book.quoteDefaults.markupPercent,
    discountPercent: book.quoteDefaults.discountPercent,
    taxPercent: book.quoteDefaults.taxPercent,
    finishPremiumPercent: book.quoteDefaults.finishPremiumPercent,
    labourAllowance: book.labour.quoteAllowance,
  });
}

function overlayCustom<T extends Record<string, unknown>>(
  factory: T,
  current: T,
  fromBook: T,
): T {
  const next = { ...fromBook };
  (Object.keys(factory) as Array<keyof T>).forEach((key) => {
    if (current[key] !== factory[key]) {
      next[key] = current[key];
    }
  });
  return next;
}

export function mergeCostingSettings(
  projectCosting: Partial<CostingSettings> | undefined,
  book: PriceBook,
): CostingSettings {
  const current = clampCostingSettings(projectCosting ?? DEFAULT_COSTING_SETTINGS);
  return clampCostingSettings(
    overlayCustom(DEFAULT_COSTING_SETTINGS, current, costingFromBook(book)),
  );
}

export function mergeQuoteSettings(
  projectQuote: Partial<QuoteSettings> | undefined,
  book: PriceBook,
): QuoteSettings {
  const current = clampQuoteSettings(projectQuote ?? DEFAULT_QUOTE_SETTINGS);
  return clampQuoteSettings(
    overlayCustom(DEFAULT_QUOTE_SETTINGS, current, quoteFromBook(book)),
  );
}

/**
 * Adapter: price book + project prefs → existing costing/quote engine inputs.
 * No book → identical to today's clamp of project prefs.
 * Book + factory-equal prefs → book labour / commercial defaults apply.
 * Project fields that differ from factory defaults win.
 * Board/finish/hardware ₹ always come from the book when one is supplied.
 */
export function resolveCommercialInputs(
  prefs: { costing?: Partial<CostingSettings>; quote?: Partial<QuoteSettings> } | undefined,
  book?: PriceBook | null,
): CommercialInputs {
  if (!book) {
    return {
      costing: clampCostingSettings(prefs?.costing ?? DEFAULT_COSTING_SETTINGS),
      quote: clampQuoteSettings(prefs?.quote ?? DEFAULT_QUOTE_SETTINGS),
      rates: {},
    };
  }
  const safe = clampPriceBook(book);
  return {
    costing: mergeCostingSettings(prefs?.costing, safe),
    quote: mergeQuoteSettings(prefs?.quote, safe),
    rates: toCostRateOverrides(safe),
  };
}
