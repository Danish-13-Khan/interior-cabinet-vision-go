/**
 * Desktop project files are local documents, not an unbounded ingestion channel.
 * Applies to the project document itself (what autosave and finish imports measure).
 */
export const MAX_INTERIOR_PROJECT_FILE_BYTES = 25 * 1024 * 1024;

/**
 * Portable project files also embed imported GLB/texture bytes as base64 (~4/3 of the binary size),
 * so they get a separate, larger ceiling: roughly four maximum-size (25 MB) models plus the document.
 */
export const MAX_PORTABLE_PROJECT_FILE_BYTES = 150 * 1024 * 1024;

export function assertInteriorProjectFileByteLimit(byteLength: number) {
  if (byteLength > MAX_INTERIOR_PROJECT_FILE_BYTES) {
    throw new Error("Project file exceeds the 25 MB v1 safety limit.");
  }
}

export function assertPortableProjectFileByteLimit(byteLength: number) {
  if (byteLength > MAX_PORTABLE_PROJECT_FILE_BYTES) {
    throw new Error("Project file with embedded models exceeds the 150 MB limit. Remove or optimize imported models.");
  }
}
