import { thumbnailMime } from "./spike";

/** 256px preview. Returns null where OffscreenCanvas WebGL is unavailable (spike fallback). */
export async function renderThumbnail(webpEncode: boolean): Promise<ArrayBuffer | null> {
  if (typeof OffscreenCanvas === "undefined") return null;
  try {
    const canvas = new OffscreenCanvas(256, 256);
    const context = canvas.getContext("2d");
    if (!context || typeof canvas.convertToBlob !== "function") return null;
    context.fillStyle = "#d7c4a3";
    context.fillRect(0, 0, 256, 256);
    const blob = await canvas.convertToBlob({ type: thumbnailMime(webpEncode), quality: 0.8 });
    return blob.arrayBuffer();
  } catch {
    return null;
  }
}
