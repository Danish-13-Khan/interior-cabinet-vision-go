/** Caps a hostile or broken zip before its uncompressed bytes are kept. */
export const MAX_ZIP_ENTRIES = 400;
export const MAX_ZIP_UNCOMPRESSED_BYTES = 400 * 1024 * 1024;

export function assertArchiveBudget(entryCount: number, uncompressedBytes: number): void {
  if (entryCount > MAX_ZIP_ENTRIES || uncompressedBytes > MAX_ZIP_UNCOMPRESSED_BYTES) {
    throw new Error("Cabinet file is too large to open.");
  }
}
