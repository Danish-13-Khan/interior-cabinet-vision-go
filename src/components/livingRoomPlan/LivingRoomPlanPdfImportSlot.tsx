import { lazy, Suspense } from "react";
import type { LivingRoomPlanUnderlay } from "../../domain/livingRoom/planUnderlay";

const PlanUnderlayPdfDialog = lazy(async () => {
  const mod = await import("./PlanUnderlayPdfDialog");
  return { default: mod.PlanUnderlayPdfDialog };
});

type LivingRoomPlanPdfImportSlotProps = {
  file: File | null;
  roomWidthMm: number;
  onCancel: () => void;
  onConfirm: (underlay: LivingRoomPlanUnderlay) => void;
  onError: (message: string) => void;
};

export function LivingRoomPlanPdfImportSlot(props: LivingRoomPlanPdfImportSlotProps) {
  if (!props.file) return null;
  return (
    <Suspense fallback={null}>
      <PlanUnderlayPdfDialog
        file={props.file}
        roomWidthMm={props.roomWidthMm}
        onCancel={props.onCancel}
        onConfirm={props.onConfirm}
        onError={props.onError}
      />
    </Suspense>
  );
}
