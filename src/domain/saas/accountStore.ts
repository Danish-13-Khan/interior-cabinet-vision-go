/**
 * Public barrel for local SaaS account helpers (A0).
 * Split across accountTypes / accountModel / accountPersistence /
 * accountSession / accountView to keep each file ≤ ~200 lines.
 */

export {
  ACCOUNT_STORAGE_KEY,
  type LocalAccountSnapshot,
  type AccountView,
  type StorageLike,
} from "./accountTypes";

export {
  createLocalAccount,
  clampLocalAccount,
} from "./accountModel";

export {
  readLocalAccount,
  persistLocalAccount,
  clearLocalAccount,
} from "./accountPersistence";

export {
  ensureLocalAccountForSession,
  ensureDesktopLocalAccount,
  setLocalPlanSku,
} from "./accountSession";

export {
  getAccountView,
  getCurrentPlanAndSaveGate,
} from "./accountView";
