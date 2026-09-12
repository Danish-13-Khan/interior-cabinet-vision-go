export {
  PLAN_SKUS,
  PLAN_CATALOG,
  DEFAULT_PLAN_SKU,
  isPlanSku,
  clampPlanSku,
  getPlanDefinition,
  type PlanSku,
  type PlanDefinition,
} from "./plans";

export {
  UNAVAILABLE_ENTITLEMENTS,
  entitlementsForPlan,
  resolveEntitlements,
  canSave,
  canFreezeQuotes,
  canUsePaymentRecords,
  canUseClientHistory,
  canUseOutstandingReports,
  type PlanEntitlements,
} from "./entitlements";

export {
  createDefaultSubscription,
  isSubscriptionCommerciallyActive,
  startSaaSCheckout,
  openSaaSBillingPortal,
  stubSetLocalPlan,
  type SubscriptionStatus,
  type SaaSSubscriptionStub,
  type BillingCheckoutRequest,
  type BillingCheckoutResult,
  type BillingPortalResult,
} from "./billing";

export {
  ACCOUNT_STORAGE_KEY,
  createLocalAccount,
  clampLocalAccount,
  readLocalAccount,
  persistLocalAccount,
  clearLocalAccount,
  ensureLocalAccountForSession,
  ensureDesktopLocalAccount,
  setLocalPlanSku,
  getAccountView,
  getCurrentPlanAndSaveGate,
  type LocalAccountSnapshot,
  type AccountView,
} from "./accountStore";

export {
  COMPANY_ROLES,
  createEmptyOrganizationStub,
  isCompanyRole,
  type CompanyRole,
  type SeatStub,
  type OrganizationStub,
} from "./companySchema";

export {
  createBasicClientStub,
  type BasicClientContact,
  type BasicClientRecord,
} from "./basicClient";

export {
  createClientHistoryRecord,
  linkProjectToClient,
  summarizeClientHistory,
  type ClientHistoryRecord,
  type ClientHistorySummary,
} from "./clientHistory";

export {
  CLIENT_HISTORY_STORAGE_KEY,
  readClientHistory,
  persistClientHistory,
  upsertClientHistory,
} from "./clientHistoryStore";

