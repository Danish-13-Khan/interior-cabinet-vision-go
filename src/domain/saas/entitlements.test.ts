import { describe, expect, it } from "vitest";
import {
  canSave,
  entitlementsForPlan,
  resolveEntitlements,
  UNAVAILABLE_ENTITLEMENTS,
} from "./entitlements";
import { PLAN_SKUS, type PlanSku } from "./plans";

describe("plan entitlements (A0)", () => {
  it("exposes Designer → Professional → Company SKUs", () => {
    expect(PLAN_SKUS).toEqual(["designer", "professional", "company"]);
  });

  it("grants canSave on every paid plan", () => {
    for (const sku of PLAN_SKUS) {
      expect(entitlementsForPlan(sku).canSave).toBe(true);
      expect(canSave(sku)).toBe(true);
    }
  });

  it("grants quote freeze + basic client on Designer+", () => {
    for (const sku of PLAN_SKUS) {
      const e = entitlementsForPlan(sku);
      expect(e.canFreezeQuotes).toBe(true);
      expect(e.canUseBasicClient).toBe(true);
    }
  });

  it("keeps Professional+ business tools off Designer", () => {
    const designer = entitlementsForPlan("designer");
    expect(designer.canUseClientHistory).toBe(false);
    expect(designer.canUsePaymentRecords).toBe(false);
    expect(designer.canUseOutstandingReports).toBe(false);
    expect(designer.canUseCompanyControls).toBe(false);
    expect(designer.canUsePremiumAudit).toBe(false);
  });

  it("enables Professional payment/client tools without company controls", () => {
    const pro = entitlementsForPlan("professional");
    expect(pro.canUseClientHistory).toBe(true);
    expect(pro.canUsePaymentRecords).toBe(true);
    expect(pro.canUseOutstandingReports).toBe(true);
    expect(pro.canUseCompanyControls).toBe(false);
    expect(pro.canUsePremiumAudit).toBe(false);
  });

  it("enables Company controls and premium audit", () => {
    const company = entitlementsForPlan("company");
    expect(company.canUseCompanyControls).toBe(true);
    expect(company.canUsePremiumAudit).toBe(true);
    expect(company.canUsePaymentRecords).toBe(true);
  });

  it("denies paid capabilities when subscription is inactive", () => {
    const inactive = resolveEntitlements({
      planSku: "company",
      subscriptionActive: false,
    });
    expect(inactive).toEqual(UNAVAILABLE_ENTITLEMENTS);
    expect(canSave("designer", false)).toBe(false);
  });

  it("clamps unknown plan sku when active", () => {
    const e = resolveEntitlements({
      planSku: "mystery",
      subscriptionActive: true,
    });
    expect(e.canSave).toBe(true);
    expect(e.canUseCompanyControls).toBe(false);
  });

  it("entitlement matrix matches BUSINESS_PRODUCT_SCOPE §5", () => {
    const matrix: Record<
      PlanSku,
      {
        canSave: boolean;
        history: boolean;
        payments: boolean;
        company: boolean;
      }
    > = {
      designer: {
        canSave: true,
        history: false,
        payments: false,
        company: false,
      },
      professional: {
        canSave: true,
        history: true,
        payments: true,
        company: false,
      },
      company: {
        canSave: true,
        history: true,
        payments: true,
        company: true,
      },
    };

    for (const sku of PLAN_SKUS) {
      const e = entitlementsForPlan(sku);
      const expected = matrix[sku];
      expect(e.canSave).toBe(expected.canSave);
      expect(e.canUseClientHistory).toBe(expected.history);
      expect(e.canUsePaymentRecords).toBe(expected.payments);
      expect(e.canUseCompanyControls).toBe(expected.company);
    }
  });
});
