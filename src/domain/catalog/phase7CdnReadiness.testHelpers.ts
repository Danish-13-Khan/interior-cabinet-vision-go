import type { CatalogManifest } from ".";

export const PHASE7_FILE_ID = "model:kenney:lounge-sofa:v1";

export async function sha256Hex(bytes: BufferSource): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function patchFileIntegrity(
  manifest: CatalogManifest,
  fileId: string,
  hash: string,
  byteSize: number,
): CatalogManifest {
  const copy = structuredClone(manifest) as CatalogManifest;
  const file = copy.files.find((entry) => entry.id === fileId);
  if (!file) throw new Error(`missing ${fileId}`);
  file.contentHash = hash;
  file.byteSize = byteSize;
  return copy;
}

export function copyBytes(view: Uint8Array): ArrayBuffer {
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
}
