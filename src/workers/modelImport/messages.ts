const SUPPORTED = new Set(["glb", "gltf", "fbx", "obj", "mtl", "png", "jpg", "jpeg", "webp"]);

export function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

export function unsupportedImportMessage(name: string): string | null {
  const ext = extensionOf(name);
  if (!ext || SUPPORTED.has(ext)) return null;
  if (ext === "max") return "Export from 3ds Max as FBX or glTF.";
  return `Unsupported file .${ext}.`;
}

export const SKINNED_FBX_WARNING = "Animated or skinned FBX is imported as the static first frame.";

export function missingTextureWarning(name: string): string {
  return `Missing texture ${name}.`;
}
