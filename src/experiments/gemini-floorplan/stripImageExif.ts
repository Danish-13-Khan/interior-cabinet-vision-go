/** Strip camera/metadata EXIF by re-encoding through canvas as PNG. */
export async function stripImageExif(file: File): Promise<File> {
  if (file.type === "image/png" || file.type === "image/webp" || file.type === "image/jpeg") {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      throw new Error("Could not open canvas to strip image metadata.");
    }
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Failed to re-encode image."))),
        "image/png",
      );
    });
    const base = file.name.replace(/\.[^.]+$/, "") || "floorplan";
    return new File([blob], `${base}.png`, { type: "image/png" });
  }
  return file;
}
