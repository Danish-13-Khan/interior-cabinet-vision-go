import { describe, expect, it } from "vitest";
import type { SeatStub } from "../saas/companySchema";
import { canViewPaymentRecords } from "./paymentAccess";

const paid = { canUsePaymentRecords: true, canUseCompanyControls: false };
const company = { canUsePaymentRecords: true, canUseCompanyControls: true };
const seat = (active: boolean): SeatStub => ({
  id: "seat-1",
  email: "a@studio.test",
  role: "designer",
  active,
});

describe("payment view access", () => {
  it("matches entitlement and company-seat checks", () => {
    expect(canViewPaymentRecords({ entitlements: { canUsePaymentRecords: false, canUseCompanyControls: false } })).toBe(false);
    expect(canViewPaymentRecords({ entitlements: paid })).toBe(true);
    expect(canViewPaymentRecords({ entitlements: company, seat: null })).toBe(false);
    expect(canViewPaymentRecords({ entitlements: company, seat: seat(false) })).toBe(false);
    expect(canViewPaymentRecords({ entitlements: company, seat: seat(true) })).toBe(true);
  });
});
