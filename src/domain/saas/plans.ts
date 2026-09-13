/**
 * SaaS plan SKUs (A0). Locked ladder: Designer → Professional → Company.
 * Pricing/copy stays out of client logic; capabilities use entitlement helpers.
 */

export type PlanSku = "designer" | "professional" | "company";

export type PlanDefinition = {
  sku: PlanSku;
  /** Product display label (not a price). */
  label: string;
  /** Seat model for this SKU; Company is multi-seat (schema only in A0). */
  seats: "single" | "multiple";
  /** Short product intent from BUSINESS_PRODUCT_SCOPE §5. */
  intent: string;
};

export const PLAN_SKUS: readonly PlanSku[] = [
  "designer",
  "professional",
  "company",
] as const;

export const PLAN_CATALOG: Record<PlanSku, PlanDefinition> = {
  designer: {
    sku: "designer",
    label: "Designer",
    seats: "single",
    intent: "Solo starter — designs, project details, basic client, quote freeze.",
  },
  professional: {
    sku: "professional",
    label: "Professional",
    seats: "single",
    intent:
      "Solo / small shop — client history, payment records, outstanding reports.",
  },
  company: {
    sku: "company",
    label: "Company",
    seats: "multiple",
    intent:
      "Studio / factory — seats, roles, shared projects (product UX later).",
  },
};

/** Default paid entry plan for new local accounts (A0). */
export const DEFAULT_PLAN_SKU: PlanSku = "designer";

export function isPlanSku(value: unknown): value is PlanSku {
  return (
    value === "designer" || value === "professional" || value === "company"
  );
}

export function clampPlanSku(
  value: unknown,
  fallback: PlanSku = DEFAULT_PLAN_SKU,
): PlanSku {
  return isPlanSku(value) ? value : fallback;
}

export function getPlanDefinition(sku: PlanSku): PlanDefinition {
  return PLAN_CATALOG[sku];
}
