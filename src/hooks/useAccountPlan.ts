import { useCommercialStorageRevision, notifyCommercialStorageChanged } from "./useCommercialStorageRevision";
import { useCallback, useMemo, useState } from "react";
import {
  ensureDesktopLocalAccount,
  ensureLocalAccountForSession,
  getAccountView,
  setLocalPlanSku,
  type AccountView,
  type PlanSku,
} from "../domain/saas";
import { getSession } from "../marketing/lib/auth";
import { isTauriRuntime } from "../platform/desktopFiles";

/**
 * Current SaaS plan + entitlements (A0).
 * Uses marketing session identity on web; desktop gets a local Designer account.
 */
export function useAccountPlan() {
  const revision = useCommercialStorageRevision();
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => {
    setTick((n) => n + 1);
  }, []);

  const view: AccountView = useMemo(() => {
    void tick;
    if (isTauriRuntime()) {
      ensureDesktopLocalAccount();
    } else {
      const session = getSession();
      if (session) {
        ensureLocalAccountForSession(session);
      }
    }
    return getAccountView();
  }, [tick, revision]);

  const setPlan = useCallback(
    (planSku: PlanSku) => {
      setLocalPlanSku(planSku);
      notifyCommercialStorageChanged();
      refresh();
    },
    [refresh],
  );

  return {
    ...view,
    planSku: view.planSku,
    canSave: view.entitlements.canSave,
    canFreezeQuotes: view.entitlements.canFreezeQuotes,
    setPlan,
    refresh,
  };
}
