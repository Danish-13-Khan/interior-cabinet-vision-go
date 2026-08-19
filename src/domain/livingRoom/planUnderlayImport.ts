import type { LivingRoomPlanUnderlay } from "./planUnderlay";

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
      const image = new Image();
      image.onerror = () => reject(new Error("The selected file is not a supported plan image."));
      image.onload = () => resolve({
        fileName: file.name,
        dataUrl,
        widthMm: roomWidthMm,
        heightMm: roomWidthMm * image.naturalHeight / Math.max(1, image.naturalWidth),
        opacity: 0.42,
      });
      image.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}
