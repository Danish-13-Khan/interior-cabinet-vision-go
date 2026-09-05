import type { LivingRoomPlanUnderlay } from "./planUnderlay";

/** True when the file looks like a PDF (MIME and/or .pdf extension). */
export function isPdfFile(file: File): boolean {
  const type = (file.type || "").toLowerCase();
  if (type === "application/pdf" || type === "application/x-pdf") return true;
  return /\.pdf$/i.test(file.name || "");
}

/** Build underlay fields from an already-decoded PNG/JPEG/WebP data URL. */
export function dataUrlToUnderlay(
  dataUrl: string,
  fileName: string,
  roomWidthMm: number,
): Promise<LivingRoomPlanUnderlay> {
  return new Promise((resolve, reject) => {
    if (!dataUrl.startsWith("data:image/")) {
      reject(new Error("The selected file is not a supported plan image."));
      return;
    }
    const image = new Image();
    image.onerror = () => reject(new Error("The selected file is not a supported plan image."));
    image.onload = () => {
      const widthMm = roomWidthMm;
      const heightMm = roomWidthMm * image.naturalHeight / Math.max(1, image.naturalWidth);
      resolve({
        fileName,
        dataUrl,
        widthMm,
        heightMm,
        opacity: 0.42,
        xMm: 0,
        zMm: 0,
        rotationDeg: 0,
        locked: false,
        hidden: false,
        calibrated: false,
        importWidthMm: widthMm,
        importHeightMm: heightMm,
      });
    };
    image.src = dataUrl;
  });
}

/** Read an image into the persisted 2D plan-underlay format. */
export function imageFileToUnderlay(
  file: File,
  roomWidthMm: number,
): Promise<LivingRoomPlanUnderlay> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The selected image could not be read."));
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      void dataUrlToUnderlay(dataUrl, file.name, roomWidthMm).then(resolve, reject);
    };
    reader.readAsDataURL(file);
  });
}


/** Session gate so Escape/Cancel ignores a later rasterization confirm. */
export type PlanUnderlayImportCancelGate = {
  cancel: () => void;
  readonly cancelled: boolean;
  /** Returns null if already cancelled; else a generation token for this confirm. */
  beginConfirm: () => number | null;
  isCurrent: (confirmGen: number) => boolean;
};

export function createPlanUnderlayImportCancelGate(): PlanUnderlayImportCancelGate {
  let cancelled = false;
  let gen = 0;
  return {
    cancel() {
      cancelled = true;
      gen += 1;
    },
    get cancelled() {
      return cancelled;
    },
    beginConfirm() {
      if (cancelled) return null;
      return ++gen;
    },
    isCurrent(confirmGen: number) {
      return !cancelled && gen === confirmGen;
    },
  };
}
