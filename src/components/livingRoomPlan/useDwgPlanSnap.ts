import { useMemo } from "react";
import { collectDwgPlanEndpoints } from "../../domain/livingRoom/dwgPlanSnap";
import type { LivingRoomPlanUnderlay } from "../../domain/livingRoom/planUnderlay";

/** DWG / DXF path endpoints in plan mm, fed to the snap engine as `dwg-end` candidates. */
export function useDwgPlanSnap(underlay: LivingRoomPlanUnderlay | null) {
  const endpoints = useMemo(() => collectDwgPlanEndpoints(underlay), [underlay]);
  return { endpoints };
}
