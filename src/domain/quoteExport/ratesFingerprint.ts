import type { PriceBook } from "../priceBook";
import type { CostRateOverrides } from "../costingRates";
import type { CostingSettings } from "../costingSettings";
import type { QuoteSettings } from "../quoteSettings";
import { resolveCommercialInputs } from "../priceBook";

/** Stable stringify for fingerprinting rate books (sorted keys). */
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object)
      .sort()
      .filter((key) => object[key] !== undefined)
      .map((key) => `${JSON.stringify(key)}:${stable(object[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function djb2(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export type RatesFingerprintInput = {
  rates: CostRateOverrides;
  quote: QuoteSettings;
  priceBookUpdatedAt?: string;
};

export function createRatesFingerprint(input: RatesFingerprintInput): string {
  return djb2(
    stable({
      rates: input.rates,
      markup: input.quote.markupPercent,
      tax: input.quote.taxPercent,
      discount: input.quote.discountPercent,
      finish: input.quote.finishPremiumPercent,
      labour: input.quote.labourAllowance,
      bookAt: input.priceBookUpdatedAt ?? "",
    }),
  );
}

export function ratesFingerprintFromBook(
  prefs:
    | { costing?: Partial<CostingSettings>; quote?: Partial<QuoteSettings> }
    | undefined,
  book: PriceBook | null | undefined,
): string {
  const commercial = resolveCommercialInputs(prefs, book ?? null);
  return createRatesFingerprint({
    rates: commercial.rates,
    quote: commercial.quote,
    priceBookUpdatedAt: book?.updatedAt,
  });
}
