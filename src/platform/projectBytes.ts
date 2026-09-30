import { enqueueBrowserDownload } from "./browserDownloadQueue";
import { CABINET_MIME, cabinetFileName } from "./cabinetArchive/names";

function inTauri(): boolean {
  if (typeof window === "undefined") return false;
  const host = window as Window & { __TAURI_INTERNALS__?: unknown; __TAURI__?: unknown };
  return Boolean(host.__TAURI_INTERNALS__ || host.__TAURI__);
}

function copyBytes(bytes: Uint8Array): Uint8Array {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy;
}

function toArrayBuffer(payload: ArrayBuffer | ArrayBufferView | number[]): ArrayBuffer {
  if (payload instanceof ArrayBuffer) return payload;
  if (ArrayBuffer.isView(payload)) {
    return payload.buffer.slice(payload.byteOffset, payload.byteOffset + payload.byteLength) as ArrayBuffer;
  }
  return Uint8Array.from(payload).buffer;
}

/** Raw bytes, not base64, so a cabinet file is not inflated on the way to disk. */
export async function writeProjectBytes(path: string, bytes: Uint8Array, projectId?: string): Promise<void> {
  const copy = copyBytes(bytes);
  if (!inTauri()) {
    await enqueueBrowserDownload(new Blob([copy], { type: CABINET_MIME }), cabinetFileName(path));
    return;
  }
  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("save_project_bytes", copy, {
    headers: {
      path: encodeURIComponent(path),
      ...(projectId ? { "project-id": encodeURIComponent(projectId) } : {}),
    },
  });
}

export async function readProjectBytes(path: string): Promise<ArrayBuffer> {
  if (!inTauri()) throw new Error("Filesystem paths are only available in the desktop app.");
  const { invoke } = await import("@tauri-apps/api/core");
  const payload = await invoke<ArrayBuffer | number[]>("load_project_bytes", { path });
  if (payload instanceof ArrayBuffer || ArrayBuffer.isView(payload) || Array.isArray(payload)) {
    return toArrayBuffer(payload);
  }
  throw new Error("Desktop app returned an unexpected project file.");
}
