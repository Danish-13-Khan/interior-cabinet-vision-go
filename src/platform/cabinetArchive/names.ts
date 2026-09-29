export const CABINET_MIME = "application/vnd.cabinet-studio+zip";

export function isCabinetPath(path: string): boolean {
  return /\.cabinet$/i.test(path.split(/[/\\]/).pop() ?? "");
}

export function cabinetFileName(path: string): string {
  const name = path.split(/[/\\]/).pop() || "project.cabinet";
  return isCabinetPath(name) ? name : `${name}.cabinet`;
}

export function textureExtension(mime: string): string {
  if (mime.includes("png")) return "png";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("webp")) return "webp";
  return "bin";
}

export function mimeForArchivePath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  if (ext === "glb") return "model/gltf-binary";
  return "application/octet-stream";
}

export function underlayArchivePath(id: string): string {
  const safe = id.replace(/[^a-zA-Z0-9._-]/g, "_") || "planUnderlay";
  return `underlays/${safe}.json`;
}
