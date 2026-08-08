/** Encode a Blob as a base64 string for Tauri string-based IPC. */
export async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuf = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}
