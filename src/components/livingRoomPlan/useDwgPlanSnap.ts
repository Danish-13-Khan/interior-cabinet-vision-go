import { useMemo } from "react";
import { collectDwgPlanEndpoints } from "../../domain/livingRoom/dwgPlanSnap";
import type { LivingRoomPlanUnderlay } from "../../domain/livingRoom/planUnderlay";

export function useDwgPlanSnap(underlay: LivingRoomPlanUnderlay | null) {
  const extraPoints = useMemo(() => collectDwgPlanEndpoints(underlay), [underlay]);
  const extraNodes = useMemo(
    () => extraPoints.map((position, index) => ({ id: `dwg-end-${index}`, position })),
    [extraPoints],
  );
  return { extraPoints, extraNodes };
}
