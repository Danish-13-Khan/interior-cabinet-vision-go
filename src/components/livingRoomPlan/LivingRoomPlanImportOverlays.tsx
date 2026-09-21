import type { LivingRoomPlanUnderlay } from "../../domain/livingRoom/planUnderlay";
import { LivingRoomPlanDwgImportSlot } from "./LivingRoomPlanDwgImportSlot";
import { LivingRoomPlanPdfImportSlot } from "./LivingRoomPlanPdfImportSlot";

type LivingRoomPlanImportOverlaysProps = {
  roomWidthMm: number;
  dwgFile: File | null;
  pdfFile: File | null;
  onCancelDwg: () => void;
  onConfirmDwg: (underlay: LivingRoomPlanUnderlay) => void;
  onCancelPdf: () => void;
  onConfirmPdf: (underlay: LivingRoomPlanUnderlay) => void;
  onPdfError: (message: string) => void;
};

export function LivingRoomPlanImportOverlays(props: LivingRoomPlanImportOverlaysProps) {
  return (
    <>
      <LivingRoomPlanDwgImportSlot
        file={props.dwgFile}
        onCancel={props.onCancelDwg}
        onConfirm={props.onConfirmDwg}
      />
      <LivingRoomPlanPdfImportSlot
        file={props.pdfFile}
        roomWidthMm={props.roomWidthMm}
        onCancel={props.onCancelPdf}
        onConfirm={props.onConfirmPdf}
        onError={props.onPdfError}
      />
    </>
  );
}
