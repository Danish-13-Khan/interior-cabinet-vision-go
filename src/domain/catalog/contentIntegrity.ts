/** SHA-256 content hashes use the `sha256:` prefix (roadmap §8.5). */
export const SHA256_CONTENT_HASH_RE = /^sha256:[a-f0-9]{64}$/;

export function isSha256ContentHash(hash: string): boolean {
  return SHA256_CONTENT_HASH_RE.test(hash);
}

export type IntegrityCheckResult =
  | { ok: true }
  | { ok: false; reason: "bad-hash-format" | "byte-size-mismatch" | "hash-mismatch" };

function hexFromBuffer(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Verify byte size and SHA-256 digest against a catalog file record. */
export async function verifyContentIntegrity(
  bytes: BufferSource,
  expectedHash: string,
  expectedByteSize: number,
): Promise<IntegrityCheckResult> {
  if (!isSha256ContentHash(expectedHash)) return { ok: false, reason: "bad-hash-format" };
  const length =
    bytes instanceof ArrayBuffer ? bytes.byteLength : bytes.byteLength;
  if (length !== expectedByteSize) return { ok: false, reason: "byte-size-mismatch" };
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const actual = `sha256:${hexFromBuffer(digest)}`;
  if (actual !== expectedHash) return { ok: false, reason: "hash-mismatch" };
  return { ok: true };
}
