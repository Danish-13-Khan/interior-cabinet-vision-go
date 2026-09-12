import { beforeEach, describe, expect, it } from "vitest";
import {
  ACCOUNT_STORAGE_KEY,
  clearLocalAccount,
  ensureLocalAccountForSession,
  getAccountView,
  getCurrentPlanAndSaveGate,
  readLocalAccount,
  setLocalPlanSku,
} from "./accountStore";
import {
  isSubscriptionCommerciallyActive,
  openSaaSBillingPortal,
  startSaaSCheckout,
} from "./billing";
import { createBasicClientStub } from "./basicClient";
import { COMPANY_ROLES, createEmptyOrganizationStub } from "./companySchema";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

describe("local account store (A0)", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = memoryStorage();
  });

  it("creates Designer account for marketing session", () => {
    const account = ensureLocalAccountForSession(
      { email: "Alex@Showroom.com", company: "Rivera Studio" },
      storage,
    );
    expect(account.email).toBe("alex@showroom.com");
    expect(account.companyName).toBe("Rivera Studio");
    expect(account.subscription.planSku).toBe("designer");
    expect(account.subscription.status).toBe("active");
    expect(readLocalAccount(storage)?.email).toBe("alex@showroom.com");
  });

  it("answers current plan + canSave", () => {
    ensureLocalAccountForSession({ email: "a@b.co" }, storage);
    const gate = getCurrentPlanAndSaveGate(storage);
    expect(gate.planSku).toBe("designer");
    expect(gate.canSave).toBe(true);

    setLocalPlanSku("professional", storage);
    const view = getAccountView(storage);
    expect(view.planSku).toBe("professional");
    expect(view.entitlements.canUsePaymentRecords).toBe(true);
    expect(view.entitlements.canUseCompanyControls).toBe(false);
  });

  it("attaches organization stub only for Company SKU", () => {
    ensureLocalAccountForSession({ email: "a@b.co" }, storage);
    expect(getAccountView(storage).account?.organization).toBeNull();

    setLocalPlanSku("company", storage);
    const org = getAccountView(storage).account?.organization;
    expect(org).not.toBeNull();
    expect(org?.seats).toEqual([]);
  });

  it("clears account storage", () => {
    ensureLocalAccountForSession({ email: "a@b.co" }, storage);
    clearLocalAccount(storage);
    expect(storage.getItem(ACCOUNT_STORAGE_KEY)).toBeNull();
    expect(getCurrentPlanAndSaveGate(storage).canSave).toBe(false);
  });
});

describe("billing stubs (OUR subscription only)", () => {
  it("treats active/trialing/grace as commercially active", () => {
    expect(isSubscriptionCommerciallyActive("active")).toBe(true);
    expect(isSubscriptionCommerciallyActive("trialing")).toBe(true);
    expect(isSubscriptionCommerciallyActive("grace")).toBe(true);
    expect(isSubscriptionCommerciallyActive("none")).toBe(false);
    expect(isSubscriptionCommerciallyActive("canceled")).toBe(false);
  });

  it("returns provider_not_configured for checkout and portal", async () => {
    const checkout = await startSaaSCheckout({ planSku: "professional" });
    expect(checkout.ok).toBe(false);
    expect(checkout.reason).toBe("provider_not_configured");

    const portal = await openSaaSBillingPortal();
    expect(portal.ok).toBe(false);
    expect(portal.reason).toBe("provider_not_configured");
  });
});

describe("schema stubs", () => {
  it("lists company roles without UX", () => {
    expect(COMPANY_ROLES).toEqual([
      "owner",
      "designer",
      "engineer",
      "viewer",
    ]);
    expect(createEmptyOrganizationStub("Acme").name).toBe("Acme");
  });

  it("builds basic client typed stub", () => {
    const client = createBasicClientStub({
      contact: { name: "Priya", email: "p@client.test" },
      projectId: "saved-1",
    });
    expect(client.contact.name).toBe("Priya");
    expect(client.projectId).toBe("saved-1");
  });
});
