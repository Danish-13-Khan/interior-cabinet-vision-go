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

export function unsupportedTextureWarning(name: string): string {
  return name ? `Unsupported texture ${name}.` : "Unsupported texture.";
}

const TEXTURE_WARNING = /^(?:Missing|Unsupported) texture (.+)\.$/;

/** One message per texture: the first warning wins, names compared case-insensitively. */
export function dedupeTextureWarnings(warnings: readonly string[]): string[] {
  const seen = new Set<string>();
  return warnings.filter((warning) => {
    const key = TEXTURE_WARNING.exec(warning)?.[1]?.toLowerCase() ?? warning;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
