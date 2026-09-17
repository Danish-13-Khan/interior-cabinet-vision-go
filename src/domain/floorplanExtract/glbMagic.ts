/** GLB binary starts with ASCII "glTF" (bytes 0–3). */
export async function assertGlbBlob(blob: Blob): Promise<Blob> {
  const head = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
  const magic =
    head.length >= 4
      ? String.fromCharCode(head[0], head[1], head[2], head[3])
      : "";
  if (magic !== "glTF") {
    throw new Error("Floor-plan export did not return a GLB (missing glTF header).");
  }
  return blob;
}

/** Build a tiny valid-looking GLB header blob for tests (not a full asset). */
export function testGlbHeaderBlob(extra: number[] = []): Blob {
  const bytes = new Uint8Array([0x67, 0x6c, 0x54, 0x46, ...extra]); // glTF
  return new Blob([bytes], { type: "model/gltf-binary" });
}
