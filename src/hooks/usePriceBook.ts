import { useCommercialStorageRevision, notifyCommercialStorageChanged } from "./useCommercialStorageRevision";
import { useCallback, useMemo, useState } from "react";
import {
  clampPriceBook,
  createDefaultPriceBook,
  persistPersonalPriceBook,
  readOrgPriceBookStub,
  readPersonalPriceBook,
  type PriceBook,
} from "../domain/priceBook";
import { useAccountPlan } from "./useAccountPlan";

/**
 * Personal Price Book (Phase A). All paid plans can edit.
 * Company shared org book is a stub until Phase D.
 */
export function usePriceBook() {
  const { entitlements } = useAccountPlan();
  const revision = useCommercialStorageRevision();
  const [tick, setTick] = useState(0);

  const priceBook = useMemo(() => {
    void tick;
    return readPersonalPriceBook();
  }, [tick, revision]);

  const refresh = useCallback(() => {
    setTick((n) => n + 1);
  }, []);

  const save = useCallback(
    (patch: Partial<PriceBook>) => {
      if (!entitlements.canEditPersonalPriceBook) return readPersonalPriceBook();
      const next = persistPersonalPriceBook(clampPriceBook({ ...priceBook, ...patch }));
      notifyCommercialStorageChanged();
      setTick((n) => n + 1);
      return next;
    },
    [entitlements.canEditPersonalPriceBook, priceBook],
  );

  const resetToDefaults = useCallback(() => {
    if (!entitlements.canEditPersonalPriceBook) return readPersonalPriceBook();
    const next = persistPersonalPriceBook(createDefaultPriceBook(priceBook.ownerKey));
    notifyCommercialStorageChanged();
    setTick((n) => n + 1);
    return next;
  }, [entitlements.canEditPersonalPriceBook, priceBook.ownerKey]);

  return {
    priceBook,
    canEdit: entitlements.canEditPersonalPriceBook,
    canUseOrgBook: entitlements.canUseSharedOrgPriceBook,
    orgBook: entitlements.canUseSharedOrgPriceBook ? readOrgPriceBookStub() : null,
    save,
    resetToDefaults,
    refresh,
  };
}
