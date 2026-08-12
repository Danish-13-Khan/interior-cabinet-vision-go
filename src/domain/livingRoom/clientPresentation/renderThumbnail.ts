/** Downscale a hero render data URL for project-browser thumbnails. */
export async function createLivingRoomRenderThumbnail(
  dataUrl: string,
  maxEdge = 360,
  quality = 0.72,
): Promise<string> {
  if (typeof document === "undefined") return dataUrl;
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      if (!context) {
        resolve(dataUrl);
        return;
      }
      context.fillStyle = "#1b211f";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

export function preferLivingRoomBrowserThumbnail(
  renderThumbnail: string | null | undefined,
  planThumbnail: string,
) {
  return renderThumbnail && renderThumbnail.startsWith("data:image/")
    ? renderThumbnail
    : planThumbnail;
}
