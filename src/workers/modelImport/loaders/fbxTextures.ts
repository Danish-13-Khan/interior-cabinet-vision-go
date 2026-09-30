import { Loader, LoadingManager, Texture } from "three";
import { unsupportedTextureWarning } from "../messages";
import { decodeTexture } from "./textures";

const IMAGE_EXTS = ["png", "jpg", "jpeg", "webp", "bmp", "gif"];

type ImageBytes = { bytes: ArrayBuffer; mime: string };

function mimeFor(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".bmp")) return "image/bmp";
  return "image/png";
}

function basename(name: string): string {
  return name.split(/[/\\]/).pop()?.split("?")[0]?.toLowerCase() ?? "";
}

/** FBXLoader reads `window.URL` while building embedded images. Workers have no window. */
export function ensureFbxWindow(): () => void {
  const scope = globalThis as unknown as { window?: { URL: typeof URL; innerWidth: number; innerHeight: number } };
  if (scope.window !== undefined) return () => undefined;
  scope.window = { URL, innerWidth: 1, innerHeight: 1 };
  return () => { delete scope.window; };
}

async function readTextureBytes(url: string, images: ReadonlyMap<string, ArrayBuffer>): Promise<ImageBytes | null> {
  try {
    if (url.startsWith("data:")) {
      const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(url);
      if (!match) return null;
      const mime = match[1] || "image/png";
      const payload = match[3] ?? "";
      if (match[2]) {
        const binary = atob(payload.replace(/\s/g, ""));
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
        return { bytes: bytes.buffer, mime };
      }
      return { bytes: new TextEncoder().encode(decodeURIComponent(payload)).buffer, mime };
    }
    if (url.startsWith("blob:") || url.startsWith("http:") || url.startsWith("https:")) {
      const response = await fetch(url);
      if (!response.ok) return null;
      const bytes = await response.arrayBuffer();
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      return { bytes, mime: response.headers.get("content-type") || "image/png" };
    }
    const bytes = images.get(basename(url));
    return bytes ? { bytes, mime: mimeFor(url) } : null;
  } catch {
    return null;
  }
}

type TextureHandler = {
  path: string | undefined;
  setPath: (path?: string) => TextureHandler;
  load: (
    url: string,
    onLoad?: (texture: Texture) => void,
    onProgress?: unknown,
    onError?: (error: unknown) => void,
  ) => Texture;
};

export type FbxTextureSession = {
  manager: LoadingManager;
  ready: () => Promise<void>;
  warnings: () => readonly string[];
};

/** Image handler that never touches `document`, so textured FBX can parse in a worker. */
export function attachFbxTextureLoader(files: readonly { name: string; bytes: ArrayBuffer }[]): FbxTextureSession {
  const images = new Map<string, ArrayBuffer>();
  for (const file of files) {
    const base = basename(file.name);
    if (base) images.set(base, file.bytes);
  }
  const pending: Promise<void>[] = [];
  const warnings: string[] = [];
  const manager = new LoadingManager();
  const imageLoader: TextureHandler = {
    path: "",
    setPath(path?: string) { this.path = path; return this; },
    load(url, onLoad, _onProgress, onError) {
      const resolved = this.path ? `${this.path}${url}` : url;
      const texture = new Texture();
      const task = readTextureBytes(resolved, images).then(async (image) => {
        if (!image) return;
        const bitmap = await decodeTexture(image.bytes, image.mime, false);
        if (!bitmap) return;
        texture.image = bitmap as unknown as HTMLImageElement;
        texture.needsUpdate = true;
        onLoad?.(texture);
      }).catch((error: unknown) => { onError?.(error); });
      pending.push(task.then(() => undefined, () => undefined));
      return texture;
    },
  };
  // .tga, .dds, .tif and anything else must not fall through to TextureLoader, which needs document.
  const fallback: TextureHandler = {
    path: "",
    setPath(path?: string) { this.path = path; return this; },
    load(url) {
      const resolved = this.path ? `${this.path}${url}` : url;
      const embedded = resolved.startsWith("blob:") || resolved.startsWith("data:");
      warnings.push(unsupportedTextureWarning(embedded ? "" : basename(resolved)));
      return new Texture();
    },
  };
  for (const ext of IMAGE_EXTS) manager.addHandler(new RegExp(`\\.${ext}$`, "i"), imageLoader as unknown as Loader);
  manager.addHandler(/.+/, fallback as unknown as Loader);
  return { manager, ready: () => Promise.all(pending).then(() => undefined), warnings: () => warnings };
}
