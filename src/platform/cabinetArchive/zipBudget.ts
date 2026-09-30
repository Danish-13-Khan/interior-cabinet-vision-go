/** Caps a hostile or broken zip before its uncompressed bytes are kept. */
export const MAX_ZIP_ENTRIES = 400;
export const MAX_ZIP_UNCOMPRESSED_BYTES = 400 * 1024 * 1024;

export function assertArchiveBudget(entryCount: number, uncompressedBytes: number): void {
  if (entryCount > MAX_ZIP_ENTRIES || uncompressedBytes > MAX_ZIP_UNCOMPRESSED_BYTES) {
    throw new Error("Cabinet file is too large to open.");
  }
}

/**
 * Saving uses the same budget as opening. Otherwise a large project saves fine and then
 * can never be reopened.
 */
export function assertPackBudget(entryCount: number, uncompressedBytes: number): void {
  if (entryCount <= MAX_ZIP_ENTRIES && uncompressedBytes <= MAX_ZIP_UNCOMPRESSED_BYTES) return;
  const megabytes = Math.ceil(uncompressedBytes / (1024 * 1024));
  const limit = MAX_ZIP_UNCOMPRESSED_BYTES / (1024 * 1024);
  throw new Error(
    entryCount > MAX_ZIP_ENTRIES
      ? `This project has too many files to save as a Cabinet file (${entryCount}, limit ${MAX_ZIP_ENTRIES}). Remove unused models or textures and try again.`
      : `This project is too large to save as a Cabinet file (${megabytes} MB, limit ${limit} MB). Remove unused models or textures and try again.`,
  );
}
