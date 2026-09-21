import { lazy, Suspense } from "react";
import type { LivingRoomPlanUnderlay } from "../../domain/livingRoom/planUnderlay";

const PlanUnderlayDwgDialog = lazy(async () => {
  const mod = await import("./PlanUnderlayDwgDialog");
  return { default: mod.PlanUnderlayDwgDialog };
});

type LivingRoomPlanDwgImportSlotProps = {
  file: File | null;
  onCancel: () => void;
  onConfirm: (underlay: LivingRoomPlanUnderlay) => void;
};

export function LivingRoomPlanDwgImportSlot(props: LivingRoomPlanDwgImportSlotProps) {
  if (!props.file) return null;
  return (
    <Suspense fallback={null}>
      <PlanUnderlayDwgDialog
        key={props.file.name + props.file.lastModified}
        file={props.file}
        onCancel={props.onCancel}
        onConfirm={props.onConfirm}
      />
    </Suspense>
  );
}
